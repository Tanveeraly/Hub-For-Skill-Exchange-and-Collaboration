# 🚀 HubForSkills - Peer-to-Peer Skill Exchange & Learning Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-indigo.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-Cache-red.svg)](https://redis.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**HubForSkills** is a feature-rich, full-stack peer-to-peer skill exchange platform designed to connect learners and experts. Users can share their expertise, request skill swaps, collaborate via real-time messaging and live audio/video calls, track learning sessions with work logs and progress reports, and earn verified skill certifications and endorsements.

---

## 🌟 Key Features

### 👤 User Authentication & Profile Management
- **Multi-Factor Auth & OAuth**: Standard Email/Password login, Google OAuth 2.0 integration, and OTP-based verification via Nodemailer & Redis.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions for standard users and platform administrators.
- **Rich Profiles & Portfolios**: Customizable user profiles, social media handles, portfolios, privacy settings, and skill bookmarks.

### 🤝 Skill Marketplace & Swap Exchange
- **Interactive Marketplace**: Browse and filter skill listings by categories, rating, location, and expertise level (Beginner, Intermediate, Expert, Advanced).
- **Mutual Escrow & Swap Requests**: Propose skill swaps, set agenda, negotiate time slots, and track mutual confirmation.
- **Ratings & Feedback**: Post-swap review system to maintain community trust and highlight top contributors.

### ⏱️ Session Tracking & Progress Logging
- **Work Sessions**: Log session hours and track active skill-building activities.
- **Progress Reports**: Submit daily and weekly progress reports with file attachments and completion percentage tracking.

### 💬 Real-Time Communication & Calls
- **Socket.io Chat**: Instant messaging with media attachments, unread message counts, and live status.
- **WebRTC Audio/Video Calls**: Integrated calling system for interactive distance learning sessions.

### 📜 Certifications, Endorsements & Learning Courses
- **Skill Certification**: Generate and verify skill completion certificates.
- **Peer Endorsements**: Endorse fellow community members upon successful completion of skill swaps.
- **Course Library**: Browse courses, register, track progress, and obtain verified credentials.

### 🛡️ Security, Audit Logs & Admin Portal
- **Admin Dashboard**: Comprehensive administration panel for dispute resolution, user management, complaint tracking, and site analytics.
- **Security Audit Logs**: Track account logins, security events, severity alerts, and system activities.
- **Rate-Limiting & Security**: OTP TTL management, brute-force protection, and CORS policies.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React 18 with Vite & TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **State Management**: Redux Toolkit & React Context API
- **UI Components**: Lucide React Icons, Recharts (Analytics Data Visualization)
- **Sockets & Media**: Socket.io Client, html2canvas, jsPDF

### **Backend**
- **Runtime**: Node.js (ES Modules) & Express 5
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Caching & OTP Store**: Redis (ioredis)
- **Media & File Storage**: Cloudinary & Multer
- **Authentication**: JWT (Access & Refresh Tokens), Bcrypt, Google Auth Library
- **API Documentation**: Swagger UI Express & Swagger JSDoc

---

## 📁 Repository Structure

```
Fyp/
├── Backend/                     # Node.js Express REST API & Socket Server
│   ├── prisma/                  # Database Schema, Migrations & Seeds
│   │   └── schema.prisma        # Prisma PostgreSQL Data Models
│   ├── src/                     # Source Code
│   │   ├── controllers/         # Request Handlers & Business Logic
│   │   ├── routes/              # Express API Routes
│   │   ├── middlewares/         # Auth, Validation & Error Middlewares
│   │   ├── jobs/                # Scheduled Cron Jobs
│   │   ├── index.js             # Server Entry Point
│   │   └── app.js               # Express App Setup & Socket Initialization
│   ├── .env.example             # Backend Environment Template
│   ├── Dockerfile               # Backend Containerization Script
│   └── package.json
│
├── frontend/
│   └── project/                 # React + TypeScript Frontend Application
│       ├── src/
│       │   ├── components/      # Reusable UI Components & Layouts
│       │   ├── pages/           # Application Pages & Admin Portals
│       │   ├── store/           # Redux Toolkit Slices & Actions
│       │   ├── services/        # API Axios Services & Interceptors
│       │   ├── App.tsx          # Main Router & Application Setup
│       │   └── main.tsx         # React DOM Entry
│       ├── .env.example         # Frontend Environment Template
│       ├── tailwind.config.js   # Tailwind Custom Styles & Theme
│       ├── vite.config.ts       # Vite Development & Build Config
│       └── package.json
│
├── .gitignore                   # Workspace Git Ignore File
└── README.md                    # Project Documentation
```

---

## 🚀 Getting Started

### 📋 Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (`v18.0.0` or higher)
- **PostgreSQL** (`v15.0` or higher)
- **Redis Server** (Local instance or Cloud Redis URL)
- **npm** or **yarn** package manager

---

### ⚙️ Step 1: Environment Setup

#### 1. Backend Environment Setup
Navigate to the `Backend` directory and copy the environment template:
```bash
cd Backend
cp .env.example .env
```
Open `.env` and fill in your configurations (Database credentials, JWT secret keys, Redis URL, Cloudinary keys, and Email SMTP settings).

#### 2. Frontend Environment Setup
Navigate to `frontend/project` and copy the environment template:
```bash
cd ../frontend/project
cp .env.example .env
```
Set `VITE_API_BASE_URL` (default: `http://localhost:5000/api`).

---

### 📦 Step 2: Backend Installation & Setup

1. Open a terminal and move to the `Backend` folder:
   ```bash
   cd Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run Database Migrations & Generate Prisma Client:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

4. *(Optional)* Seed initial data:
   ```bash
   node seed_match.js
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   > Backend server will start on `http://localhost:5000` (API Docs available at `http://localhost:5000/api-docs`).

---

### 💻 Step 3: Frontend Installation & Setup

1. Open a new terminal tab and navigate to `frontend/project`:
   ```bash
   cd frontend/project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   > Frontend application will run locally at `http://localhost:5173`.

---

## 🐙 How to Push to GitHub

If you want to push this entire repository to GitHub for the first time, follow these commands in your project root (`Fyp` directory):

### Option A: Initialize & Push Whole Project (Recommended)

1. Open terminal in the root folder (`Fyp`):
   ```bash
   # Make sure you are in the root directory (Fyp)
   git init
   ```

2. Stage all files:
   ```bash
   git add .
   ```

3. Create initial commit:
   ```bash
   git commit -m "feat: initial commit for HubForSkills full stack application"
   ```

4. Rename branch to `main`:
   ```bash
   git branch -M main
   ```

5. Connect your local repository to GitHub:
   *(Create a new empty repository on GitHub first, then copy its repository URL)*
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
   ```

6. Push code to GitHub:
   ```bash
   git push -u origin main
   ```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page or submit a pull request.
