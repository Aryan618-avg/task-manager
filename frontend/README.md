# Team Task Manager

A full-stack team task management app with role-based access control.

## Live URL
https://task-manager-eosin-five-50.vercel.app

## GitHub
https://github.com/Aryan618-avg/task-manager

## Tech Stack
- **Frontend:** React, Vite, TailwindCSS
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (Railway)
- **Auth:** JWT + bcrypt
- **Deploy:** Railway (backend) + Vercel (frontend)

## Features
- Signup / Login with JWT authentication
- Create projects, invite members by email
- Role-based access: Admin / Member
- Admin: create and assign tasks
- Member: update task status
- Task statuses: Todo, In Progress, Done
- Overdue task detection
- Dashboard with stats

## Run Locally

### Backend
cd backend
npm install
create .env with DATABASE_URL and JWT_SECRET
npm run dev

### Frontend
cd frontend
npm install
npm run dev
open http://localhost:5173