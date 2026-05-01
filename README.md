# CollabBoard

A full-stack real-time Kanban board application built with Node.js, Express, MongoDB, React, and Socket.io — inspired by Trello.

## Features

- **Boards** — Create and manage multiple project boards
- **Lists & Cards** — Organize work into lists with draggable cards
- **Drag & Drop** — Reorder cards and move them between lists with optimistic UI
- **Real-time Collaboration** — Changes broadcast instantly to all board members via WebSockets
- **Team Invitations** — Invite teammates by email with time-limited invite links
- **Card Details** — Add descriptions, due dates, color labels, and assign members
- **Notifications** — Real-time in-app notifications for card creation, moves, and assignments
- **Authentication** — JWT-based auth with access + refresh token rotation

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database & ODM |
| Socket.io | Real-time WebSocket events |
| JSON Web Tokens | Authentication |
| bcryptjs | Password hashing |
| Nodemailer | Email delivery |
| express-validator | Input validation |
| express-rate-limit | Rate limiting |
| winston | Logging |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework & build tool |
| React Router v6 | Client-side routing |
| Tailwind CSS | Styling |
| @hello-pangea/dnd | Drag and drop |
| Axios | HTTP client with token refresh |
| Socket.io-client | Real-time updates |
| react-hot-toast | User notifications |
| date-fns | Date formatting |

## Project Structure

```
trello_v1/
├── collabboard-backend/
│   ├── config/          # Database connection
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth, validation, error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API route definitions
│   ├── socket/          # Socket.io event handlers
│   └── utils/           # Logger, token generation, email
│
└── collabboard-frontend/
    └── src/
        ├── api/         # Axios instance with interceptors
        ├── components/  # Reusable UI components
        ├── context/     # Auth & Socket context providers
        ├── hooks/       # Custom React hooks
        ├── pages/       # Route-level page components
        └── utils/       # Date formatting helpers
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- An SMTP server for emails (e.g. Hostinger, Gmail, Mailgun)

### 1. Clone the repository

```bash
git clone https://github.com/u-pawan/trello_v1.git
cd trello_v1
```

### 2. Set up the backend

```bash
cd collabboard-backend
npm install
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/collabboard
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_email_password
CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev     # development (nodemon)
npm start       # production
```

### 3. Set up the frontend

```bash
cd ../collabboard-frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/boards` | Get all boards for user |
| POST | `/api/boards` | Create a new board |
| GET | `/api/boards/:id` | Get board with lists and cards |
| PUT | `/api/boards/:id` | Update board (admin only) |
| DELETE | `/api/boards/:id` | Delete board (admin only) |
| GET | `/api/lists/:boardId` | Get lists for a board |
| POST | `/api/lists` | Create a list |
| PUT | `/api/lists/:id` | Update list |
| PUT | `/api/lists/reorder` | Batch reorder lists |
| DELETE | `/api/lists/:id` | Delete list |
| GET | `/api/cards/:listId` | Get cards in a list |
| POST | `/api/cards` | Create a card |
| PUT | `/api/cards/:id` | Update card |
| PUT | `/api/cards/:id/move` | Move card to another list |
| PUT | `/api/cards/:id/assign` | Assign member to card |
| DELETE | `/api/cards/:id` | Delete card |
| POST | `/api/invite` | Send board invitation email |
| GET | `/api/invite/:token` | Accept invitation |
| GET | `/api/notifications` | Get notifications |
| PATCH | `/api/notifications/:id/read` | Mark notification read |
| PATCH | `/api/notifications/read-all` | Mark all notifications read |
| GET | `/api/health` | Health check (DB status) |

## Socket.io Events

| Event | Direction | Description |
|---|---|---|
| `join:board` | Client → Server | Join a board room |
| `leave:board` | Client → Server | Leave a board room |
| `card:create` | Client → Server | Broadcast new card |
| `card:move` | Client → Server | Broadcast card move |
| `card:update` | Client → Server | Broadcast card update |
| `list:create` | Client → Server | Broadcast new list |
| `card:created` | Server → Client | New card added |
| `card:moved` | Server → Client | Card moved |
| `card:updated` | Server → Client | Card updated |
| `list:created` | Server → Client | New list added |
| `board:updated` | Server → Client | Board details changed |
| `notification:new` | Server → Client | New notification |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh tokens |
| `CLIENT_URL` | Yes | Frontend URL (for CORS and invite links) |
| `PORT` | No | Server port (default: 5000) |
| `JWT_EXPIRES_IN` | No | Access token expiry (default: 15m) |
| `JWT_REFRESH_EXPIRES_IN` | No | Refresh token expiry (default: 7d) |
| `SMTP_HOST` | No | SMTP server host |
| `SMTP_PORT` | No | SMTP server port |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
