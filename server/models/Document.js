const mongoose = require("mongoose");

const StrokeSchema = new mongoose.Schema({
  tool: { type: String, enum: ["pen", "eraser"], default: "pen" },
  color: { type: String, default: "#000000" },
  size: { type: Number, default: 3 },
  points: [{ x: Number, y: Number }],
});

const VersionSchema = new mongoose.Schema({
  content: mongoose.Schema.Types.Mixed,
  savedAt: { type: Date, default: Date.now },
  savedBy: String,
});

const documentSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    content: {
      type: Object,
      default: () => ({ ops: [] }),
    },

    strokes: {
      type: Array,
      default: [],
    },

    mode: {
      type: String,
      enum: ["document", "whiteboard"],
      default: "document",
    },

    versions: [
      {
        content: Object,
        savedAt: {
          type: Date,
          default: Date.now,
        },
        savedBy: {
          type: String,
          default: "Unknown",
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
