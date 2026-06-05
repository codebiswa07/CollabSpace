require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const roomRoutes = require("./routes/rooms");
const initSocket = require("./socket/socketHandler");

const app = express();
const server = http.createServer(app);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = ("https://project-acts9.vercel.app" || "http://localhost:5173").split(",");
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "2mb" }));

// ─── RATE LIMIT (HTTP) ────────────────────────────────────────────────────────
app.use(
  "/api",
  rateLimit({ windowMs: 60_000, max: 100, message: { error: "Too many requests" } })
);

// ─── SOCKET.IO ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000,
});
initSocket(io);

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use("/api/rooms", roomRoutes);
app.get("/api/health", (_, res) => res.json({ status: "ok", time: new Date() }));

// ─── MONGODB ──────────────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/collab-editor";
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log(`[DB] Connected to MongoDB`))
  .catch((err) => console.error("[DB] Connection failed:", err.message));

mongoose.connection.on("error", (err) => console.error("[DB] Error:", err.message));

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`[Server] Running on http://localhost:${PORT}`));
