# SafeCampus Backend Technical Report

This report provides a comprehensive analysis of the existing Node.js + Express backend project to facilitate integration with the Harassment Detection frontend and AI/camera system.

## 1. Complete Backend Folder and File Structure

```text
backend/
├── .env
├── package.json
├── package-lock.json
├── server.js          (Main Entry Point)
├── seed.js            (Database seeder)
├── seedAll.js         (Database seeder for all collections)
├── models/            (Mongoose Schemas)
│   ├── Camera.js
│   ├── Incident.js
│   ├── Parent.js
│   ├── Setting.js
│   └── Student.js
├── routes/            (Express API Endpoints)
│   ├── authRoutes.js
│   ├── cameraRoutes.js
│   ├── incidentRoutes.js
│   ├── parentRoutes.js
│   ├── settingsRoutes.js
│   └── studentRoutes.js
└── uploads/           (Local directory for storing uploaded images)
```

## 2. Server Entry Point
The file that starts the Express server is **`server.js`**.

## 3. Port
The backend is currently running on Port **`5000`** (defined in `.env`).

## 4. Base URL
During local development, the backend base URL is **`http://localhost:5000`**.

## 5. Existing Express Routes
The following main routes are mounted in `server.js`:

| HTTP Method | Endpoint (Prefix + Route) | File Location | Purpose |
|-------------|---------------------------|---------------|---------|
| GET | `/` | `server.js` | Root status check |
| GET / POST / PUT / DELETE | `/api/students/*` | `routes/studentRoutes.js` | Student management and CRUD |
| GET / POST / PUT | `/api/incidents/*` | `routes/incidentRoutes.js` | Incident tracking and reporting |
| GET / POST | `/api/cameras/*` | `routes/cameraRoutes.js` | Camera monitoring management |
| GET / POST | `/api/settings/*` | `routes/settingsRoutes.js` | System and admin settings |
| GET / POST / PUT / DELETE | `/api/parents/*` | `routes/parentRoutes.js` | Parent management and CRUD |
| POST | `/api/auth/admin/login` | `routes/authRoutes.js` | Admin authentication |
| POST | `/api/auth/student/login` | `routes/authRoutes.js` | Student authentication |
| POST | `/api/auth/student/signup` | `routes/authRoutes.js` | Student registration |
| POST | `/api/auth/parent/login` | `routes/authRoutes.js` | Parent authentication |
| POST | `/api/auth/parent/signup` | `routes/authRoutes.js` | Parent registration |
| POST | `/api/auth/parent/verify-student`| `routes/authRoutes.js` | Verify student ID during Parent registration |

## 6. Incident API Analysis

**Does the endpoint exist?** Yes.

- **Exact Endpoint:** `POST /api/incidents`
- **Route File:** `backend/routes/incidentRoutes.js`
- **Controller File:** Logic is handled directly inside the route file.
- **Model/Schema File:** `backend/models/Incident.js`
- **Required Request Body:** `id`, `type`
- **Optional Request Body Fields:** `victim`, `victimId`, `victimDept`, `victimSemester`, `suspectedPerson`, `date`, `time`, `location`, `cameraId`, `aiConfidence`, `status`, `evidenceImage`, `notes`.
- **Response Format:** JSON (Returns the created incident object with HTTP status 201).
- **Validation Rules:** Basic Mongoose validation (requires `id` to be unique and `type` to exist).
- **Authentication Requirements:** **None.** The endpoint is completely unprotected. Any system (like the Python AI script) can POST to it without an API key or JWT.

## 7. MongoDB Incident Model

**Does the model exist?** Yes.

- **Model Name:** `Incident`
- **Collection Name:** `incidents`
- **Fields:**
  - `id`: String (Required, Unique)
  - `type`: String (Required)
  - `victim`: String (Optional)
  - `victimId`: String (Optional)
  - `victimDept`: String (Optional)
  - `victimSemester`: String (Optional)
  - `suspectedPerson`: String (Optional)
  - `date`: String (Optional)
  - `time`: String (Optional)
  - `location`: String (Optional)
  - `cameraId`: String (Optional)
  - `aiConfidence`: Number (Optional)
  - `status`: String (Optional, Default: `'New'`)
  - `evidenceImage`: String (Optional)
  - `notes`: String (Optional)

## 8. Evidence Image Upload Capabilities

**Can the backend receive evidence images for incidents?** **No, not currently.**

- **Multer Middleware:** Multer is installed and successfully used in `authRoutes.js`, `studentRoutes.js`, and `parentRoutes.js` for profile pictures.
- **Incident Image Endpoint:** The `POST /api/incidents` route **lacks** the Multer middleware (e.g., `upload.single('evidenceImage')`). It currently only accepts `application/json` data.
- **Where images are stored:** Locally in the `backend/uploads/` directory. They are served statically via `app.use('/uploads', express.static('uploads'))`.
- **Cloud Storage:** No cloud storage (Cloudinary, S3, Firebase) is configured. All media is strictly local.

## 9. MongoDB Atlas Connection

- **File location:** `backend/server.js` (line 14)
- **Environment Variable:** `MONGO_URI` (from `.env`)
- **Status:** **Working.** The backend successfully connects to the cluster upon startup (`✅ Connected to MongoDB Atlas`).

## 10. CORS Configuration

- **Is CORS enabled?** Yes.
- **Allowed Origins:** Currently, `app.use(cors())` is used without any specific origin restrictions. This means **ALL origins (`*`)** are allowed.
- **Frontend Communication:** Yes, the Harassment Detection frontend (running on Vite, typically port 5173 or 8443) can communicate with this backend without CORS errors.

## 11. Authentication and Authorization

- **JWT/Auth usage:** **No JWT is being used.** Authentication is extremely basic. 
  - Admin login simply checks against plaintext environment variables (`ADMIN_ID`, `ADMIN_PASSWORD`).
  - Student/Parent login checks plaintext passwords directly against the database fields.
- **Protected Routes:** **None.** There is no authentication middleware protecting the routes.
- **Role Access for Incident APIs:** Since there is no auth middleware, any user (Admin, Parent, Student, or unauthorized script) can theoretically GET, POST, or PUT incidents.

## 12. Missing Elements for Target Incident Data

You requested to send the following payload from the AI camera:
```json
{
  "type": "Physical Harassment",
  "cameraId": "CAM-01",
  "location": "Library",
  "status": "New",
  "evidenceImage": "incident.jpg"
}
```

**What is exactly missing?**
1. **Multer Integration in `incidentRoutes.js`:** The `POST /` route needs to be wrapped with `upload.single('evidenceImage')` to process `multipart/form-data`.
2. **File Path Handling:** The route logic needs to grab `req.file.filename`, prepend `/uploads/`, and save that string to the `evidenceImage` field in MongoDB.
3. **Missing Unique ID:** The `Incident` schema has `id` set as `required: true` and `unique: true`. The payload above does not contain an `id`. The Python script must generate and send a unique `id` (e.g., `INC-12345`), or the backend route needs to be modified to auto-generate one before saving.

## 13. How to add the missing functionality (When Ready)

When you are ready to integrate the Python AI system, you must update `backend/routes/incidentRoutes.js`. 
You will need to:
1. Import and configure `multer` at the top of the file (just like in `studentRoutes.js`).
2. Update the route definition from `router.post('/', async (req, res))` to `router.post('/', upload.single('evidenceImage'), async (req, res))`.
3. Auto-generate the required `id` field using `Date.now()` or `uuid` inside the controller.
4. Set `evidenceImage: req.file ? '/uploads/' + req.file.filename : ''`.

## 14. Simple Integration Diagram

```text
[USB Webcam / AI Detection (Python)]
       │
       │ (Sends POST /api/incidents with multipart/form-data)
       ▼
[Node.js + Express Backend]
       │
       │ (Saves image to /uploads, saves data to DB)
       ▼
[MongoDB Atlas]
       │
       │ (React fetches GET /api/incidents)
       ▼
[Harassment Detection Frontend (Admin Dashboard)]
```

## 15. Next Steps / Files to Open
To proceed with this integration, you should open the following files in VS Code:
1. `backend/routes/incidentRoutes.js` (To add Multer and handle the missing `id` field)
2. `backend/models/Incident.js` (For reference of the schema)
3. Your Python AI Script (To configure it to send a `POST` request with the image file and data)
