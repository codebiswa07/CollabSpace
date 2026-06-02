import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ align: [] }],
  ["blockquote", "code-block"],
  ["link"],
  ["clean"],
];

const SAVE_INTERVAL = 5000;

export default function DocumentEditor({
  socket,
  roomId,
  username,
  userId,
  onSaveStatus,
}) {
  const wrapperRef = useRef(null);
  const quillRef = useRef(null);
  const isRemoteChange = useRef(false);

  useEffect(() => {
    if (!socket || !roomId || !wrapperRef.current) return;

    // Prevent duplicate toolbar/editor
    wrapperRef.current.innerHTML = "";

    const editor = document.createElement("div");
    wrapperRef.current.appendChild(editor);

    const quill = new Quill(editor, {
      theme: "snow",
      modules: {
        toolbar: TOOLBAR_OPTIONS,
      },
      placeholder: "Start typing to collaborate...",
    });

    quillRef.current = quill;
    quill.disable();
    quill.setText("Loading document...");

    socket.emit("join-room", {
      roomId,
      userId: userId || socket.id,
      username: username || "Anonymous",
    });

    const handleLoadDocument = ({ content }) => {
      quill.setText("");

      if (content && typeof content === "object" && content.ops) {
        quill.setContents(content);
      } else if (typeof content === "string") {
        quill.setText(content);
      }

      quill.enable();
      quill.focus();
      onSaveStatus?.("saved");
    };

    const handleReceiveChanges = ({ delta, senderId }) => {
      if (!delta || senderId === socket.id) return;

      isRemoteChange.current = true;
      quill.updateContents(delta);
      isRemoteChange.current = false;
    };

    const handleTextChange = (delta, oldDelta, source) => {
      if (source !== "user" || isRemoteChange.current) return;

      socket.emit("send-changes", {
        roomId,
        delta,
      });

      onSaveStatus?.("unsaved");
    };

    quill.on("text-change", handleTextChange);

    socket.once("load-document", handleLoadDocument);
    socket.on("receive-changes", handleReceiveChanges);

    const saveTimer = setInterval(() => {
      socket.emit("save-document", {
        roomId,
        content: quill.getContents(),
        username,
      });

      onSaveStatus?.("saving");
      setTimeout(() => onSaveStatus?.("saved"), 800);
    }, SAVE_INTERVAL);

    return () => {
      clearInterval(saveTimer);

      socket.off("load-document", handleLoadDocument);
      socket.off("receive-changes", handleReceiveChanges);
      quill.off("text-change", handleTextChange);

      quillRef.current = null;

      if (wrapperRef.current) {
        wrapperRef.current.innerHTML = "";
      }
    };
  }, [socket, roomId, username, userId, onSaveStatus]);

  return (
    <div className="w-full h-full bg-white rounded-xl overflow-hidden">
      <div ref={wrapperRef} className="h-full" />
    </div>
  );
}