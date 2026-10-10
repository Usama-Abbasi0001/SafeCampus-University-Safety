import sys
import io
import cv2
import threading
import copy
import mediapipe as mp
import requests
import os
import time
import math
from datetime import datetime
from flask import Flask, Response
from flask_cors import CORS
from ultralytics import YOLO

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', line_buffering=True)

app = Flask(__name__)
CORS(app)

API_URL = "http://localhost:5000/api"

def calculate_distance(p1, p2):
    return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

class CameraProcessor:
    def __init__(self):
        self.frame = None
        self.lock = threading.Lock()
        self.running = False
        self.thread = None
        self.cap = None

    def start(self):
        if self.running: return
        self.running = True
        self.thread = threading.Thread(target=self._process_loop, daemon=True)
        self.thread.start()

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join()

    def _process_loop(self):
        print("[AI] Starting Specific Harassment Detection Engine...")
        
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
        
        try:
            yolo_model = YOLO('yolov8n.pt')
        except Exception as e:
            print("❌ YOLO model failed to load:", e)
            yolo_model = None
            
        print("[CAMERA] Waiting 2 seconds...")
        time.sleep(2)
        
        target_idx = int(os.environ.get("CAMERA_INDEX", 0))
        self.cap = cv2.VideoCapture(target_idx)
        
        if not self.cap.isOpened():
            self.cap = cv2.VideoCapture(0)
            
        print("✅ AI Engine Started.")
        
        incident_cooldown = 0
        action_timers = {}
        frame_count = 0
        
        while self.running and self.cap.isOpened():
            ret, frame = self.cap.read()
            if not ret:
                time.sleep(0.01)
                continue
                
            frame_count += 1
            
            # To reduce lag, only process AI on every 3rd frame
            if frame_count % 3 != 0:
                with self.lock:
                    # Still show the video feed smoothly without AI overlays for skipped frames
                    # Or keep the last display_frame. We'll keep the last display_frame if it exists
                    if getattr(self, 'last_display', None) is not None:
                        self.frame = self.last_display.copy()
                    else:
                        self.frame = frame.copy()
                continue
                
            # Resize frame slightly to speed up AI processing
            frame = cv2.resize(frame, (640, 480))
            display_frame = frame.copy()
            people_poses = []
            
            if yolo_model:
                results_yolo = yolo_model.track(frame, persist=True, classes=0, verbose=False)
                if len(results_yolo) > 0 and results_yolo[0].boxes is not None and results_yolo[0].boxes.id is not None:
                    boxes = results_yolo[0].boxes
                    
                    for i in range(len(boxes.id)):
                        track_id = int(boxes.id[i])
                        x1, y1, x2, y2 = map(int, boxes.xyxy[i])
                        
                        pad = 10
                        h, w, _ = frame.shape
                        y1_p, y2_p = max(0, y1 - pad), min(h, y2 + pad)
                        x1_p, x2_p = max(0, x1 - pad), min(w, x2 + pad)
                        
                        crop_img = frame[y1_p:y2_p, x1_p:x2_p]
                        if crop_img.shape[0] < 20 or crop_img.shape[1] < 20: continue
                        
                        crop_rgb = cv2.cvtColor(crop_img, cv2.COLOR_BGR2RGB)
                        res = pose.process(crop_rgb)
                        
                        if res.pose_landmarks:
                            landmarks = res.pose_landmarks.landmark
                            
                            def get_global_pt(lm):
                                if lm.visibility < 0.5: return None
                                return (int(lm.x * crop_img.shape[1]) + x1_p, int(lm.y * crop_img.shape[0]) + y1_p)
                                
                            person_data = {
                                "id": track_id,
                                "bbox": (x1, y1, x2, y2),
                                "nose": get_global_pt(landmarks[mp_pose.PoseLandmark.NOSE.value]),
                                "l_shoulder": get_global_pt(landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]),
                                "r_shoulder": get_global_pt(landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]),
                                "l_wrist": get_global_pt(landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value]),
                                "r_wrist": get_global_pt(landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value]),
                                "l_hip": get_global_pt(landmarks[mp_pose.PoseLandmark.LEFT_HIP.value]),
                                "r_hip": get_global_pt(landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value]),
                            }
                            
                            if person_data["l_shoulder"] and person_data["r_shoulder"]:
                                person_data["chest"] = (
                                    (person_data["l_shoulder"][0] + person_data["r_shoulder"][0]) // 2,
                                    (person_data["l_shoulder"][1] + person_data["r_shoulder"][1]) // 2
                                )
                                person_data["scale"] = calculate_distance(person_data["l_shoulder"], person_data["r_shoulder"])
                            else:
                                person_data["chest"] = None
                                person_data["scale"] = 50
                                
                            if person_data["l_hip"] and person_data["r_hip"]:
                                person_data["hips"] = (
                                    (person_data["l_hip"][0] + person_data["r_hip"][0]) // 2,
                                    (person_data["l_hip"][1] + person_data["r_hip"][1]) // 2
                                )
                            else:
                                person_data["hips"] = None
                                
                            people_poses.append(person_data)
                            cv2.rectangle(display_frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
                            cv2.putText(display_frame, f"ID: {track_id}", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 1)

            cv2.putText(display_frame, "Harassment Detection Active", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

            detected_event = None
            
            for i in range(len(people_poses)):
                for j in range(i + 1, len(people_poses)):
                    pA = people_poses[i]
                    pB = people_poses[j]
                    
                    pair_id = tuple(sorted([pA["id"], pB["id"]]))
                    scale = (pA["scale"] + pB["scale"]) / 2.0
                    
                    is_kissing = False
                    is_touching_chest = False
                    is_touching_hips = False
                    
                    if pA["nose"] and pB["nose"]:
                        dist = calculate_distance(pA["nose"], pB["nose"])
                        if dist < (scale * 0.6): 
                            is_kissing = True

                    def check_touch(wrists_A, target_B):
                        if not target_B: return False
                        for w in wrists_A:
                            if w and calculate_distance(w, target_B) < (scale * 0.6):
                                return True
                        return False
                    
                    wrists_A = [pA["l_wrist"], pA["r_wrist"]]
                    wrists_B = [pB["l_wrist"], pB["r_wrist"]]
                    
                    if check_touch(wrists_A, pB["chest"]) or check_touch(wrists_B, pA["chest"]):
                        is_touching_chest = True
                        
                    if check_touch(wrists_A, pB["hips"]) or check_touch(wrists_B, pA["hips"]):
                        is_touching_hips = True
                        
                    current_event = None
                    if is_kissing: current_event = "Intimate Contact (Kissing)"
                    elif is_touching_chest: current_event = "Inappropriate Touch (Chest)"
                    elif is_touching_hips: current_event = "Inappropriate Touch (Hips/Private)"
                    
                    if current_event:
                        if pair_id not in action_timers:
                            action_timers[pair_id] = {"type": current_event, "start": time.time()}
                        elif action_timers[pair_id]["type"] != current_event:
                            action_timers[pair_id] = {"type": current_event, "start": time.time()}
                        else:
                            duration = time.time() - action_timers[pair_id]["start"]
                            if duration >= 2.0:
                                detected_event = current_event
                    else:
                        if pair_id in action_timers:
                            del action_timers[pair_id]

            if detected_event and (time.time() - incident_cooldown > 10):
                alert_msg = f"ALERT: {detected_event}!"
                cv2.putText(display_frame, alert_msg, (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
                print(f"\n🚨 {alert_msg}")
                
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                os.makedirs("incidents", exist_ok=True)
                image_path = f"incidents/incident_{timestamp}.jpg"
                
                save_frame = frame.copy()
                cv2.putText(save_frame, alert_msg, (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)
                cv2.imwrite(image_path, save_frame)
                
                data = {
                    "type": detected_event,
                    "cameraId": "CAM-01",
                    "location": "Corridor/Library",
                    "status": "New",
                    "aiConfidence": 92,
                    "victimId": "VICTIM-001",
                    "harasserId": "HARASSER-001",
                }
                
                try:
                    with open(image_path, "rb") as img_file:
                        res = requests.post(f"{API_URL}/incidents", data=data, files={"evidenceImage": img_file})
                        if res.status_code == 201:
                            print("✅ Alert sent to Admin Dashboard.")
                except Exception as e:
                    print("❌ API Error:", e)
                    
                incident_cooldown = time.time()
                action_timers.clear()

            with self.lock:
                self.last_display = display_frame.copy()
                self.frame = display_frame.copy()

        if self.cap:
            self.cap.release()

processor = CameraProcessor()
processor.start()

def generate_frames():
    while True:
        with processor.lock:
            frame = processor.frame
        if frame is None:
            time.sleep(0.1)
            continue
            
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
            
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001, threaded=True)
