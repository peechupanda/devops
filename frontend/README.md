# ⚡ DevOps Monitoring Dashboard

A real-time infrastructure monitoring system built with Python, Node.js, and React.

## Architecture

- **agent/** — Python script that collects CPU, memory, disk, and network metrics
- **backend/** — Node.js + Express API that receives and stores metrics
- **frontend/** — React dashboard with live charts

## How to Run

### 1. Start the backend
cd backend
node server.js

### 2. Start the agent
cd agent
python agent.py

### 3. Start the frontend
cd frontend
npm start

## Tech Stack
- Python + psutil
- Node.js + Express
- React + Recharts
- Docker (coming soon)
- AWS EC2 (coming soon)