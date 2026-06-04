import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getUserId } from "../utils/helpers";
import { useSocket } from "../hooks/useSockets";
import DocumentEditor from "../components/DocumentEditor";
import Whiteboard from "../components/Whiteboard";
import UserPresence from "../components/UserPresence";
import EditorHeader from "../components/EditorHeader";
import VersionHistory from "../components/Versionhistory";

export default function RoomPage() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const username = searchParams.get("username") || "Anonymous";
  const userId = getUserId();

  const { socket, connected, error: socketError } = useSocket();
  const [users, setUsers] = useState([]);
  const [mode, setMode] = useState("document");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [joined, setJoined] = useState(false);
  const hasJoined = useRef(false);

  // Join room on connect
  useEffect(() => {
    if (!connected || hasJoined.current) return;
    hasJoined.current = true;
    socket.emit("join-room", { roomId, userId, username });
    setJoined(true);
  }, [connected, socket, roomId, userId, username]);

  // Socket event listeners
  useEffect(() => {
    const onRoomUsers = (userList) => setUsers(userList);

    const onUserJoined = ({ username: name }) => {
      toast(`${name} joined`, { className: "!bg-ink-800 !text-white !border !border-white/10 !text-xs !font-mono" });
    };

    const onUserLeft = ({ username: name }) => {
      toast(`${name} left`, { className: "!bg-ink-800 !text-white/60 !border !border-white/5 !text-xs !font-mono" });
    };

    const onModeSwitched = ({ mode: newMode }) => {
      setMode(newMode);
    };

    const onDocSaved = () => setSaveStatus("saved");

    socket.on("room-users", onRoomUsers);
    socket.on("user-joined", onUserJoined);
    socket.on("user-left", onUserLeft);
    socket.on("mode-switched", onModeSwitched);
    socket.on("document-saved", onDocSaved);
    socket.on("strokes-saved", onDocSaved);

    return () => {
      socket.off("room-users", onRoomUsers);
      socket.off("user-joined", onUserJoined);
      socket.off("user-left", onUserLeft);
      socket.off("mode-switched", onModeSwitched);
      socket.off("document-saved", onDocSaved);
      socket.off("strokes-saved", onDocSaved);
    };
  }, [socket]);

  // Also load mode from document
  useEffect(() => {
    socket.once("load-document", ({ mode: docMode }) => {
      if (docMode) setMode(docMode);
    });
  }, [socket]);

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    socket.emit("switch-mode", { roomId, mode: newMode });
  };

  const handleVersionRestore = (content) => {
    socket.emit("save-document", { roomId, content, username });
    // Re-emit to trigger editor reload
    socket.emit("send-changes", { roomId, delta: null, content });
    setSaveStatus("saved");
    toast.success("Version restored");
  };

  // Validate room ID
  if (!/^[a-zA-Z0-9_-]{3,50}$/.test(roomId)) {
    navigate("/");
    return null;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <EditorHeader
        roomId={roomId}
        mode={mode}
        saveStatus={saveStatus}
        onModeSwitch={handleModeSwitch}
        onVersionHistory={() => setShowVersionHistory(true)}
        connected={connected}
        userCount={users.length}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <UserPresence users={users} currentUserId={userId} roomId={roomId} />

        {/* Main Editor Area */}
        <main className="flex-1 overflow-hidden flex flex-col relative">
          {/* Connection Banner */}
          {!connected && (
            <div className="absolute top-0 left-0 right-0 z-20 bg-neon-amber/10 border-b border-neon-amber/20 px-4 py-2 text-center">
              <span className="text-neon-amber/80 text-xs font-mono">
                {socketError ? `Connection error: ${socketError}` : "Reconnecting…"}
              </span>
            </div>
          )}

          {/* Editor / Whiteboard */}
          {joined && mode === "document" && (
            <DocumentEditor
              socket={socket}
              roomId={roomId}
              username={username}
              onSaveStatus={setSaveStatus}
            />
          )}

          {joined && mode === "whiteboard" && (
            <Whiteboard
              socket={socket}
              roomId={roomId}
              username={username}
              onSaveStatus={setSaveStatus}
            />
          )}

          {!joined && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
              <p className="text-white/30 text-sm font-mono">Connecting to room…</p>
            </div>
          )}
        </main>
      </div>

      {/* Version History Overlay */}
      {showVersionHistory && (
        <>
          <div
            className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowVersionHistory(false)}
          />
          <VersionHistory
            roomId={roomId}
            onRestore={handleVersionRestore}
            onClose={() => setShowVersionHistory(false)}
          />
        </>
      )}
    </div>
  );
}
