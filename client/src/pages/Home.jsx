import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateRoomId, getUserId, getUsername, setUsername } from "../utils/helpers";

const RECENT_KEY = "collab_recent_rooms";

function getRecentRooms() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); }
  catch { return []; }
}

function addRecentRoom(roomId, username) {
  const rooms = getRecentRooms().filter((r) => r.roomId !== roomId);
  rooms.unshift({ roomId, username, joinedAt: new Date().toISOString() });
  localStorage.setItem(RECENT_KEY, JSON.stringify(rooms.slice(0, 5)));
}

export default function Home() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [username, setUsernameState] = useState(getUsername() || "");
  const [error, setError] = useState("");
  const [recentRooms, setRecentRooms] = useState([]);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    setRecentRooms(getRecentRooms());
  }, []);

  const handleJoin = (rid) => {
    const finalRoom = (rid || roomId).trim().toUpperCase().replace(/\s+/g, "");
    const finalUser = username.trim() || "Anonymous";
    if (!finalRoom) { setError("Please enter a room ID"); return; }
    if (!/^[a-zA-Z0-9_-]{3,50}$/.test(finalRoom)) {
      setError("Room ID must be 3-50 alphanumeric characters");
      return;
    }
    setError("");
    setJoining(true);
    setUsername(finalUser);
    addRecentRoom(finalRoom, finalUser);
    setTimeout(() => navigate(`/room/${finalRoom}?username=${encodeURIComponent(finalUser)}`), 200);
  };

  const createRoom = () => {
    const newId = generateRoomId();
    setRoomId(newId);
    handleJoin(newId);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Logo / Header */}
      <div className="text-center mb-12 animate-slide-up">
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00f5d4" strokeWidth="2">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
            </svg>
          </div>
          <span className="font-display font-800 text-2xl tracking-tight text-white">CollabSpace</span>
        </div>
        <h1 className="font-display font-700 text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-4">
          Create Together,<br />
          <span className="text-neon-cyan">In Real Time</span>
        </h1>
        <p className="text-white/50 font-body text-base sm:text-lg max-w-md mx-auto leading-relaxed">
          Collaborative documents & whiteboard with instant sync. No sign-up required.
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <div className="glass rounded-2xl p-6 sm:p-8 neon-border">
          {/* Username */}
          <div className="mb-5">
            <label className="block text-white/60 text-xs font-mono uppercase tracking-widest mb-2">
              Your Name
            </label>
            <input
              className="input-field"
              placeholder="Enter your name…"
              value={username}
              onChange={(e) => setUsernameState(e.target.value)}
              maxLength={30}
            />
          </div>

          {/* Room ID */}
          <div className="mb-5">
            <label className="block text-white/60 text-xs font-mono uppercase tracking-widest mb-2">
              Room ID
            </label>
            <input
              className="input-field"
              placeholder="e.g. A1B2C3D4"
              value={roomId}
              onChange={(e) => { setRoomId(e.target.value.toUpperCase()); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              maxLength={50}
            />
            {error && <p className="text-red-400 text-xs mt-2 font-mono">{error}</p>}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              onClick={() => handleJoin()}
              disabled={joining}
            >
              {joining ? (
                <span className="inline-block w-4 h-4 border-2 border-ink-950/30 border-t-ink-950 rounded-full animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"/>
                </svg>
              )}
              Join Room
            </button>
            <button
              className="btn-ghost flex-1 flex items-center justify-center gap-2"
              onClick={createRoom}
              disabled={joining}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
              </svg>
              New Room
            </button>
          </div>
        </div>

        {/* Recent Rooms */}
        {recentRooms.length > 0 && (
          <div className="mt-6 animate-fade-in">
            <p className="text-white/30 text-xs font-mono uppercase tracking-widest mb-3 px-1">
              Recent Rooms
            </p>
            <div className="space-y-2">
              {recentRooms.map((r) => (
                <button
                  key={r.roomId}
                  onClick={() => { setRoomId(r.roomId); handleJoin(r.roomId); }}
                  className="w-full glass glass-hover rounded-xl px-4 py-3 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-neon-cyan/50 group-hover:bg-neon-cyan transition-colors" />
                    <span className="font-mono text-sm text-white/80 group-hover:text-white">{r.roomId}</span>
                  </div>
                  <span className="text-white/30 text-xs font-mono">
                    {new Date(r.joinedAt).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {[
            { icon: "⚡", label: "Instant Sync" },
            { icon: "🎨", label: "Whiteboard" },
            { icon: "💾", label: "Persistent" },
          ].map((f) => (
            <div key={f.label} className="glass rounded-xl p-3 text-center">
              <div className="text-xl mb-1">{f.icon}</div>
              <div className="text-white/40 text-xs font-mono">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}