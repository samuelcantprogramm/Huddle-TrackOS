# Huddle TrackOS — Full-Stack Virtual Assistant Pipeline & Quality Assurance Hub

Huddle TrackOS is an executive-grade full-stack operations management platform designed for agencies managing distributed Virtual Assistant (VA) teams. It features real-time client pipeline tracking, automated work distribution, QA deliverable reviews with file proof validation, a Google Calendar-style deadline schedule, instant VA check-in pings, and an immutable activity audit trail.

---

## 1. System Requirements & Technology Stack

- **Runtime**: Node.js v18.0.0+ (Tested on Node v20.19.1)
- **Backend Framework**: Express.js 4.19+
- **Database**: MySQL 5.7+, MySQL 8.0+, or MariaDB 10.3+ (Fully compatible with XAMPP 8.x and phpMyAdmin)
- **Database Driver**: `mysql2/promise` with parameterized SQL queries and atomic transactions
- **Authentication**: Stateless JSON Web Tokens (JWT) signed with HMAC-SHA256
- **Password Security**: Bcrypt (`bcryptjs`) with 10 salt rounds
- **Input Validation**: Zod schema validation middleware
- **File Uploads**: Multer with MIME-type filtering, file size limits, and randomized unique filenames
- **Security Middlewares**: Helmet, CORS, and Express Rate Limit
- **Testing**: Jest and Supertest automated integration test suite

---

## 2. Directory Structure

```text
VA_TRACK/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js           # MySQL connection pool & transaction helper
│   │   ├── controllers/
│   │   │   ├── activity.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── calendar.controller.js
│   │   │   ├── clients.controller.js
│   │   │   ├── dashboard.controller.js
│   │   │   ├── deliverables.controller.js
│   │   │   ├── pings.controller.js
│   │   │   ├── reviews.controller.js
│   │   │   ├── services.controller.js
│   │   │   └── users.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js     # Bearer JWT verification
│   │   │   ├── error.middleware.js    # Centralized HTTP error handler
│   │   │   ├── role.middleware.js     # Role-based access control (Admin vs VA)
│   │   │   ├── upload.middleware.js   # Multer file proof sanitizer
│   │   │   └── validation.middleware.js # Zod schema validation
│   │   ├── repositories/
│   │   │   ├── activity.repository.js
│   │   │   ├── calendar.repository.js
│   │   │   ├── client.repository.js
│   │   │   ├── deliverable.repository.js
│   │   │   ├── ping.repository.js
│   │   │   ├── review.repository.js
│   │   │   ├── service.repository.js
│   │   │   ├── stage.repository.js
│   │   │   └── user.repository.js
│   │   ├── routes/
│   │   │   ├── activity.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── calendar.routes.js
│   │   │   ├── clients.routes.js
│   │   │   ├── dashboard.routes.js
│   │   │   ├── deliverables.routes.js
│   │   │   ├── pings.routes.js
│   │   │   ├── reviews.routes.js
│   │   │   ├── services.routes.js
│   │   │   └── users.routes.js
│   │   ├── utils/
│   │   │   ├── jwt.utils.js
│   │   │   ├── password.utils.js
│   │   │   └── response.utils.js
│   │   ├── app.js                    # Express app configuration & middleware
│   │   └── server.js                 # HTTP server bootstrap & DB handshake
│   ├── tests/
│   │   └── api.test.js               # 24-point automated test suite
│   ├── uploads/                      # Uploaded deliverable proofs (git-ignored)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── app.js                        # Client state & interactive workflows
│   ├── index.html                    # Single-page interface
│   └── style.css                     # Premium Purple design system
├── sql/
│   └── schema.sql                    # Complete executable MySQL schema & seed
├── .gitignore
├── package.json
└── README.md
```

---

## 3. Database Setup (XAMPP & phpMyAdmin)

### Step 3.1: Start MySQL in XAMPP
1. Open the **XAMPP Control Panel**.
2. Click **Start** next to **MySQL** (and **Apache** if using phpMyAdmin).
3. Ensure MySQL indicates green status on port `3306`.

### Step 3.2: Import `sql/schema.sql` via phpMyAdmin
1. Open your web browser and navigate to:
   ```text
   http://localhost/phpmyadmin
   ```
2. Click the **Import** tab at the top navigation bar.
3. Click **Choose File** and select:
   ```text
   c:\Users\canci\OneDrive\Desktop\VA_TRACK\sql\schema.sql
   ```
4. Leave Character set as `utf-8` and format as `SQL`.
5. Click **Import** (or **Go**).
6. phpMyAdmin will execute the script, creating the `va_trackos` database and all 11 tables with foreign keys and seed records.

*(Alternative via Command Line)*:
```bash
mysql -u root -p < sql/schema.sql
```

---

## 4. Backend Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```bash
cd backend
cp .env.example .env
```

Ensure the configuration matches your local database:

```env
PORT=5000
NODE_ENV=development

# MySQL Database Settings (Default XAMPP root user has no password)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=va_trackos
DB_CONNECTION_LIMIT=10

# JSON Web Token Secret
JWT_SECRET=va_trackos_jwt_super_secure_secret_key_change_in_production_2026
JWT_EXPIRES_IN=24h

# Allowed Frontend Origins
CLIENT_ORIGIN=http://localhost:5000

# File Upload Limit
UPLOAD_MAX_FILE_SIZE_MB=10
```

---

## 5. Dependency Installation

Run npm install in both the root and backend directories:

```bash
# Install root orchestration packages
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

---

## 6. Seeded User Accounts & Roles

The database seed in `sql/schema.sql` (and `npm run seed:users`) provides pre-configured testing accounts:

### Administrator Accounts (Full Pipeline & QA Control)
| Name | Email | Password | Role | Permissions |
|---|---|---|---|---|
| **System Administrator** | `admin@vatrack.io` | `admin` | `admin` | Full CRUD, QA Approvals, Pings, Team Management |
| **Canci Admin** | `canci@vatrack.io` | `Password123!` | `admin` | Full CRUD, QA Approvals, Pings, Team Management |

### Virtual Assistant (VA) Specialist Accounts
| Name | Email | Password | Role | Specialty Role |
|---|---|---|---|---|
| **Elena Rostova** | `elena@vatrack.io` | `password123` | `va` | Content & Copy Specialist |
| **Marcus Chen** | `marcus@vatrack.io` | `password123` | `va` | Operations & Workflows |
| **Sarah Jenkins** | `sarah@vatrack.io` | `password123` | `va` | Research & Diligence |
| **David Kim** | `david@vatrack.io` | `password123` | `va` | Technical Integrations |
| **Aisha Patel** | `aisha@vatrack.io` | `password123` | `va` | Outreach & Communications |

To create new accounts, use the **Register** tab in the UI or run:
```bash
node backend/scripts/create-admin.js <email> <password> "<fullName>"
```

---

## 7. Starting the Application

You can start the full-stack server from the root directory:

```bash
# Development mode with nodemon auto-restart
npm run dev

# Or production start mode
npm start
```

Once running:
- **Web Application UI**: [http://localhost:5000](http://localhost:5000)
- **API v1 Base Endpoint**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)
- **Deliverable Uploads**: [http://localhost:5000/uploads](http://localhost:5000/uploads)

---

## 8. REST API Reference (`/api/v1`)

All endpoints (except `/auth/login` and `/auth/register`) require an `Authorization: Bearer <token>` header.

### Authentication
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public | Authenticates user; returns JWT token & profile |
| `POST` | `/api/v1/auth/register` | Public | Registers a new VA Specialist or Admin account |
| `POST` | `/api/v1/auth/logout` | Authenticated | Invalidates client session |
| `GET` | `/api/v1/auth/me` | Authenticated | Returns current authenticated user record |

### Clients & Pipelines
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/clients` | Authenticated | List clients (supports `search`, `service`, `va`, `status`, `sortBy`, `page`, `pageSize`) |
| `GET` | `/api/v1/clients/:id` | Authenticated | Get detailed client record with ordered stages |
| `POST` | `/api/v1/clients` | Admin Only | Create client, pipeline, and atomic stage breakdown |
| `PATCH` | `/api/v1/clients/:id` | Admin Only | Update client details and stage configurations |
| `DELETE` | `/api/v1/clients/:id` | Admin Only | Cascade delete client, stages, and calendar markers |

### Deliverables & QA Reviews
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/deliverables` | Authenticated | List all submitted deliverables (filter by `status`) |
| `GET` | `/api/v1/deliverables/:id` | Authenticated | Retrieve specific deliverable submission & proof |
| `POST` | `/api/v1/deliverables/submit` | Authenticated | Multipart upload: submits report, proof file & link |
| `POST` | `/api/v1/reviews` | Admin Only | Approves deliverable (advancing pipeline) or requests revisions |

### Dashboard & Analytics
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/dashboard/metrics` | Authenticated | Real-time KPI counts: active clients, avg progress, VAs in charge, pending reviews |

### Calendar & Deadlines
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/calendar` | Authenticated | Returns all custom calendar events and client deadlines |
| `POST` | `/api/v1/calendar` | Authenticated | Create a new calendar milestone or meeting event |
| `PATCH` | `/api/v1/calendar/:id` | Authenticated | Update a scheduled event |
| `DELETE` | `/api/v1/calendar/:id` | Authenticated | Remove a calendar event |

### Priority VA Pings & History
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/pings` | Authenticated | List direct check-in alerts for current user |
| `GET` | `/api/v1/pings/unread-count` | Authenticated | Get unread ping count for navigation badges |
| `POST` | `/api/v1/pings` | Authenticated | Send instant check-in alert to assigned VA |
| `PATCH` | `/api/v1/pings/:id/read` | Authenticated | Mark ping alert as read |
| `GET` | `/api/v1/activity` | Authenticated | Filtered immutable audit trail stream |
| `GET` | `/api/v1/activity/export/json` | Authenticated | Export full audit trail as downloadable JSON |

---

## 9. Running the Automated Test Suite

The project includes an end-to-end integration test suite verifying MySQL connectivity, JWT authentication, RBAC authorization, client CRUD, deliverable submissions, and QA handoffs:

```bash
cd backend
npm test
```

Expected result:
```text
PASS tests/api.test.js
  VA TrackOS — Full-Stack API Integration Test Suite
    √ 1. Health Check & Database Connection
    √ 2. Authentication & Authorization
    √ 3. Role-Based Access Control (RBAC)
    √ 4. Client CRUD & Pipeline Creation
    √ 5. Dashboard Metrics Calculation
    √ 6. VA Deliverable Submission & Stage Transitions
    √ 7. Admin QA Review & Automated Pipeline Progression
    √ 8. Calendar & VA Ping Notifications
    √ 9. Activity Audit Trail
    √ 10. Client Deletion & Cascade Clean-up

Test Suites: 1 passed, 1 total
Tests:       24 passed, 24 total
```

---

## 10. Troubleshooting & Common Setup Errors

### 1. `ECONNREFUSED 127.0.0.1:3306`
- **Cause**: MySQL service is not running or running on an alternate port.
- **Solution**: Open the XAMPP Control Panel and ensure MySQL is started. If your MySQL runs on another port (e.g. 3307), update `DB_PORT` in `backend/.env`.

### 2. `ER_BAD_DB_ERROR: Unknown database 'va_trackos'`
- **Cause**: The database schema was not imported prior to launching the server.
- **Solution**: Import `sql/schema.sql` through phpMyAdmin or run `npm run setup:db`.

### 3. `Access denied for user 'root'@'localhost'`
- **Cause**: MySQL root account has a password set.
- **Solution**: Set `DB_PASSWORD=your_password` in `backend/.env`.

### 4. `Upload file too large`
- **Cause**: Deliverable upload exceeds the configured upload limit.
- **Solution**: Increase `UPLOAD_MAX_FILE_SIZE_MB` in `backend/.env`.

---

## 11. Security Best Practices Implemented

1. **SQL Injection Defense**: 100% of queries use parameterized bindings through `mysql2/promise`.
2. **Access Control (RBAC)**: Protected routes reject unauthorized requests with HTTP 403 Forbidden.
3. **Password Security**: Passwords are never stored in plaintext and are hashed using bcrypt with salt factor 10.
4. **File Upload Security**: Uploaded files receive cryptographically unique names, and file types are strictly restricted to verified extensions and MIME types (`image/*`, `application/pdf`, `zip`, `docx`).
5. **Rate Limiting**: Authentication endpoints are protected against brute-force attacks via `express-rate-limit`.
