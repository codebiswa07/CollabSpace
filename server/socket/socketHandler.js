const Document = require("../models/Document");
const xss = require("xss");

const roomUsers = new Map();
const saveTimers = new Map();

const SAVE_INTERVAL = 3000;

const USER_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#82E0AA",
];

function getRoomUserList(roomId) {
  const users = roomUsers.get(roomId);
  if (!users) return [];
  return Array.from(users.values());
}

function sanitizeContent(content) {
  if (typeof content === "string") return xss(content);

  if (content && typeof content === "object") {
    return content;
  }

  return { ops: [] };
}

function validateRoomId(roomId) {
  if (!roomId || typeof roomId !== "string") return false;
  return /^[a-zA-Z0-9_-]{3,50}$/.test(roomId);
}

function scheduleAutoSave(roomId, content) {
  if (!content) return;

  if (saveTimers.has(roomId)) {
    clearTimeout(saveTimers.get(roomId));
  }

  const timer = setTimeout(async () => {
    try {
      await Document.findOneAndUpdate(
        { roomId },
        {
          content: sanitizeContent(content),
          mode: "document",
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error(`Auto-save failed for room ${roomId}:`, err.message);
    }

    saveTimers.delete(roomId);
  }, SAVE_INTERVAL);

  saveTimers.set(roomId, timer);
}

module.exports = (io) => {
  const eventCounts = new Map();
  const RATE_LIMIT = 80;
  const RATE_WINDOW = 1000;

  function isRateLimited(socketId) {
    const now = Date.now();

    const entry = eventCounts.get(socketId) || {
      count: 0,
      windowStart: now,
    };

    if (now - entry.windowStart > RATE_WINDOW) {
      eventCounts.set(socketId, {
        count: 1,
        windowStart: now,
      });
      return false;
    }

    entry.count += 1;
    eventCounts.set(socketId, entry);

    return entry.count > RATE_LIMIT;
  }

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    socket.on("join-room", async ({ roomId, userId, username }) => {
      if (!validateRoomId(roomId)) {
        socket.emit("socket-error", {
          message: "Invalid room ID. Use 3-50 alphanumeric characters.",
        });
        return;
      }

      const safeUsername = xss(String(username || "Anonymous").slice(0, 30));
      const colorIndex = Math.floor(Math.random() * USER_COLORS.length);

      socket.join(roomId);

      socket.data.roomId = roomId;
      socket.data.userId = userId || socket.id;
      socket.data.username = safeUsername;

      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Map());
      }

      roomUsers.get(roomId).set(socket.id, {
        socketId: socket.id,
        userId: userId || socket.id,
        username: safeUsername,
        color: USER_COLORS[colorIndex],
        joinedAt: new Date(),
      });

      try {
        let doc = await Document.findOne({ roomId });

        if (!doc) {
          doc = await Document.create({
            roomId,
            content: { ops: [] },
            strokes: [],
            mode: "document",
            versions: [],
            updatedAt: new Date(),
          });
        }

        socket.emit("load-document", {
          content: doc.content || { ops: [] },
          strokes: doc.strokes || [],
          mode: doc.mode || "document",
          versions: doc.versions?.slice(-10) || [],
        });
      } catch (err) {
        console.error("load-document error:", err.message);

        socket.emit("load-document", {
          content: { ops: [] },
          strokes: [],
          mode: "document",
          versions: [],
        });
      }

      const userList = getRoomUserList(roomId);

      io.to(roomId).emit("room-users", userList);

      socket.to(roomId).emit("user-joined", {
        userId: userId || socket.id,
        username: safeUsername,
      });

      console.log(`[Room:${roomId}] ${safeUsername} joined. Users: ${userList.length}`);
    });

    socket.on("send-changes", ({ roomId, delta, content }) => {
      if (!validateRoomId(roomId)) return;
      if (isRateLimited(socket.id)) return;
      if (!delta) return;

      socket.to(roomId).emit("receive-changes", {
        delta,
        senderId: socket.id,
      });

      // Only autosave if full content is sent.
      // Your current frontend sends only delta, so real saving happens in save-document.
      if (content) {
        scheduleAutoSave(roomId, content);
      }
    });

    socket.on("save-document", async ({ roomId, content, username }) => {
      if (!validateRoomId(roomId)) return;

      const sanitized = sanitizeContent(content);

      try {
        const doc = await Document.findOneAndUpdate(
          { roomId },
          {
            content: sanitized,
            mode: "document",
            updatedAt: new Date(),
            $push: {
              versions: {
                $each: [
                  {
                    content: sanitized,
                    savedAt: new Date(),
                    savedBy: xss(username || "Unknown"),
                  },
                ],
                $slice: -20,
              },
            },
          },
          { upsert: true, new: true }
        );

        socket.emit("document-saved", {
          savedAt: doc.updatedAt,
        });
      } catch (err) {
        console.error("save-document error:", err.message);

        socket.emit("socket-error", {
          message: "Failed to save document.",
        });
      }
    });

    socket.on("draw-stroke", ({ roomId, stroke }) => {
      if (!validateRoomId(roomId)) return;
      if (isRateLimited(socket.id)) return;
      if (!stroke) return;

      socket.to(roomId).emit("receive-stroke", {
        stroke,
        senderId: socket.id,
      });
    });

    socket.on("save-strokes", async ({ roomId, strokes }) => {
      if (!validateRoomId(roomId)) return;

      try {
        await Document.findOneAndUpdate(
          { roomId },
          {
            strokes: Array.isArray(strokes) ? strokes : [],
            mode: "whiteboard",
            updatedAt: new Date(),
          },
          { upsert: true, new: true }
        );

        socket.emit("strokes-saved", {
          savedAt: new Date(),
        });
      } catch (err) {
        console.error("save-strokes error:", err.message);

        socket.emit("socket-error", {
          message: "Failed to save whiteboard.",
        });
      }
    });

    socket.on("clear-board", async ({ roomId }) => {
      if (!validateRoomId(roomId)) return;

      try {
        await Document.findOneAndUpdate(
          { roomId },
          {
            strokes: [],
            mode: "whiteboard",
            updatedAt: new Date(),
          },
          { upsert: true, new: true }
        );

        io.to(roomId).emit("board-cleared");
      } catch (err) {
        console.error("clear-board error:", err.message);
      }
    });

    socket.on("cursor-position", ({ roomId, index, username }) => {
      if (!validateRoomId(roomId)) return;
      if (isRateLimited(socket.id)) return;

      socket.to(roomId).emit("cursor-update", {
        socketId: socket.id,
        index,
        username: xss(username || socket.data.username || "Anonymous"),
        color: roomUsers.get(roomId)?.get(socket.id)?.color || "#999",
      });
    });

    socket.on("switch-mode", async ({ roomId, mode }) => {
      if (!validateRoomId(roomId)) return;
      if (!["document", "whiteboard"].includes(mode)) return;

      try {
        await Document.findOneAndUpdate(
          { roomId },
          {
            mode,
            updatedAt: new Date(),
          },
          { upsert: true, new: true }
        );

        io.to(roomId).emit("mode-switched", { mode });
      } catch (err) {
        console.error("switch-mode error:", err.message);
      }
    });

    socket.on("disconnect", () => {
      const { roomId, userId, username } = socket.data || {};

      if (roomId) {
        const users = roomUsers.get(roomId);

        if (users) {
          users.delete(socket.id);

          if (users.size === 0) {
            roomUsers.delete(roomId);
          }
        }

        socket.to(roomId).emit("user-left", {
          userId,
          username,
        });

        io.to(roomId).emit("room-users", getRoomUserList(roomId));

        console.log(
          `[Room:${roomId}] ${username || "Unknown"} left. Users: ${
            getRoomUserList(roomId).length
          }`
        );
      }

      eventCounts.delete(socket.id);
    });
  });
};