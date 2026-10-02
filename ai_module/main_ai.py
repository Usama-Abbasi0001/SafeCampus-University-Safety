import sys
import io
# Force stdout to UTF-8 to prevent charmap errors with DeepFace logging on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', line_buffering=True)

import cv2
import threading
import copy
import mediapipe as mp
import requests
import os
import time
import math
from deepface import DeepFace
from datetime import datetime
from flask import Flask, Response
from flask_cors import CORS
from ultralytics import YOLO

app = Flask(__name__)
CORS(app)

API_URL = "http://localhost:5000/api"
DB_PATH = "db"
WATCHING_MIN_DURATION = 10
WATCHING_CONFIDENCE_THRESHOLD = 0.85

def setup_face_database():
    """Fetches students from backend and downloads their profile pictures into the db folder for DeepFace."""
    print("🔄 Fetching student database from server...")
    if not os.path.exists(DB_PATH):
        os.makedirs(DB_PATH)
        
    # Clear old database images and cache to prevent stale face matching
    for f in os.listdir(DB_PATH):
        file_path = os.path.join(DB_PATH, f)
        if os.path.isfile(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                pass
                
    try:
        response = requests.get(f"{API_URL}/students")
        if response.status_code == 200:
            students = response.json()
            downloaded = 0
            for student in students:
                photo_url = student.get("photo", "")
                if photo_url:
                    if photo_url.startswith("/"):
                        photo_url = f"http://localhost:5000{photo_url}"
                    
                    if photo_url.startswith("http"):
                        try:
                            img_data = requests.get(photo_url).content
                            if len(img_data) > 0:
                                file_path = os.path.join(DB_PATH, f"{student['id']}.jpg")
                                with open(file_path, "wb") as handler:
                                    handler.write(img_data)
                                downloaded += 1
                        except Exception as e:
                            print(f"Failed to download {photo_url}: {e}")
            print(f"✅ Successfully loaded {downloaded} student faces into database.")
        else:
            print("❌ Failed to fetch students from backend.")
    except Exception as e:
        print(f"❌ Error setting up face database: {e}")

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
        print("[AI] Starting AI Engine...")
        setup_face_database()
        
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
        
        try:
            yolo_model = YOLO('yolov8n.pt')
        except Exception as e:
            print("❌ YOLO model failed to load:", e)
            yolo_model = None
            
        print("[CAMERA] Waiting 2 seconds for browser to release hardware lock...")
        time.sleep(2)
        
        print("[CAMERA] Searching for available cameras...")
        target_idx = int(os.environ.get("CAMERA_INDEX", 0))
        available_cameras = []
        
        for i in range(3):
            test_cap = cv2.VideoCapture(i)
            if test_cap.isOpened():
                ret, _ = test_cap.read()
                if ret:
                    print(f"[CAMERA] Index {i}: Available")
                    available_cameras.append(i)
                test_cap.release()
            else:
                print(f"[CAMERA] Index {i}: Unavailable")
                
        if target_idx not in available_cameras:
            if len(available_cameras) > 0:
                target_idx = available_cameras[-1]
            else:
                target_idx = 0

        print(f"[CAMERA] Selected camera index: {target_idx}")
        self.cap = cv2.VideoCapture(target_idx)
        
        if not self.cap.isOpened():
            print("[CAMERA] ERROR: Failed to open camera!")
            return
            
        print("[CAMERA] Camera opened successfully")
        print(f"[CAMERA] Resolution: {int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))}x{int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))}")
        print(f"[CAMERA] FPS: {int(self.cap.get(cv2.CAP_PROP_FPS))}")
        print("✅ AI Engine & Streaming started. Live on Dashboard!")
        
        incident_cooldown = 0
        watching_start_time = None
        
        while self.running and self.cap.isOpened():
            ret, frame = self.cap.read()
            if not ret:
                time.sleep(0.01)
                continue
                
            display_frame = frame.copy()
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Physical Harassment Detection via MediaPipe
            results_pose = pose.process(rgb_frame)
            fight_detected = False
            
            # Watching Detection via YOLO tracking
            watching_detected = False
            duration = 0
            watcher_idx = None # Track ID of the watcher
            target_idx = None # Track ID of the target
            
            num_people = 0
            boxes = None
            if yolo_model:
                results_yolo = yolo_model.track(frame, persist=True, classes=0, verbose=False)
                if len(results_yolo) > 0 and results_yolo[0].boxes is not None and results_yolo[0].boxes.id is not None:
                    boxes = results_yolo[0].boxes
                    num_people = len(boxes.id)
                    
                    if num_people == 2:
                        if watching_start_time is None:
                            watching_start_time = time.time()
                        
                        duration = time.time() - watching_start_time
                        cv2.putText(display_frame, f"Tracking: {int(duration)}s", (10, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
                        
                        if duration >= WATCHING_MIN_DURATION:
                            watching_detected = True
                            # Assign tentative roles (e.g., box 0 is watcher, box 1 is target)
                            # A real gaze model would determine this accurately.
                            watcher_idx = int(boxes.id[0])
                            target_idx = int(boxes.id[1])
                    else:
                        watching_start_time = None
                else:
                    watching_start_time = None

            # Only consider fight_detected if there are at least 2 people (Removes single-person false positive)
            if results_pose.pose_landmarks and num_people >= 2:
                landmarks = results_pose.pose_landmarks.landmark
                left_wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value]
                right_wrist = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value]
                left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
                right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
                
                if left_wrist.y < left_shoulder.y or right_wrist.y < right_shoulder.y:
                    fight_detected = True

            cv2.putText(display_frame, "SafeCampus Live AI Monitoring", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            # Trigger Incident
            if (fight_detected or watching_detected) and (time.time() - incident_cooldown > 15):
                incident_type = "Physical Aggression" if fight_detected else "Suspicious Observation"
                status_label = "Pending Review"
                alert_msg = f"{incident_type.upper()}!"
                cv2.putText(display_frame, alert_msg, (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)
                print(f"\n🚨 AUTOMATIC INCIDENT DETECTED: {alert_msg}")
                
                victim_id = "Unknown"
                harasser_id = "Unknown"
                
                # Correct identity detection by cropping bounding boxes
                detected_identities = {}
                used_student_ids = set()
                try:
                    if boxes is not None:
                        matches = []
                        for i in range(len(boxes.id)):
                            track_id = int(boxes.id[i])
                            x1, y1, x2, y2 = map(int, boxes.xyxy[i])
                            
                            # Expand bounding box slightly for face detection
                            pad = 20
                            y1_pad = max(0, y1 - pad)
                            y2_pad = min(frame.shape[0], y2 + pad)
                            x1_pad = max(0, x1 - pad)
                            x2_pad = min(frame.shape[1], x2 + pad)
                            
                            crop_img = frame[y1_pad:y2_pad, x1_pad:x2_pad]
                            if crop_img.shape[0] > 30 and crop_img.shape[1] > 30:
                                dfs = DeepFace.find(img_path=crop_img, db_path=DB_PATH, enforce_detection=False, silent=True)
                                if len(dfs) > 0 and len(dfs[0]) > 0:
                                    distance = dfs[0].iloc[0]['distance']
                                    threshold = dfs[0].iloc[0]['threshold']
                                    # Relax threshold slightly back to 0.9, but prevent duplicate mapping
                                    if distance <= threshold * 0.9:
                                        matched_file = dfs[0].iloc[0]['identity']
                                        student_id = os.path.basename(matched_file).split('.')[0]
                                        matches.append({
                                            'track_id': track_id,
                                            'student_id': student_id,
                                            'distance': distance
                                        })
                        
                        # Sort by distance (lowest is best) and assign
                        matches.sort(key=lambda x: x['distance'])
                        for match in matches:
                            if match['student_id'] not in used_student_ids:
                                detected_identities[match['track_id']] = match['student_id']
                                used_student_ids.add(match['student_id'])
                        
                        # Assign Unknown to any track_id that didn't get a unique match
                        for i in range(len(boxes.id)):
                            track_id = int(boxes.id[i])
                            if track_id not in detected_identities:
                                detected_identities[track_id] = "Unknown"
                except Exception as e:
                    print(f"Face recognition error: {e}")

                if watching_detected and watcher_idx is not None and target_idx is not None:
                    harasser_id = detected_identities.get(watcher_idx, "Unknown")
                    victim_id = detected_identities.get(target_idx, "Unknown")
                elif fight_detected and num_people >= 2:
                    # Random assignment for physical aggression if we don't know who is who yet
                    keys = list(detected_identities.keys())
                    if len(keys) >= 2:
                        harasser_id = detected_identities[keys[0]]
                        victim_id = detected_identities[keys[1]]
                elif len(detected_identities) > 0:
                     harasser_id = list(detected_identities.values())[0]

                print(f"👤 Detected Potential Aggressor: {harasser_id}, Potential Target: {victim_id}")

                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                os.makedirs("incidents", exist_ok=True)
                image_path = f"incidents/incident_{timestamp}.jpg"
                
                # Draw label on saved image
                save_frame = frame.copy()
                cv2.putText(save_frame, incident_type.upper(), (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 4)
                cv2.imwrite(image_path, save_frame)
                
                data = {
                    "type": incident_type,
                    "cameraId": "CAM-01",
                    "location": "Library",
                    "latitude": 33.6425,
                    "longitude": 72.9930,
                    "status": "Pending Review",
                    "aiConfidence": 98 if fight_detected else int(WATCHING_CONFIDENCE_THRESHOLD * 100),
                    "victimId": victim_id,
                    "harasserId": harasser_id,
                    "duration": round(duration, 1) if watching_detected else 0,
                    "notes": "Triggered by AI tracking. Roles are tentative and require admin review."
                }
                
                try:
                    with open(image_path, "rb") as img_file:
                        res = requests.post(f"{API_URL}/incidents", data=data, files={"evidenceImage": img_file})
                        if res.status_code == 201:
                            print("✅ Incident sent to dashboard automatically.")
                except Exception as e:
                    print("❌ Failed to send incident:", e)
                    
                incident_cooldown = time.time()
                watching_start_time = None # Reset after triggering

            with self.lock:
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
