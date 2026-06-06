# CollabSpace — Real-Time Collaborative Editor & Whiteboard

A full-stack real-time collaboration tool built with MERN + Socket.IO.
CollabSpace is a real-time collaborative platform enabling teams to *communicate, share files, manage projects, and work together* seamlessly from anywhere.


---

**COMPANY**: *CODTECH IT SOLUTION*

**NAME**: *Biswaprakash Sahoo*

**INTERN ID**: *CTIS9533*

**DOMAIN**: *Mern Stack Web Development*

**DURATION**: *6 Weeks*

**MENTOR**: *Neela Santhosh Kumar*

---
#[Preview](https://project-acts9.vercel.app)
<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/4eb5714d-e749-4680-822f-f37de96dcdd0" />

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/b39c996e-7dd6-4352-bf1b-936efc4a215b" />

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/b185779e-6f73-47e4-9c9c-e4cb7fd1d970" />

## Features

- **Multi-room collaboration** via unique room IDs
- **Real-time document editor** (Quill.js with delta sync)
- **Shared whiteboard** (Canvas API with stroke-based sync)
- **User presence** — live online users list with color-coded avatars
- **Persistent storage** in MongoDB (auto-save every 3–5s)
- **Version history** — last 20 saves, one-click restore
- **Export** — HTML export from document editor
- **Mode switching** — toggle between Doc and Whiteboard per room
- **Security** — XSS sanitization, rate limiting, room ID validation
- **Responsive** — works on mobile, tablet, desktop

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, TailwindCSS, Quill.js, Canvas API |
| Realtime | Socket.IO (client + server) |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB running locally (or MongoDB Atlas URI)

### Installation

```bash
# Clone / unzip project
cd collab-editor

# Install all dependencies
npm run install:all

# Configure environment
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI
```

### Development

```bash
# Start both server and client (from root)
npm install          # installs concurrently
npm run dev

# Or separately:
npm run dev:server   # → http://localhost:5000
npm run dev:client   # → http://localhost:5173
```

### Production

```bash
npm run build        # builds client to client/dist/
npm start            # starts server (serve client/dist statically or use nginx)
```

## Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/collab-editor
CLIENT_URL=http://localhost:5173
```

## Project Structure

```
collab-editor/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DocumentEditor.jsx   # Quill rich-text editor
│   │   │   ├── Whiteboard.jsx       # Canvas drawing board
│   │   │   ├── UserPresence.jsx     # Online users sidebar
│   │   │   ├── EditorHeader.jsx     # Top navigation bar
│   │   │   └── VersionHistory.jsx   # Version restore panel
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Landing / room join
│   │   │   ├── Room.jsx             # Main editor view
│   │   │   └── NotFound.jsx         # 404
│   │   ├── hooks/
│   │   │   └── useSocket.js         # Socket connection hook
│   │   ├── socket/
│   │   │   └── socket.js            # Socket.IO singleton
│   │   └── utils/
│   │       └── helpers.js           # Debounce, export, IDs
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── server/
    ├── models/
    │   └── Document.js              # Mongoose schema
    ├── routes/
    │   └── rooms.js                 # REST API routes
    ├── socket/
    │   └── socketHandler.js         # All Socket.IO logic
    └── index.js                     # Express + Socket.IO entrypoint
```

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-room` | Client → Server | Join a collaboration room |
| `user-joined` | Server → Room | Broadcast new user |
| `room-users` | Server → Room | Full user list update |
| `send-changes` | Client → Server | Quill delta update |
| `receive-changes` | Server → Others | Broadcast delta |
| `save-document` | Client → Server | Persist document |
| `load-document` | Server → Client | Initial document load |
| `draw-stroke` | Client → Server | Whiteboard stroke |
| `receive-stroke` | Server → Others | Broadcast stroke |
| `save-strokes` | Client → Server | Persist strokes |
| `clear-board` | Client → Server | Clear whiteboard |
| `board-cleared` | Server → Room | Broadcast clear |
| `cursor-position` | Client → Server | Cursor tracking |
| `cursor-update` | Server → Others | Broadcast cursor |
| `switch-mode` | Client → Server | Toggle doc/whiteboard |
| `mode-switched` | Server → Room | Broadcast mode change |
| `user-left` | Server → Room | User disconnected |#
