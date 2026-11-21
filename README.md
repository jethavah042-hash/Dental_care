# 🦷 Dental Care – Dental Clinic Management System

> A professional, full-stack **Dental Clinic Management System** built with the **MERN Stack** (MongoDB, Express.js, React.js, Node.js).  
> Developed as an MCA Semester 4 Company Project.

---

## 📌 Project Overview

**Dental Care** is a web-based application designed to digitize and simplify the daily operations of a dental clinic. It provides a centralized platform for:

- 🧑‍⚕️ Patient registration and management
- 📅 Appointment scheduling and tracking
- 🦷 Treatment plans, diagnoses, and prescriptions
- 🧾 Billing, invoicing, and payment records
- 📊 Clinic reports and analytics
- 🔐 Role-based access for Admin, Dentist, Receptionist, and Patient

---

## 🏗️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Auth | JWT + bcryptjs |
| Security | Helmet, CORS, Rate Limiting |

---

## 👥 Roles

| Role | Responsibilities |
|------|-----------------|
| **Admin** | Manage users, services, appointments, reports |
| **Dentist** | View schedule, record examinations, treatments, prescriptions |
| **Receptionist** | Register patients, manage appointments, billing |
| **Patient** | Book appointments, view records, invoices |

---

## 📁 Project Structure

```
Dental_Care/
├── backend/          ← Node.js + Express REST API
│   ├── config/       ← MongoDB connection
│   ├── controllers/  ← Route handlers
│   ├── middleware/   ← Auth, error handling
│   ├── models/       ← Mongoose schemas
│   ├── routes/       ← API route definitions
│   ├── services/     ← Business logic
│   ├── utils/        ← Helper functions
│   ├── validators/   ← Request validators
│   ├── app.js
│   └── server.js
└── frontend/         ← React.js (Coming soon)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.x
- MongoDB Atlas account
- npm

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/jethavah042-hash/Dental_care.git
cd Dental_care/backend

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and add your MongoDB Atlas URI

# 4. Start development server
npm run dev
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

> More endpoints will be added in upcoming phases.

---

## 🔧 Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

---

## 📦 Development Phases

- [x] **Phase 1** – Backend Foundation (server, DB connection, health API)
- [ ] **Phase 2** – Authentication (register, login, JWT, password reset)
- [ ] **Phase 3** – Frontend UI Foundation
- [ ] **Phase 4** – Patient & User Management
- [ ] **Phase 5** – Services & Schedules
- [ ] **Phase 6** – Appointments
- [ ] **Phase 7** – Clinical Workflow (Treatments, Prescriptions)
- [ ] **Phase 8** – Billing & Payments
- [ ] **Phase 9** – Notifications & Reports
- [ ] **Phase 10** – QA & Deployment

---

## 🔒 Security

- Passwords hashed with **bcryptjs**
- JWT-based authentication
- **Helmet.js** for HTTP security headers
- **CORS** restricted to frontend origin
- **Rate limiting** on all API routes
- `.env` excluded from Git — never commit secrets

---

## 👨‍💻 Author

**Hardik Jethava**  
MCA Semester 4 | Company Project  
GitHub: [@jethavah042-hash](https://github.com/jethavah042-hash)

---

## 📄 License

This project is for academic and demonstration purposes.
