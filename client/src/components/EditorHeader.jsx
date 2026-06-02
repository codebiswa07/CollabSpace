import { useState } from "react";
import { copyToClipboard, exportAsHTML } from "../utils/helpers";
import { toast } from "react-toastify";

const SAVE_LABELS = {
  saved: { label: "Saved", color: "text-neon-cyan/70", dot: "bg-neon-cyan" },
  saving: { label: "Saving…", color: "text-white/40", dot: "bg-white/30 animate-pulse" },
  unsaved: { label: "Unsaved", color: "text-neon-amber/60", dot: "bg-neon-amber/60" },
  idle: { label: "Ready", color: "text-white/20", dot: "bg-white/10" },
};

export default function EditorHeader({
  roomId,
  mode,
  saveStatus,
  onModeSwitch,
  onVersionHistory,
  connected,
  userCount,
}) {
  const [copying, setCopying] = useState(false);

  const copyLink = async () => {
    const ok = await copyToClipboard(window.location.href);
    if (ok) { toast.success("Room link copied!"); setCopying(true); setTimeout(() => setCopying(false), 1500); }
  };

  const sv = SAVE_LABELS[saveStatus] || SAVE_LABELS.idle;

  return (
    <header className="glass border-b border-white/5 px-3 sm:px-5 py-3 flex items-center gap-3 flex-wrap z-20">
      {/* Logo */}
      <a href="/" className="flex items-center gap-2 flex-shrink-0 group">
        <div className="w-7 h-7 rounded-lg bg-neon-cyan/20 border border-neon-cyan/30 flex items-center justify-center group-hover:border-neon-cyan/60 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00f5d4" strokeWidth="2.5">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
          </svg>
        </div>
        <span className="font-display font-700 text-sm text-white/80 group-hover:text-white transition-colors hidden sm:block">
          CollabSpace
        </span>
      </a>

      <div className="w-px h-5 bg-white/10 flex-shrink-0" />

      {/* Room ID */}
      <div className="flex items-center gap-2">
        <span className="text-white/30 text-xs font-mono hidden sm:block">Room</span>
        <span className="text-white/70 text-xs font-mono bg-white/5 px-2 py-1 rounded-lg">{roomId}</span>
        <button
          onClick={copyLink}
          className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/30 hover:text-neon-cyan transition-all"
          title="Copy room link"
        >
          {copying ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00f5d4" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          )}
        </button>
      </div>

      {/* Mode Switch */}
      <div className="flex items-center glass rounded-lg p-1 gap-1">
        {["document", "whiteboard"].map((m) => (
          <button
            key={m}
            onClick={() => onModeSwitch(m)}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all capitalize
              ${mode === m ? "bg-neon-cyan/20 text-neon-cyan" : "text-white/30 hover:text-white"}`}
          >
            {m === "document" ? "📝 Doc" : "🎨 Board"}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Status indicators */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Connection */}
        <div className="flex items-center gap-1.5" title={connected ? "Connected" : "Disconnected"}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-neon-cyan" : "bg-red-500 animate-pulse"}`} />
          <span className="text-white/30 text-xs font-mono hidden sm:block">
            {connected ? `${userCount} online` : "offline"}
          </span>
        </div>

        {/* Save Status */}
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${sv.dot}`} />
          <span className={`text-xs font-mono ${sv.color} hidden sm:block`}>{sv.label}</span>
        </div>

        {/* Version History (doc mode only) */}
        {mode === "document" && (
          <button
            onClick={onVersionHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass glass-hover text-white/50 hover:text-white text-xs font-mono transition-all"
            title="Version history"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="hidden sm:block">History</span>
          </button>
        )}

        {/* Export */}
        {mode === "document" && (
          <button
            onClick={() => {
              const el = document.querySelector(".ql-editor");
              if (el) exportAsHTML(el.innerHTML);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass glass-hover text-white/50 hover:text-white text-xs font-mono transition-all"
            title="Export as HTML"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            <span className="hidden sm:block">Export</span>
          </button>
        )}
      </div>
    </header>
  );
}