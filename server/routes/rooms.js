const express = require("express");
const router = express.Router();
const Document = require("../models/Document");

// GET /api/rooms/:roomId — fetch room info
router.get("/:roomId", async (req, res) => {
  const { roomId } = req.params;
  if (!/^[a-zA-Z0-9_-]{3,50}$/.test(roomId)) {
    return res.status(400).json({ error: "Invalid room ID" });
  }
  try {
    const doc = await Document.findOne({ roomId }).select("-versions -strokes -content");
    if (!doc) return res.status(404).json({ exists: false });
    res.json({ exists: true, mode: doc.mode, updatedAt: doc.updatedAt });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/rooms/:roomId/versions — version history
router.get("/:roomId/versions", async (req, res) => {
  const { roomId } = req.params;
  try {
    const doc = await Document.findOne({ roomId }).select("versions");
    if (!doc) return res.status(404).json({ error: "Room not found" });
    res.json({ versions: doc.versions.slice(-20).reverse() });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/rooms/:roomId/restore — restore a version
router.post("/:roomId/restore", async (req, res) => {
  const { roomId } = req.params;
  const { content } = req.body;
  try {
    await Document.findOneAndUpdate({ roomId }, { content, updatedAt: new Date() }, { upsert: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;