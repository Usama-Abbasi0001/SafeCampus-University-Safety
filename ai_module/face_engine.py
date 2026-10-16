import sys
import io
import cv2
import os
import json
import numpy as np

if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
if hasattr(sys.stderr, 'buffer'):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', line_buffering=True)

class FaceRecognitionEngine:
    def __init__(self, known_faces_dir=None, students_data_path=None):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.known_faces_dir = known_faces_dir or os.path.join(base_dir, "known_faces")
        self.students_data_path = students_data_path or os.path.join(os.path.dirname(base_dir), "students_data.json")
        
        self.cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(self.cascade_path)
        
        self.recognizer = cv2.face.LBPHFaceRecognizer_create(radius=1, neighbors=8, grid_x=8, grid_y=8)
        self.label_to_id = {}
        self.id_to_name = {}
        self.is_trained = False
        
        self.load_student_names()
        self.train_engine()

    def load_student_names(self):
        # Enrolled student fallback
        default_names = {
            "2k22-cs-46": "Owais Ahmed",
        }
        for k, v in default_names.items():
            self.id_to_name[k.lower()] = v

        if os.path.exists(self.students_data_path):
            try:
                with open(self.students_data_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for item in data:
                        if "id" in item and "name" in item:
                            self.id_to_name[item["id"].lower()] = item["name"]
            except Exception as e:
                print(f"[FACE_AI] Could not load students_data.json: {e}")

    def train_engine(self):
        if not os.path.exists(self.known_faces_dir):
            os.makedirs(self.known_faces_dir, exist_ok=True)
            print(f"[FACE_AI] Created empty directory {self.known_faces_dir}")
            return

        faces = []
        labels = []
        current_label = 0

        image_files = [f for f in os.listdir(self.known_faces_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"[FACE_AI] Found {len(image_files)} student reference image(s) in {self.known_faces_dir}")

        for filename in image_files:
            student_id = os.path.splitext(filename)[0]
            norm_id = student_id.lower()
            img_path = os.path.join(self.known_faces_dir, filename)

            img = cv2.imread(img_path)
            if img is None:
                continue

            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            detected_faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60))

            face_crops = []
            if len(detected_faces) > 0:
                for (x, y, w, h) in detected_faces:
                    face_crops.append(gray[y:y+h, x:x+w])
            else:
                # If frontal cascade didn't catch it, use center-top 60% of image
                h, w = gray.shape
                face_crops.append(gray[int(h*0.1):int(h*0.7), int(w*0.15):int(w*0.85)])

            for crop in face_crops:
                resized = cv2.resize(crop, (160, 160))
                # Add original and slightly augmented versions for robustness
                faces.append(resized)
                labels.append(current_label)

                # Horizontal flip
                faces.append(cv2.flip(resized, 1))
                labels.append(current_label)

                # Equalized histogram for varying lighting
                eq = cv2.equalizeHist(resized)
                faces.append(eq)
                labels.append(current_label)

            self.label_to_id[current_label] = student_id
            name = self.id_to_name.get(norm_id, student_id)
            print(f"  -> Registered Student [{current_label}]: ID={student_id} ({name})")
            current_label += 1

        if len(faces) > 0:
            self.recognizer.train(faces, np.array(labels))
            self.is_trained = True
            print(f"[FACE_AI] Successfully trained on {len(faces)} face samples across {current_label} students.")
        else:
            print("[FACE_AI] No valid face samples found for training.")

    def recognize_crop(self, face_bgr):
        """
        Takes a BGR face crop and returns student identification.
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
            gray = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2GRAY)
            
            # Detect actual face within crop if possible
            detected = self.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=3, minSize=(40, 40))
            if len(detected) > 0:
                x, y, w, h = detected[0]
                target_crop = gray[y:y+h, x:x+w]
            else:
                target_crop = gray

            resized = cv2.resize(target_crop, (160, 160))
            label, distance = self.recognizer.predict(resized)

            student_id = self.label_to_id.get(label, "Unknown")
            student_name = self.id_to_name.get(student_id.lower(), student_id)

            # In LBPH: lower distance = better match.
            # < 75 is confident match, 75-90 is possible match, > 90 is unknown
            confidence = max(10, min(99, int(100 - (distance * 0.65))))
            
            is_match = distance < 85.0

            return {
                "studentId": student_id if is_match else "Unknown",
                "name": student_name if is_match else "Unknown Person",
                "confidence": confidence if is_match else max(20, confidence),
                "status": "Recognized" if is_match else "Unknown",
                "distance": float(round(distance, 2))
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
    test_img = "known_faces/2k22-cs-46.jpeg"
    if os.path.exists(test_img):
        res = engine.recognize_crop(cv2.imread(test_img))
        print("Self-test result for Owais:", res)
