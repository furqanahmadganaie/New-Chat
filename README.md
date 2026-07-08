PingMe 💬

A modern real-time chat application that enables users to communicate instantly, share images, and see online user status. Built with React, Node.js, Express, MongoDB, Socket.IO, and Cloudinary.

🚀 Features
            Secure User Authentication
            Real-Time Messaging
            Online/Offline User Presence
            Profile Picture Upload
            Image Sharing in Chats
            Responsive User Interface
            Persistent Login Sessions
            Real-Time Updates with WebSockets
            Cloud-Based Image Storage


🛠️ Tech Stack
#### Frontend
            React.js
            Zustand
            Axios
            React Router
            Tailwind CSS
            DaisyUI
            Socket.IO Client

#### Backend
            Node.js
            Express.js
            Socket.IO
            JWT Authentication
            bcryptjs
            Cookie Parser

#### Database
          MongoDB Atlas
          Mongoose

#### Image Storage
          Cloudinary


📌 Architecture
                Client (React.js)
                        │
                        ▼
                Node.js + Express API
                        │
                        ├── MongoDB Atlas
                        │
                        └── Cloudinary

# how i implemented the features step bt step 

Current State
─────────────
React + Node
      │
      ▼
Runs Locally
      │
      ▼
Deployed on EC2 (PM2 + Nginx)

↓

Step 1
Dockerize Frontend

↓

Step 2
Dockerize Backend

↓

Step 3
Run Both Locally with Docker Compose

↓

Step 4
Verify Everything Works

↓

Step 5
Push Changes to GitHub

↓

Step 6
Deploy Dockerized App on EC2

↓

Step 7
Run Containers on EC2

↓

Step 8
Test Production

↓

Step 9
Automate with GitHub Actions (CI/CD)
