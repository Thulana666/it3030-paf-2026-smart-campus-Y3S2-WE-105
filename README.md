# Smart Campus Operations Hub
> SLIIT PAF Assignment 2026

The **Smart Campus Operations Hub** is a full-stack, role-based application designed to streamline and automate the management of campus facilities, resource bookings, and incident ticketing. Built with a modern, glass-morphic React frontend and a secure Spring Boot REST API backend.

## 🌟 Key Features

### Role-Based Access Control (RBAC)
- **Administrators**: Full system oversight, User Management, Global Analytics, and Facility/Booking Approval handling.
- **Technicians**: Dedicated Operational Portal to manage assigned Incident Tickets, update Repair Progress, and view Operational Schedules.
- **Students/Staff (Users)**: Access to the Booking System, Facility Directory, and the ability to raise Incident Tickets.

### Core Modules
- **Facility Management**: Centralized CRUD management for all campus resources (Labs, Lecture Halls, Equipment).
- **Booking System**: Streamlined reservation system with administrative approval workflows.
- **Incident Management**: End-to-end ticketing system connecting users directly to maintenance technicians.
- **Global Analytics**: Comprehensive administrative dashboard visualizing platform usage, failure rates, and active requests.

## 💻 Tech Stack
- **Frontend**: React.js, Vite, Vanilla CSS (Glassmorphism UI), Playwright (E2E Testing)
- **Backend**: Java 17, Spring Boot 3, Spring Security, JWT Auth
- **Database**: MongoDB (Atlas)

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** (v18+)
- **Java Development Kit (JDK) 17**
- **Maven** (Optional, backend includes a Maven wrapper `mvnw`)

### 1. Backend Setup (Spring Boot)

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. The application is pre-configured to connect to a cloud MongoDB Atlas instance via `src/main/resources/application.properties`. No local database setup is required!
3. Run the Spring Boot application using the Maven wrapper:
   - **Windows**: `.\mvnw.cmd spring-boot:run`
   - **Mac/Linux**: `./mvnw spring-boot:run`
4. The backend server will start on `http://localhost:8080`.

### 2. Frontend Setup (React/Vite)

1. Open a *new* terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the necessary Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. The frontend will be available at `http://localhost:5173`. Open this URL in your browser.

---

## 🧪 Testing

The platform includes comprehensive test coverage for both the frontend and backend.

### Backend (JUnit Integration Tests)
The backend features an isolated testing suite validating secure API endpoints and JWT integration.
```bash
cd backend
.\mvnw.cmd test
```

### Frontend (Playwright E2E Tests)
The frontend utilizes a robust Playwright automation suite to simulate and validate real-world user workflows (Auth, Dashboards, RBAC).

1. Install Playwright browsers (first-time only):
   ```bash
   cd frontend
   npx playwright install
   ```
2. Run the tests in **Interactive UI Mode** (Recommended):
   ```bash
   npm run test:e2e:ui
   ```
3. Run the tests invisibly in the terminal:
   ```bash
   npm run test:e2e
   ```
*(Note: Playwright is configured to automatically boot up the Vite server for you during tests!)*

---

## 🔐 Default Test Accounts

Use these pre-configured accounts to explore the different dashboards:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@campus.edu` | `Admin@123` |
| **Technician** | `tech@campus.edu` | `Tech@123` |
| **User** | `user@campus.edu` | `User@123` |
