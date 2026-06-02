import { useState } from "react";
import { formatTime } from "../utils/helpers";

export default function UserPresence({ users, currentUserId, roomId }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`glass border-r border-white/5 flex flex-col transition-all duration-300 ${collapsed ? "w-14" : "w-56 sm:w-64"}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/5">
        {!collapsed && (
          <span className="text-white/50 text-xs font-mono uppercase tracking-widest">
            Online · {users.length}
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all ml-auto"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          )}
        </button>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto py-2">
        {users.map((user) => (
          <div
            key={user.socketId}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg mx-1 transition-colors
              ${user.userId === currentUserId ? "bg-neon-cyan/5" : "hover:bg-white/3"}`}
            title={user.username}
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-600 flex-shrink-0 relative"
              style={{ backgroundColor: user.color + "33", border: `2px solid ${user.color}66` }}
            >
              <span style={{ color: user.color }}>{user.username[0]?.toUpperCase() || "?"}</span>
              {/* Online dot */}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-ink-900"
                style={{ backgroundColor: user.color }}
              />
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-xs font-body truncate">
                  {user.username}
                  {user.userId === currentUserId && (
                    <span className="text-neon-cyan/60 ml-1 text-[10px]">(you)</span>
                  )}
                </p>
              </div>
            )}
          </div>
        ))}

        {users.length === 0 && !collapsed && (
          <p className="text-white/20 text-xs font-mono text-center py-6 px-3">
            Connecting…
          </p>
        )}
      </div>

      {/* Room ID Footer */}
      {!collapsed && (
        <div className="px-3 py-3 border-t border-white/5">
          <p className="text-white/20 text-[10px] font-mono uppercase tracking-widest mb-1">Room</p>
          <p className="text-neon-cyan/70 text-xs font-mono truncate">{roomId}</p>
        </div>
      )}
    </div>
  );
}