import { useState, useEffect } from "react";
import { formatDate } from "../utils/helpers";

export default function VersionHistory({ roomId, onRestore, onClose }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(null);

  useEffect(() => {
    fetch(`/api/rooms/${roomId}/versions`)
      .then((r) => r.json())
      .then(({ versions }) => { setVersions(versions || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [roomId]);

  const handleRestore = async (version, idx) => {
    setRestoring(idx);
    await fetch(`/api/rooms/${roomId}/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: version.content }),
    });
    onRestore(version.content);
    setRestoring(null);
    onClose();
  };

  return (
    <div className="fixed inset-y-0 right-0 z-30 w-80 glass border-l border-white/5 flex flex-col shadow-2xl animate-slide-up">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <h3 className="font-display font-600 text-sm text-white">Version History</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {loading && (
          <div className="flex items-center justify-center h-32 text-white/30 text-sm font-mono">
            Loading…
          </div>
        )}

        {!loading && versions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <p className="text-white/20 text-xs font-mono">No versions yet</p>
          </div>
        )}

        {versions.map((v, idx) => (
          <div key={idx} className="mx-2 mb-1 p-3 rounded-xl hover:bg-white/3 group transition-all">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-white/60 text-xs font-mono">{formatDate(v.savedAt)}</p>
                <p className="text-white/30 text-xs mt-0.5 truncate">by {v.savedBy || "Unknown"}</p>
                <p className="text-white/20 text-xs mt-1 line-clamp-2">
                  {typeof v.content === "string"
                    ? v.content.slice(0, 80)
                    : v.content?.ops?.[0]?.insert?.slice(0, 80) || "(rich text)"}
                  …
                </p>
              </div>
              <button
                onClick={() => handleRestore(v, idx)}
                disabled={restoring === idx}
                className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-neon-cyan/10 text-neon-cyan text-xs font-mono
                           opacity-0 group-hover:opacity-100 hover:bg-neon-cyan/20 transition-all disabled:opacity-50"
              >
                {restoring === idx ? "…" : "Restore"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}