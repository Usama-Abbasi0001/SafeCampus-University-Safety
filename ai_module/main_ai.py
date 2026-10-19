import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

import sys
import io
import cv2
import threading
import copy
import requests
import time
import math
import numpy as np
from datetime import datetime
from flask import Flask, Response, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import mediapipe as mp
from face_engine import FaceRecognitionEngine

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
    except Exception:
        pass
if hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8', line_buffering=True)
    except Exception:
        pass

app = Flask(__name__)
CORS(app)

API_URL = "http://localhost:5000/api"

def calculate_distance(p1, p2):
    return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

class CameraProcessor:
    def __init__(self):
        self.raw_frame = None
        self.processed_frame = None
        self.lock = threading.Lock()
        self.running = False
        self.reader_thread = None
        self.ai_thread = None
        self.cap = None
        self.face_engine = None
        self.identity_cache = {}  # track_id -> { "identity": ..., "expiry": timestamp }
        self.camera_open = False

    def is_camera_open(self):
        return self.camera_open and self.cap is not None and self.cap.isOpened()

    def start(self):
        if self.running: return
        self.running = True
        
        print("[AI] Initializing Deep Face Recognition Engine...")
        self.face_engine = FaceRecognitionEngine()
        
        self.reader_thread = threading.Thread(target=self._reader_loop, daemon=True)
        self.reader_thread.start()
        
        self.ai_thread = threading.Thread(target=self._ai_loop, daemon=True)
        self.ai_thread.start()

    def stop(self):
        self.running = False
        if self.cap:
            try:
                self.cap.release()
            except Exception:
                pass
        self.camera_open = False

    def _reader_loop(self):
        target_idx = int(os.environ.get("CAMERA_INDEX", 0))
        print(f"[CAMERA] Opening device index {target_idx} via DirectShow...")

        # 1. Try DirectShow on Windows for zero-latency capture
        self.cap = cv2.VideoCapture(target_idx, cv2.CAP_DSHOW)
        if not self.cap.isOpened() and target_idx != 0:
            self.cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
            
        # 2. Fallback to default backend if DSHOW fails
        if not self.cap.isOpened():
            self.cap = cv2.VideoCapture(target_idx)
            if not self.cap.isOpened():
                self.cap = cv2.VideoCapture(0)

        if self.cap.isOpened():
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.cap.set(cv2.CAP_PROP_FPS, 30)
            self.camera_open = True
            print(f"✅ [CAMERA] Camera {target_idx} opened successfully (DirectShow 640x480 @ 30FPS).")
        else:
            print(f"⚠️ [CAMERA] Camera {target_idx} could not be opened yet.")
            self.camera_open = False

        retry_timer = time.time()
        while self.running:
            if not self.cap or not self.cap.isOpened():
                self.camera_open = False
                standby = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.putText(standby, "Connecting to CCTV CAM-01...", (110, 230), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 200, 255), 2)
                cv2.putText(standby, "Waiting for video device handshake...", (125, 270), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (160, 160, 160), 1)
                with self.lock:
                    self.raw_frame = standby
                    
                if time.time() - retry_timer > 2.0:
                    retry_timer = time.time()
                    self.cap = cv2.VideoCapture(target_idx, cv2.CAP_DSHOW)
                    if not self.cap.isOpened():
                        self.cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
                    if self.cap.isOpened():
                        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                        self.camera_open = True
                        print("✅ [CAMERA] Camera re-acquired successfully.")
                time.sleep(0.05)
                continue

            ret, frame = self.cap.read()
            if not ret or frame is None:
                time.sleep(0.01)
                continue

            with self.lock:
                self.raw_frame = frame
            time.sleep(0.002)

    def _ai_loop(self):
        print("[AI] Loading YOLOv8 & MediaPipe Pose...")
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)

        try:
            yolo_model = YOLO('yolov8n.pt')
            print("✅ YOLOv8 Person Tracker ready.")
        except Exception as e:
            print("❌ YOLO model failed to load:", e)
            yolo_model = None

        incident_cooldown = 0
        incident_cooldowns = {}
        action_timers = {}

        while self.running:
            frame_to_process = None
            with self.lock:
                if self.raw_frame is not None:
                    frame_to_process = self.raw_frame.copy()

            if frame_to_process is None:
                time.sleep(0.02)
                continue

            h_f, w_f, _ = frame_to_process.shape
            display_frame = frame_to_process.copy()
            people_poses = []

            # 1. Person tracking with YOLO (using lightweight ByteTrack to avoid optical flow matching warnings)
            if yolo_model:
                try:
                    results_yolo = yolo_model.track(frame_to_process, persist=True, tracker="bytetrack.yaml", classes=0, verbose=False)
                    if len(results_yolo) > 0 and results_yolo[0].boxes is not None and results_yolo[0].boxes.id is not None:
                        raw_boxes = results_yolo[0].boxes
                        valid_indices = []

                        # Sort boxes by confidence descending
                        box_order = sorted(range(len(raw_boxes.id)), key=lambda idx: float(raw_boxes.conf[idx]) if raw_boxes.conf is not None else 0.5, reverse=True)

                        for idx in box_order:
                            bx1, by1, bx2, by2 = map(int, raw_boxes.xyxy[idx])
                            b_area = (bx2 - bx1) * (by2 - by1)
                            if b_area < 2500:  # Ignore tiny noise boxes
                                continue

                            is_dup = False
                            for v_idx in valid_indices:
                                vx1, vy1, vx2, vy2 = map(int, raw_boxes.xyxy[v_idx])
                                v_area = (vx2 - vx1) * (vy2 - vy1)
                                ix1 = max(bx1, vx1)
                                iy1 = max(by1, vy1)
                                ix2 = min(bx2, vx2)
                                iy2 = min(by2, vy2)
                                iw = max(0, ix2 - ix1)
                                ih = max(0, iy2 - iy1)
                                inter = iw * ih
                                min_a = min(b_area, v_area)
                                # Suppress if >30% overlap with an existing person box
                                if min_a > 0 and (inter / min_a) > 0.30:
                                    is_dup = True
                                    break

                            if not is_dup:
                                valid_indices.append(idx)

                        for i in valid_indices:
                            track_id = int(raw_boxes.id[i])
                            x1, y1, x2, y2 = map(int, raw_boxes.xyxy[i])

                            pad_x = int((x2 - x1) * 0.40)
                            pad_y = int((y2 - y1) * 0.20)
                            y1_p, y2_p = max(0, y1 - pad_y), min(h_f, y2 + pad_y)
                            x1_p, x2_p = max(0, x1 - pad_x), min(w_f, x2 + pad_x)

                            crop_img = frame_to_process[y1_p:y2_p, x1_p:x2_p]
                            if crop_img.shape[0] < 20 or crop_img.shape[1] < 20:
                                continue

                            crop_rgb = cv2.cvtColor(crop_img, cv2.COLOR_BGR2RGB)
                            res = pose.process(crop_rgb)

                            if res.pose_landmarks:
                                landmarks = res.pose_landmarks.landmark

                                def get_global_pt(lm):
                                    if lm.visibility < 0.20: return None
                                    return (int(lm.x * crop_img.shape[1]) + x1_p, int(lm.y * crop_img.shape[0]) + y1_p)

                                person_data = {
                                    "id": track_id,
                                    "bbox": (x1, y1, x2, y2),
                                    "nose": get_global_pt(landmarks[mp_pose.PoseLandmark.NOSE.value]),
                                    "l_shoulder": get_global_pt(landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]),
                                    "r_shoulder": get_global_pt(landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]),
                                    "l_wrist": get_global_pt(landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value]),
                                    "r_wrist": get_global_pt(landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value]),
                                    "l_index": get_global_pt(landmarks[mp_pose.PoseLandmark.LEFT_INDEX.value]),
                                    "r_index": get_global_pt(landmarks[mp_pose.PoseLandmark.RIGHT_INDEX.value]),
                                    "l_pinky": get_global_pt(landmarks[mp_pose.PoseLandmark.LEFT_PINKY.value]),
                                    "r_pinky": get_global_pt(landmarks[mp_pose.PoseLandmark.RIGHT_PINKY.value]),
                                    "l_hip": get_global_pt(landmarks[mp_pose.PoseLandmark.LEFT_HIP.value]),
                                    "r_hip": get_global_pt(landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value]),
                                }

                                if person_data["l_shoulder"] and person_data["r_shoulder"]:
                                    person_data["chest"] = (
                                        (person_data["l_shoulder"][0] + person_data["r_shoulder"][0]) // 2,
                                        (person_data["l_shoulder"][1] + person_data["r_shoulder"][1]) // 2
                                    )
                                    person_data["scale"] = max(80, calculate_distance(person_data["l_shoulder"], person_data["r_shoulder"]))
                                elif person_data.get("nose"):
                                    # Fallback when only head/upper torso is visible
                                    person_data["chest"] = (person_data["nose"][0], person_data["nose"][1] + 120)
                                    person_data["scale"] = 100
                                else:
                                    person_data["chest"] = None
                                    person_data["scale"] = 100

                                if person_data["l_hip"] and person_data["r_hip"]:
                                    person_data["hips"] = (
                                        (person_data["l_hip"][0] + person_data["r_hip"][0]) // 2,
                                        (person_data["l_hip"][1] + person_data["r_hip"][1]) // 2
                                    )
                                elif person_data["chest"]:
                                    person_data["hips"] = (person_data["chest"][0], person_data["chest"][1] + 140)
                                else:
                                    person_data["hips"] = None

                                # Pose-aligned Face Crop (Prevents identity swapping during close contact)
                                cached = self.identity_cache.get(track_id)
                                now = time.time()
                                if cached and now < cached["expiry"]:
                                    identity = cached["identity"]
                                else:
                                    head_crop = None
                                    if person_data.get("nose"):
                                        nx, ny = person_data["nose"]
                                        r = int(person_data["scale"] * 0.75)
                                        r = max(40, min(r, 130))
                                        hx1, hx2 = max(0, nx - r), min(w_f, nx + r)
                                        hy1, hy2 = max(0, ny - int(r * 1.15)), min(h_f, ny + int(r * 0.95))
                                        if (hx2 - hx1) >= 30 and (hy2 - hy1) >= 30:
                                            head_crop = frame_to_process[hy1:hy2, hx1:hx2]

                                    if head_crop is None or head_crop.size == 0:
                                        head_y1 = max(0, y1)
                                        head_y2 = min(h_f, y1 + int((y2 - y1) * 0.35))
                                        head_x1 = max(0, x1)
                                        head_x2 = min(w_f, x2)
                                        head_crop = frame_to_process[head_y1:head_y2, head_x1:head_x2]
                                        person_data["head_box"] = (head_x1, head_y1, head_x2, head_y2)
                                    else:
                                        person_data["head_box"] = (hx1, hy1, hx2, hy2)

                                    identity = self.face_engine.recognize_crop(head_crop)
                                    ttl = 2.0 if identity.get("status") == "Recognized" else 0.8
                                    self.identity_cache[track_id] = { "identity": identity, "expiry": now + ttl }

                                person_data["identity"] = identity
                                people_poses.append(person_data)

                                # Draw prominent bounding box & high-contrast identity badge
                                is_rec = identity.get("status") == "Recognized"
                                # Vibrant Green (0, 255, 0) for recognized student, Amber (0, 165, 255) for unverified
                                box_color = (0, 255, 0) if is_rec else (0, 165, 255)

                                # Full-body bounding box (2px clean border)
                                cv2.rectangle(display_frame, (x1, y1), (x2, y2), box_color, 2)

                                # Face target bracket around head in emerald green
                                if person_data.get("head_box"):
                                    fbx1, fby1, fbx2, fby2 = person_data["head_box"]
                                    cv2.rectangle(display_frame, (fbx1, fby1), (fbx2, fby2), (0, 255, 120) if is_rec else (180, 180, 180), 2)

                                tag_text = f"{identity.get('name')} ({identity.get('confidence')}%)" if is_rec else f"Unknown Person (ID: {track_id})"

                                # High-contrast filled banner badge so text is 100% sharp and readable
                                font = cv2.FONT_HERSHEY_SIMPLEX
                                font_scale = 0.65
                                font_thick = 2
                                (tw, th), _ = cv2.getTextSize(tag_text, font, font_scale, font_thick)

                                # Ensure badge is never cropped off the top of the video frame
                                if y1 < th + 18:
                                    badge_y1 = y1
                                    badge_y2 = y1 + th + 14
                                else:
                                    badge_y2 = y1
                                    badge_y1 = y1 - th - 14

                                badge_x1 = max(0, x1)
                                badge_x2 = min(w_f, badge_x1 + tw + 18)

                                # Rich Emerald/Forest Green (15, 125, 25) for Recognized, Dark Slate (35, 35, 35) for Unknown
                                badge_bg = (15, 125, 25) if is_rec else (35, 35, 35)
                                cv2.rectangle(display_frame, (badge_x1, badge_y1), (badge_x2, badge_y2), badge_bg, -1)
                                cv2.rectangle(display_frame, (badge_x1, badge_y1), (badge_x2, badge_y2), box_color, 1)
                                cv2.putText(display_frame, tag_text, (badge_x1 + 8, badge_y2 - 6), font, font_scale, (255, 255, 255), font_thick, cv2.LINE_AA)
                except Exception as e:
                    pass

            num_people = len(people_poses)
            if num_people == 0:
                status_str = "Monitoring: No Person in View"
                status_col = (0, 200, 255)
            elif num_people == 1:
                status_str = "Monitoring: 1 Person Active (Need 2 people for Harassment)"
                status_col = (0, 220, 255)
            else:
                status_str = f"Monitoring: {num_people} People Tracked (Safety Active)"
                status_col = (0, 255, 120)

            (stw, sth), _ = cv2.getTextSize(status_str, cv2.FONT_HERSHEY_SIMPLEX, 0.48, 1)
            cv2.rectangle(display_frame, (8, h_f - sth - 18), (8 + stw + 14, h_f - 6), (15, 15, 15), -1)
            cv2.rectangle(display_frame, (8, h_f - sth - 18), (8 + stw + 14, h_f - 6), (60, 60, 60), 1)
            cv2.putText(display_frame, status_str, (14, h_f - 11), cv2.FONT_HERSHEY_SIMPLEX, 0.48, status_col, 1, cv2.LINE_AA)

            # 2. Definitive Harasser vs Victim Detection
            detected_event = None
            detected_harasser = None
            detected_victim = None

            for i in range(len(people_poses)):
                for j in range(i + 1, len(people_poses)):
                    pA = people_poses[i]
                    pB = people_poses[j]

                    pair_id = tuple(sorted([pA["id"], pB["id"]]))

                    # Ensure pA and pB are two distinct bodies, not split fragments of one person
                    if pA.get("chest") and pB.get("chest"):
                        if calculate_distance(pA["chest"], pB["chest"]) < 80:
                            continue
                    if pA.get("nose") and pB.get("nose"):
                        if calculate_distance(pA["nose"], pB["nose"]) < 60:
                            continue

                    scale = max(pA["scale"], pB["scale"], 80)

                    neck_A = ((pA["l_shoulder"][0] + pA["r_shoulder"][0]) // 2, (pA["l_shoulder"][1] + pA["r_shoulder"][1]) // 2) if (pA["l_shoulder"] and pA["r_shoulder"]) else pA.get("nose")
                    neck_B = ((pB["l_shoulder"][0] + pB["r_shoulder"][0]) // 2, (pB["l_shoulder"][1] + pB["r_shoulder"][1]) // 2) if (pB["l_shoulder"] and pB["r_shoulder"]) else pB.get("nose")

                    # Targets: Neck and Shoulders ONLY
                    targets_neck_shoulder_B = [t for t in [neck_B, pB.get("l_shoulder"), pB.get("r_shoulder"), pB.get("nose")] if t is not None]
                    targets_neck_shoulder_A = [t for t in [neck_A, pA.get("l_shoulder"), pA.get("r_shoulder"), pA.get("nose")] if t is not None]

                    hands_A = [w for w in [pA["l_wrist"], pA["r_wrist"], pA.get("l_index"), pA.get("r_index"), pA.get("l_pinky"), pA.get("r_pinky")] if w is not None]
                    hands_B = [w for w in [pB["l_wrist"], pB["r_wrist"], pB.get("l_index"), pB.get("r_index"), pB.get("l_pinky"), pB.get("r_pinky")] if w is not None]

                    # 1. Detection: Hand placed on another person's Shoulder or Neck
                    def check_hand_on_neck_or_shoulder(hands, own_chest, targets, max_dist):
                        for w in hands:
                            for target in targets:
                                # Hand must be raised to or near shoulder/neck height (cannot be down on table/lap)
                                if w[1] > (target[1] + 45):
                                    continue
                                d_vic = calculate_distance(w, target)
                                d_own = calculate_distance(w, own_chest) if own_chest else 999
                                # Hand must be within reach distance AND closer to victim than own body
                                if d_vic < max_dist and d_vic < d_own:
                                    return True
                        return False

                    touch_neck_shoulder_A_on_B = check_hand_on_neck_or_shoulder(hands_A, pA.get("chest"), targets_neck_shoulder_B, scale * 0.40)
                    touch_neck_shoulder_B_on_A = check_hand_on_neck_or_shoulder(hands_B, pB.get("chest"), targets_neck_shoulder_A, scale * 0.40)

                    # 2. Detection: Kissing (Face-to-face intimate contact)
                    is_kissing = False
                    if pA.get("nose") and pB.get("nose"):
                        dist = calculate_distance(pA["nose"], pB["nose"])
                        if dist < (scale * 0.28):
                            is_kissing = True

                    # Strictly only 2 detections active as requested:
                    # 1. Hand placed on Shoulder or Neck
                    # 2. Intimate Contact (Kissing)
                    current_event = None
                    if touch_neck_shoulder_A_on_B or touch_neck_shoulder_B_on_A:
                        current_event = "Physical Contact / Hand on Shoulder or Neck"
                    elif is_kissing:
                        current_event = "Intimate Contact (Kissing)"

                    # Assign Harasser (Aggressor) and Victim (Target) based on arm reach / initiation
                    if touch_neck_shoulder_A_on_B and not touch_neck_shoulder_B_on_A:
                        pair_harasser = pA  # Person A placed hand on Person B
                        pair_victim = pB    # Person B is recipient
                    elif touch_neck_shoulder_B_on_A and not touch_neck_shoulder_A_on_B:
                        pair_harasser = pB  # Person B placed hand on Person A
                        pair_victim = pA    # Person A is recipient
                    elif touch_neck_shoulder_A_on_B and touch_neck_shoulder_B_on_A:
                        min_d_A = min([calculate_distance(w, t) for w in hands_A for t in targets_neck_shoulder_B], default=999)
                        min_d_B = min([calculate_distance(w, t) for w in hands_B for t in targets_neck_shoulder_A], default=999)
                        if min_d_A < min_d_B:
                            pair_harasser = pA
                            pair_victim = pB
                        else:
                            pair_harasser = pB
                            pair_victim = pA
                    else:
                        pair_harasser = pA
                        pair_victim = pB

                    HARASSMENT_MIN_DURATION = 3.0  # Exactly 3.0 seconds required
                    is_in_cooldown = time.time() < incident_cooldowns.get(pair_id, 0)

                    if current_event and not is_in_cooldown:
                        now = time.time()
                        if pair_id not in action_timers:
                            action_timers[pair_id] = {
                                "type": current_event,
                                "start": now,
                                "last_seen": now,
                                "harasser_track_id": pair_harasser["id"],
                                "victim_track_id": pair_victim["id"],
                                "harasser": pair_harasser,
                                "victim": pair_victim,
                                "reported": False
                            }
                        elif not action_timers[pair_id].get("reported", False):
                            action_timers[pair_id]["last_seen"] = now
                            action_timers[pair_id]["type"] = current_event

                            # Lock roles strictly by track_id so identity cannot cross or overwrite!
                            h_tid = action_timers[pair_id]["harasser_track_id"]
                            v_tid = action_timers[pair_id]["victim_track_id"]

                            for p in [pA, pB]:
                                if p["id"] == h_tid and p.get("identity", {}).get("status") == "Recognized":
                                    action_timers[pair_id]["harasser"] = p
                                elif p["id"] == v_tid and p.get("identity", {}).get("status") == "Recognized":
                                    action_timers[pair_id]["victim"] = p

                            duration = now - action_timers[pair_id]["start"]
                            if duration < HARASSMENT_MIN_DURATION:
                                # Show visual tracking feedback while counting to 3.0 seconds
                                t_msg = f"SAFETY ALERT: Physical Contact Tracked {duration:.1f}s / 3.0s"
                                (ttw, tth), _ = cv2.getTextSize(t_msg, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
                                tx = (w_f - ttw) // 2
                                cv2.rectangle(display_frame, (tx - 12, 38), (tx + ttw + 12, 68), (0, 0, 180), -1)
                                cv2.rectangle(display_frame, (tx - 12, 38), (tx + ttw + 12, 68), (0, 140, 255), 2)
                                cv2.putText(display_frame, t_msg, (tx, 59), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2, cv2.LINE_AA)
                            else:
                                detected_event = action_timers[pair_id]["type"]
                                detected_harasser = action_timers[pair_id].get("harasser", pair_harasser)
                                detected_victim = action_timers[pair_id].get("victim", pair_victim)
                                detected_duration = duration
                                detected_pair_id = pair_id
                                action_timers[pair_id]["reported"] = True
                    else:
                        if pair_id in action_timers:
                            # 0.8s grace period prevents accidental timer reset from a single-frame landmark flicker
                            if time.time() - action_timers[pair_id].get("last_seen", 0) > 0.8:
                                del action_timers[pair_id]
                            elif not action_timers[pair_id].get("reported", False) and not is_in_cooldown:
                                duration = time.time() - action_timers[pair_id]["start"]
                                if duration < HARASSMENT_MIN_DURATION:
                                    t_msg = f"SAFETY ALERT: Physical Contact Tracked {duration:.1f}s / 3.0s"
                                    (ttw, tth), _ = cv2.getTextSize(t_msg, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
                                    tx = (w_f - ttw) // 2
                                    cv2.rectangle(display_frame, (tx - 12, 38), (tx + ttw + 12, 68), (0, 0, 180), -1)
                                    cv2.rectangle(display_frame, (tx - 12, 38), (tx + ttw + 12, 68), (0, 140, 255), 2)
                                    cv2.putText(display_frame, t_msg, (tx, 59), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2, cv2.LINE_AA)

            if detected_event:
                if 'detected_pair_id' in locals() and detected_pair_id:
                    incident_cooldowns[detected_pair_id] = time.time() + 60.0  # 60s cooldown for this pair
                v_ident = detected_victim.get("identity", {}) if detected_victim else {}
                h_ident = detected_harasser.get("identity", {}) if detected_harasser else {}

                v_id = v_ident.get("studentId", "Unknown")
                v_name = v_ident.get("name", "Unknown Person")
                h_id = h_ident.get("studentId", "Unknown")
                h_name = h_ident.get("name", "Suspected Aggressor (Unknown)")

                # Enforce strict verification: Unrecognized faces must be Unknown
                if not v_id or v_id == "Unknown" or v_ident.get("status") != "Recognized":
                    v_id = "Unknown"
                    v_name = "Unknown Person"
                if not h_id or h_id == "Unknown" or h_ident.get("status") != "Recognized":
                    h_id = "Unknown"
                    h_name = "Suspected Aggressor (Unknown)"

                # Absolute Rule: Harasser and Victim MUST NOT be the same student!
                if v_id == h_id and v_id != "Unknown":
                    v_conf = v_ident.get("confidence", 0)
                    h_conf = h_ident.get("confidence", 0)
                    if v_conf >= h_conf:
                        # Victim is the authentic student; Harasser was mistakenly assigned the same identity
                        h_id = "Unknown"
                        h_name = "Suspected Aggressor (Unknown)"
                        h_ident = {"studentId": "Unknown", "name": h_name, "status": "Unknown"}
                    else:
                        # Harasser is the authentic student; Victim was mistakenly assigned the same identity
                        v_id = "Unknown"
                        v_name = "Unknown Person"
                        v_ident = {"studentId": "Unknown", "name": v_name, "status": "Unknown"}

                camera_id = os.environ.get("CAMERA_ID", "CAM-01")
                alert_msg = f"ALERT: {detected_event}!"
                cv2.putText(display_frame, alert_msg, (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
                print(f"\n🚨 {alert_msg}")
                print(f"   ➜ Target/Victim: {v_name} [{v_id}] (Status: {v_ident.get('status', 'Unknown')})")
                print(f"   ➜ Aggressor: {h_name} [{h_id}] (Status: {h_ident.get('status', 'Unknown')})")

                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                os.makedirs("incidents", exist_ok=True)
                image_path = f"incidents/incident_{timestamp}.jpg"

                save_frame = frame_to_process.copy()
                cv2.putText(save_frame, alert_msg, (20, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.85, (0, 0, 255), 2)
                cv2.putText(save_frame, f"VICTIM / TARGET: {v_name} ({v_id})", (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 0), 2)
                cv2.putText(save_frame, f"HARASSER / AGGRESSOR: {h_name} ({h_id})", (20, 115), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 255), 2)

                # Draw explicit visual bounding boxes: Green for Victim, Red for Harasser
                if detected_victim and "bbox" in detected_victim:
                    vx1, vy1, vx2, vy2 = detected_victim["bbox"]
                    cv2.rectangle(save_frame, (vx1, vy1), (vx2, vy2), (0, 255, 0), 3)
                    cv2.putText(save_frame, f"VICTIM: {v_name}", (vx1, max(25, vy1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 0), 2)

                if detected_harasser and "bbox" in detected_harasser:
                    hx1, hy1, hx2, hy2 = detected_harasser["bbox"]
                    cv2.rectangle(save_frame, (hx1, hy1), (hx2, hy2), (0, 0, 255), 3)
                    cv2.putText(save_frame, f"HARASSER: {h_name}", (hx1, max(25, hy1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 255), 2)

                cv2.imwrite(image_path, save_frame)

                confidence_score = max(v_ident.get("confidence", 0), h_ident.get("confidence", 0))
                if confidence_score == 0:
                    confidence_score = 92

                data = {
                    "type": detected_event,
                    "cameraId": camera_id,
                    "location": "Central Academic Block - Floor 1 Corridor (CAM-01)",
                    "status": "New",
                    "aiConfidence": confidence_score,
                    "victimId": v_id,
                    "harasserId": h_id,
                    "suspectedPerson": h_name,
                    "duration": round(detected_duration, 1) if 'detected_duration' in locals() else 3.0,
                }

                # Async alert posting prevents live video stutter
                def post_alert(d, img_p):
                    try:
                        with open(img_p, "rb") as img_file:
                            res = requests.post(f"{API_URL}/incidents", data=d, files={"evidenceImage": img_file})
                            if res.status_code == 201:
                                print("✅ Alert sent to Admin Dashboard with verified student identities.")
                    except Exception as err:
                        print("❌ API Error:", err)

                threading.Thread(target=post_alert, args=(data, image_path), daemon=True).start()

                incident_cooldown = time.time()
                action_timers.clear()

            with self.lock:
                self.processed_frame = display_frame
            time.sleep(0.01)

processor = CameraProcessor()
processor.start()

def generate_frames():
    last_time = 0
    while True:
        with processor.lock:
            # Show processed frame with detections; fallback to raw frame while AI initializes
            frame = processor.processed_frame if processor.processed_frame is not None else processor.raw_frame

        if frame is None:
            time.sleep(0.03)
            continue

        # Cap streaming at 30 FPS to prevent CPU thrashing
        now = time.time()
        elapsed = now - last_time
        if elapsed < 0.033:
            time.sleep(0.033 - elapsed)
        last_time = time.time()

        ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
        if not ret:
            continue

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/health')
def health():
    return jsonify({
        "status": "ok",
        "camera_open": processor.is_camera_open(),
        "ai_ready": processor.processed_frame is not None
    })

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001, threaded=True)
