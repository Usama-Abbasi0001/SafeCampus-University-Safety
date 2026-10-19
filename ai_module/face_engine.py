import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

import sys
import io
import cv2
import json
import requests
import torch
import numpy as np
from facenet_pytorch import InceptionResnetV1
import mediapipe as mp

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
if hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

class FaceRecognitionEngine:
    def __init__(self, known_faces_dir=None, students_data_path=None):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.base_dir = base_dir
        self.known_faces_dir = known_faces_dir or os.path.join(base_dir, "known_faces")
        self.students_data_path = students_data_path or os.path.join(os.path.dirname(base_dir), "students_data.json")
        self.uploads_dir = os.path.join(os.path.dirname(base_dir), "backend", "uploads")
        
        # Load MediaPipe Face Detector
        self.mp_face = mp.solutions.face_detection
        self.detector = self.mp_face.FaceDetection(model_selection=1, min_detection_confidence=0.35)
        
        # Load InceptionResnetV1 Face Embedding Model
        print("[FACE_AI] Loading Deep FaceNet Embedding Model (InceptionResnetV1)...")
        try:
            self.resnet = InceptionResnetV1(pretrained='vggface2').eval()
            self.has_resnet = True
            print("✅ FaceNet InceptionResnetV1 loaded successfully.")
        except Exception as e:
            print(f"⚠️ FaceNet load error: {e}. Falling back to LBPH.")
            self.resnet = None
            self.has_resnet = False

        # Load LBPH as complementary/fallback recognizer
        self.cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(self.cascade_path)
        self.recognizer = cv2.face.LBPHFaceRecognizer_create(radius=1, neighbors=8, grid_x=8, grid_y=8)
        
        # Data stores
        self.student_records = {} # student_id -> full dict
        self.student_embeddings = {} # student_id -> list of normalized 512-D vectors
        self.label_to_id = {}
        self.id_to_name = {}
        self.is_trained = False
        
        # Enforce strict recognition threshold to avoid false matches
        # Cosine similarity: 1.0 = identical, 0.58+ = high confidence match
        # Anything below 0.55 is marked as Unknown!
        self.SIMILARITY_THRESHOLD = 0.56
        self.LBPH_DISTANCE_THRESHOLD = 68.0

        self.load_student_database()
        self.train_engine()

    def load_student_database(self):
        """
        Dynamically fetches registered students from:
        1. Node.js backend API (http://localhost:5000/api/students)
        2. Local students_data.json
        3. Hardcoded verified defaults (Usama, Uzefa, Haris, Owais)
        """
        # Verified baseline students
        baseline = {
            "2k22-cs-44": { "id": "2k22-cs-44", "name": "M.Usama Abbasi", "department": "Computer Science", "semester": "8th Semester", "photo": "/uploads/1792334582989-WhatsApp Image 2026-10-18 at 7.41.53 PM.jpeg" },
            "2k22-cs-42": { "id": "2k22-cs-42", "name": "M.Huzaifa", "department": "BSCS", "semester": "8th Semester", "photo": "/uploads/1792332532084.jpeg" },
            "2k22-cs-04": { "id": "2k22-cs-04", "name": "Muhammad Haris", "department": "Computer Science", "semester": "8th Semester", "photo": "/uploads/1789556697836.jpg" },
            "2k22-cs-46": { "id": "2k22-cs-46", "name": "Owais Ahmed", "department": "Computer Science", "semester": "8th Semester", "photo": "/uploads/1792060363851.jpeg" }
        }
        for k, v in baseline.items():
            norm_k = k.lower()
            self.student_records[norm_k] = v
            self.id_to_name[norm_k] = v["name"]

        # 1. Read students_data.json
        if os.path.exists(self.students_data_path):
            try:
                with open(self.students_data_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for item in data:
                        if "id" in item and "name" in item:
                            norm_id = item["id"].lower()
                            self.student_records[norm_id] = { **self.student_records.get(norm_id, {}), **item }
                            self.id_to_name[norm_id] = item["name"]
            except Exception as e:
                print(f"[FACE_AI] Could not load students_data.json: {e}")

        # 2. Try fetching live from backend API
        try:
            res = requests.get("http://localhost:5000/api/students", timeout=2)
            if res.status_code == 200:
                students = res.json()
                print(f"[FACE_AI] Synced {len(students)} registered student(s) from Backend API.")
                for s in students:
                    if "id" in s and "name" in s:
                        norm_id = s["id"].lower()
                        self.student_records[norm_id] = { **self.student_records.get(norm_id, {}), **s }
                        self.id_to_name[norm_id] = s["name"]

                        # Cache photo to known_faces if not already there
                        photo_path = s.get("photo", "")
                        if photo_path:
                            # Strip http://localhost:5000 if present
                            rel_photo = photo_path.replace("http://localhost:5000", "").replace("http://127.0.0.1:5000", "")
                            if rel_photo.startswith("/uploads/"):
                                local_up = os.path.join(self.uploads_dir, rel_photo.replace("/uploads/", ""))
                                target_kf = os.path.join(self.known_faces_dir, f"{norm_id}.jpeg")
                                if os.path.exists(local_up):
                                    needs_copy = False
                                    if not os.path.exists(target_kf):
                                        needs_copy = True
                                    elif os.path.getsize(local_up) != os.path.getsize(target_kf) or os.path.getmtime(local_up) > os.path.getmtime(target_kf):
                                        needs_copy = True
                                    
                                    if needs_copy:
                                        try:
                                            import shutil
                                            shutil.copyfile(local_up, target_kf)
                                            print(f"✅ [FACE_AI] Updated and enrolled new student photo for {norm_id} from {rel_photo}")
                                        except Exception as err:
                                            print(f"❌ [FACE_AI] Error caching photo for {norm_id}: {err}")
        except Exception as e:
            print(f"[FACE_AI] Backend API sync note: {e}")

    def align_and_crop_face(self, img_bgr):
        """
        Detects face and aligns rotation based on eye angles using MediaPipe landmarks.
        Returns a centered, upright (160, 160) RGB face crop.
        """
        if img_bgr is None or img_bgr.size == 0:
            return None

        h, w, _ = img_bgr.shape
        rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        
        res = self.detector.process(rgb)
        if not res.detections:
            # Fallback to Haar cascade
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            detected = self.face_cascade.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=3, minSize=(50, 50))
            if len(detected) > 0:
                x, y, fw, fh = detected[0]
                pad = int(min(fw, fh) * 0.1)
                x1, y1 = max(0, x - pad), max(0, y - pad)
                x2, y2 = min(w, x + fw + pad), min(h, y + fh + pad)
                return cv2.resize(rgb[y1:y2, x1:x2], (160, 160))
            # Fallback center-top 60%
            return cv2.resize(rgb[int(h*0.1):int(h*0.75), int(w*0.15):int(w*0.85)], (160, 160))

        detection = res.detections[0]
        bb = detection.location_data.relative_bounding_box
        
        # Keypoints: 0=right eye, 1=left eye, 2=nose tip, 3=mouth center
        keypoints = detection.location_data.relative_keypoints
        
        # Compute face alignment angle if both eyes exist
        aligned_rgb = rgb
        if len(keypoints) >= 2:
            re = (keypoints[0].x * w, keypoints[0].y * h)
            le = (keypoints[1].x * w, keypoints[1].y * h)
            dx = le[0] - re[0]
            dy = le[1] - re[1]
            angle = np.degrees(np.arctan2(dy, dx))
            
            # Rotate if angle is noticeable
            if abs(angle) > 2.0:
                eye_center = ((re[0] + le[0]) / 2.0, (re[1] + le[1]) / 2.0)
                M = cv2.getRotationMatrix2D(eye_center, angle, 1.0)
                aligned_rgb = cv2.warpAffine(rgb, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)

        # Crop face bounding box with slight padding
        x1 = max(0, int(bb.xmin * w) - int(bb.width * w * 0.1))
        y1 = max(0, int(bb.ymin * h) - int(bb.height * h * 0.1))
        x2 = min(w, int((bb.xmin + bb.width) * w) + int(bb.width * w * 0.1))
        y2 = min(h, int((bb.ymin + bb.height) * h) + int(bb.height * h * 0.1))

        if x2 - x1 < 20 or y2 - y1 < 20:
            return cv2.resize(rgb, (160, 160))

        face_crop = aligned_rgb[y1:y2, x1:x2]
        return cv2.resize(face_crop, (160, 160))

    def extract_facenet_embedding(self, face_rgb_160):
        """
        Passes a (160, 160, 3) RGB face crop through InceptionResnetV1.
        Returns a 512-D L2-normalized float32 numpy vector.
        """
        if not self.has_resnet or face_rgb_160 is None:
            return None

        tensor = torch.tensor(face_rgb_160).permute(2, 0, 1).float()
        tensor = (tensor - 127.5) / 128.0
        tensor = tensor.unsqueeze(0)

        with torch.no_grad():
            emb = self.resnet(tensor).numpy()[0]
        norm = np.linalg.norm(emb)
        if norm > 0:
            emb = emb / norm
        return emb

    def train_engine(self):
        """
        Loads reference photos from known_faces/ directory and builds:
        1. Deep FaceNet embeddings database (multi-sample augmented)
        2. LBPH recognizer models
        """
        if not os.path.exists(self.known_faces_dir):
            os.makedirs(self.known_faces_dir, exist_ok=True)

        faces_lbph = []
        labels_lbph = []
        current_label = 0

        image_files = [f for f in os.listdir(self.known_faces_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"[FACE_AI] Enrolling {len(image_files)} student reference portrait(s) from {self.known_faces_dir}")

        for filename in image_files:
            student_id = os.path.splitext(filename)[0]
            norm_id = student_id.lower()
            img_path = os.path.join(self.known_faces_dir, filename)

            img = cv2.imread(img_path)
            if img is None:
                continue

            aligned_rgb = self.align_and_crop_face(img)
            if aligned_rgb is None:
                continue

            # Store Deep FaceNet Embeddings (with augmentation: original, flipped, gamma)
            embeddings = []
            if self.has_resnet:
                # 1. Normal
                e1 = self.extract_facenet_embedding(aligned_rgb)
                if e1 is not None: embeddings.append(e1)

                # 2. Horizontal Flip
                flipped = cv2.flip(aligned_rgb, 1)
                e2 = self.extract_facenet_embedding(flipped)
                if e2 is not None: embeddings.append(e2)

                # 3. Brightness adjustment for indoor lights
                gamma_adjusted = np.clip((aligned_rgb / 255.0) ** 0.8 * 255.0, 0, 255).astype(np.uint8)
                e3 = self.extract_facenet_embedding(gamma_adjusted)
                if e3 is not None: embeddings.append(e3)

                self.student_embeddings[norm_id] = embeddings

            # Prepare LBPH samples
            gray = cv2.cvtColor(aligned_rgb, cv2.COLOR_RGB2GRAY)
            eq = cv2.equalizeHist(gray)
            
            faces_lbph.append(gray)
            labels_lbph.append(current_label)
            faces_lbph.append(cv2.flip(gray, 1))
            labels_lbph.append(current_label)
            faces_lbph.append(eq)
            labels_lbph.append(current_label)

            self.label_to_id[current_label] = student_id
            name = self.id_to_name.get(norm_id, student_id)
            print(f"  -> Enrolled Student [{current_label}]: ID={student_id} ({name}) with {len(embeddings)} FaceNet embedding(s)")
            current_label += 1

        if len(faces_lbph) > 0:
            self.recognizer.train(faces_lbph, np.array(labels_lbph))
            self.is_trained = True
            print(f"[FACE_AI] Enrolled {current_label} registered students successfully.")
        else:
            print("⚠️ [FACE_AI] No valid face samples found for enrollment.")

    def recognize_crop(self, face_bgr):
        """
        Takes a BGR face crop from the live camera stream.
        Applies face alignment, runs FaceNet 512-D cosine comparison + LBPH.
        CRITICAL: If uncertain, outputs 'Unknown' and NEVER attributes to another student.
        """
        if not self.is_trained or face_bgr is None or face_bgr.size == 0:
            return {
                "studentId": "Unknown",
                "name": "Unknown Person",
                "confidence": 0,
                "status": "Unknown",
                "distance": 999.0
            }

        try:
            # 1. Align and crop incoming face
            aligned_rgb = self.align_and_crop_face(face_bgr)
            if aligned_rgb is None:
                return {
                    "studentId": "Unknown",
                    "name": "Unknown Person",
                    "confidence": 0,
                    "status": "Unknown",
                    "distance": 999.0
                }

            # 2. Deep FaceNet Embedding Recognition
            best_student_id = "Unknown"
            best_sim = -1.0
            second_best_sim = -1.0

            if self.has_resnet and len(self.student_embeddings) > 0:
                query_emb = self.extract_facenet_embedding(aligned_rgb)
                if query_emb is not None:
                    sim_scores = {}
                    for sid, emb_list in self.student_embeddings.items():
                        # Maximum similarity across all enrolled poses of this student
                        max_s = max(float(np.dot(query_emb, e)) for e in emb_list)
                        sim_scores[sid] = max_s

                    # Sort by highest similarity
                    sorted_sims = sorted(sim_scores.items(), key=lambda x: x[1], reverse=True)
                    if len(sorted_sims) > 0:
                        best_student_id, best_sim = sorted_sims[0]
                    if len(sorted_sims) > 1:
                        second_best_sim = sorted_sims[1][1]

            # 3. LBPH Recognizer check as secondary verification
            gray = cv2.cvtColor(aligned_rgb, cv2.COLOR_RGB2GRAY)
            lbph_label, lbph_dist = self.recognizer.predict(gray)
            lbph_sid = self.label_to_id.get(lbph_label, "Unknown").lower()

            # 4. Strict Decision Logic
            is_match = False
            best_dist = 1.0 - best_sim if best_sim > 0 else (lbph_dist / 100.0)

            # High confidence threshold
            if best_sim >= self.SIMILARITY_THRESHOLD:
                # Require margin if another candidate is close
                if best_sim - second_best_sim >= 0.08 or len(self.student_embeddings) == 1:
                    is_match = True
                elif lbph_sid == best_student_id and lbph_dist < self.LBPH_DISTANCE_THRESHOLD:
                    is_match = True

            # If FaceNet unavailable, rely strictly on LBPH with tight threshold
            elif not self.has_resnet and lbph_dist < self.LBPH_DISTANCE_THRESHOLD:
                best_student_id = lbph_sid
                is_match = True
                best_sim = max(0.5, 1.0 - (lbph_dist / 100.0))

            if is_match and best_student_id != "Unknown":
                student_info = self.student_records.get(best_student_id.lower(), {})
                student_name = student_info.get("name") or self.id_to_name.get(best_student_id.lower(), best_student_id)
                confidence = max(60, min(99, int(best_sim * 100)))

                return {
                    "studentId": student_info.get("id", best_student_id),
                    "name": student_name,
                    "department": student_info.get("department", "Computer Science"),
                    "semester": student_info.get("semester", "8th Semester"),
                    "confidence": confidence,
                    "status": "Recognized",
                    "distance": float(round(best_dist, 3))
                }
            else:
                # UNCERTAIN -> MUST BE UNKNOWN
                return {
                    "studentId": "Unknown",
                    "name": "Unknown Person",
                    "confidence": 0,
                    "status": "Unknown",
                    "distance": float(round(best_dist, 3))
                }

        except Exception as e:
            print(f"[FACE_AI] Recognition error: {e}")
            return {
                "studentId": "Unknown",
                "name": "Unknown Person",
                "confidence": 0,
                "status": "Unknown",
                "distance": 999.0
            }

if __name__ == "__main__":
    engine = FaceRecognitionEngine()
    print("Testing recognition on known faces...")
    for f in os.listdir(engine.known_faces_dir):
        p = os.path.join(engine.known_faces_dir, f)
        img = cv2.imread(p)
        res = engine.recognize_crop(img)
        print(f"Self-recognition on {f}:", res)
