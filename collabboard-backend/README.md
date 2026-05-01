# CollabBoard — Backend API

A real-time collaborative task manager API built with Node.js, Express, MongoDB, and Socket.io.

## Features

- **JWT Authentication** — Access + refresh token rotation
- **Real-time Collaboration** — Socket.io for live board updates
- **Kanban Board Management** — Boards, lists, and draggable cards
- **Email Invitations** — Invite team members via email with secure token links
- **Activity Notifications** — Real-time notifications for all board actions
- **Role-based Access Control** — Admin and member roles per board
- **Drag & Drop Support** — Card position tracking across lists

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 4 |
| Database | MongoDB (Mongoose 8) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Real-time | Socket.io 4 |
| Email | Nodemailer |
| ID generation | uuid |

## Local Setup

```bash
cd collabboard-backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secrets, and SMTP credentials
npm run dev
```

The API runs on `http://localhost:5000`.

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Boards
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/boards` | Create board | Yes |
| GET | `/api/boards` | Get all user boards | Yes |
| GET | `/api/boards/:id` | Get board by ID | Yes |
| PUT | `/api/boards/:id` | Update board | Admin |
| DELETE | `/api/boards/:id` | Delete board | Admin |

### Lists
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/lists` | Create list | Yes |
| GET | `/api/lists/:boardId` | Get all lists for board | Yes |
| PUT | `/api/lists/reorder` | Reorder lists | Yes |
| PUT | `/api/lists/:id` | Update list | Yes |
| DELETE | `/api/lists/:id` | Delete list | Yes |

### Cards
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/cards` | Create card | Yes |
| GET | `/api/cards/:listId` | Get cards for list | Yes |
| PUT | `/api/cards/:id` | Update card | Yes |
| PUT | `/api/cards/:id/move` | Move card between lists | Yes |
| PUT | `/api/cards/:id/assign` | Assign user to card | Yes |
| DELETE | `/api/cards/:id` | Delete card | Yes |

### Invitations
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/invite` | Send email invitation | Yes |
| GET | `/api/invite/:token` | Accept invitation | Yes |

### Notifications
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/notifications` | Get last 20 notifications | Yes |
| PATCH | `/api/notifications/read-all` | Mark all as read | Yes |
| PATCH | `/api/notifications/:id/read` | Mark one as read | Yes |

## Socket.io Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `join:board` | `boardId` | Join a board room |
| `leave:board` | `boardId` | Leave a board room |
| `card:move` | `{boardId, cardId, sourceListId, destListId, position}` | Broadcast card move |
| `card:create` | `{boardId, card}` | Broadcast new card |
| `card:update` | `{boardId, card}` | Broadcast card update |
| `list:create` | `{boardId, list}` | Broadcast new list |

### Server → Client
| Event | Description |
|---|---|
| `card:created` | New card added to board |
| `card:moved` | Card moved between lists |
| `card:updated` | Card data changed |
| `list:created` | New list added to board |
| `board:updated` | Board title/description changed |
| `notification:new` | New notification for user |

## Deployment on Hostinger VPS

```bash
ssh user@your-vps-ip

# Clone repo
git clone https://github.com/yourusername/collabboard.git
cd collabboard/collabboard-backend

# Install and configure
npm install
cp .env.example .env
nano .env  # Fill in production values

# Start with PM2
pm2 start server.js --name collabboard-api
pm2 save
pm2 startup

# Build and serve frontend
cd ../collabboard-frontend
npm install
npm run build
# Copy dist/ to /var/www/collabboard/
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend (Vite build)
    root /var/www/collabboard;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.io proxy
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL with Certbot

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
