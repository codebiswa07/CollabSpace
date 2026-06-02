import { useEffect, useRef, useCallback, useState } from "react";
import { throttle } from "../utils/helpers";

const SAVE_INTERVAL = 4000;

export default function Whiteboard({ socket, roomId, username, onSaveStatus }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawing = useRef(false);
  const currentStroke = useRef([]);
  const allStrokes = useRef([]);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#00f5d4");
  const [size, setSize] = useState(3);

  // Redraw all strokes on canvas
  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(
      0,
      0,
      canvas.width / (window.devicePixelRatio || 1),
      canvas.height / (window.devicePixelRatio || 1)
    );
    allStrokes.current.forEach((stroke) => drawStroke(ctx, stroke));
  }, []);

  function drawStroke(ctx, stroke) {
    if (!stroke.points || stroke.points.length === 0) return;

    if (stroke.points.length === 1) {
      ctx.beginPath();
      ctx.arc(
        stroke.points[0].x,
        stroke.points[0].y,
        stroke.size / 2,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = stroke.color;
      ctx.fill();
      return;
    }
    ctx.beginPath();
    ctx.strokeStyle = stroke.tool === "eraser" ? "#0a0a0f" : stroke.color;
    ctx.lineWidth = stroke.tool === "eraser" ? stroke.size * 5 : stroke.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = stroke.tool === "eraser" ? "destination-out" : "source-over";
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
  }

  // Get canvas coordinates (handles DPI + resize)
  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  // Throttled stroke broadcast
  const broadcastStroke = useCallback(
    throttle((stroke) => {
      socket.emit("draw-stroke", { roomId, stroke });
    }, 50),
    [socket, roomId]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle resize
    function resizeCanvas() {
      const parent = canvas.parentElement;
      const dpr = window.devicePixelRatio || 1;

      const width = parent.clientWidth;
      const height = parent.clientHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");

      // Important: reset transform before scaling
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctxRef.current = ctx;

      redrawAll();
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Load strokes
    socket.once("load-document", ({ strokes }) => {
      if (strokes?.length) {
        allStrokes.current = strokes;
        redrawAll();
      }
    });

    // Receive remote strokes
    socket.on("receive-stroke", ({ stroke }) => {
      allStrokes.current.push(stroke);
      drawStroke(ctxRef.current, stroke);
    });

    // Board cleared
    socket.on("board-cleared", () => {
      allStrokes.current = [];
      ctxRef.current?.clearRect(0, 0, canvas.width, canvas.height);
    });

    // Auto-save
    const saveTimer = setInterval(() => {
      socket.emit("save-strokes", { roomId, strokes: allStrokes.current });
      onSaveStatus("saving");
      setTimeout(() => onSaveStatus("saved"), 800);
    }, SAVE_INTERVAL);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      socket.off("receive-stroke");
      socket.off("board-cleared");
      clearInterval(saveTimer);
    };
  }, [socket, roomId, redrawAll]);

  // Drawing events
  const startDraw = (e) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    isDrawing.current = true;

    const pos = getPos(e, canvas);

    currentStroke.current = [pos];

    ctx.beginPath();

    ctx.globalCompositeOperation =
      tool === "eraser" ? "destination-out" : "source-over";

    ctx.strokeStyle =
      tool === "eraser" ? "rgba(0,0,0,1)" : color;

    ctx.lineWidth =
      tool === "eraser" ? size * 5 : size;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Start exactly where cursor clicked
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x + 0.1, pos.y + 0.1);
    ctx.stroke();

    ctx.globalCompositeOperation = "source-over";
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const pos = getPos(e, canvas);
    currentStroke.current.push(pos);

    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = tool === "eraser" ? "rgba(0,0,0,1)" : color;
    ctx.lineWidth = tool === "eraser" ? size * 5 : size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";

    // Broadcast live stroke point
    broadcastStroke({ tool, color, size, points: currentStroke.current.slice(-20) });
  };

  const endDraw = (e) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (currentStroke.current.length === 1) {
      currentStroke.current.push({
        ...currentStroke.current[0]
      });
    }

    const stroke = {
      tool,
      color,
      size,
      points: currentStroke.current
    };
    allStrokes.current.push(stroke);
    socket.emit("draw-stroke", { roomId, stroke });
    onSaveStatus("unsaved");
    currentStroke.current = [];
  };

  const clearBoard = () => {
    socket.emit("clear-board", { roomId });
    allStrokes.current = [];
    ctxRef.current?.clearRect(
      0,
      0,
      canvasRef.current.width / (window.devicePixelRatio || 1),
      canvasRef.current.height / (window.devicePixelRatio || 1)
    );
  };

  const COLORS = ["#00f5d4", "#ff4d94", "#b14fff", "#ffb700", "#ffffff", "#ff6b6b", "#45b7d1", "#96ceb4"];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="glass border-b border-white/5 px-3 py-2 flex flex-wrap items-center gap-3">
        {/* Tools */}
        <div className="flex items-center gap-1">
          {[
            {
              id: "pen", icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
              )
            },
            {
              id: "eraser", icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 20H7L3 16l13-13 6 6-2 2" /><path d="M6.0001 17.9999l3-3" />
                </svg>
              )
            },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                ${tool === t.id ? "bg-neon-cyan/20 text-neon-cyan" : "text-white/40 hover:text-white hover:bg-white/5"}`}
              title={t.id}
            >
              {t.icon}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-white/10" />

        {/* Colors */}
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setTool("pen"); }}
              className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${color === c && tool === "pen" ? "ring-2 ring-white ring-offset-1 ring-offset-ink-900 scale-110" : ""}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="w-px h-5 bg-white/10" />

        {/* Brush size */}
        <div className="flex items-center gap-2">
          <span className="text-white/30 text-xs font-mono">Size</span>
          <input
            type="range" min="1" max="20" value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-20 accent-neon-cyan cursor-pointer"
          />
          <span className="text-white/50 text-xs font-mono w-4">{size}</span>
        </div>

        <div className="flex-1" />

        {/* Clear */}
        <button
          onClick={clearBoard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all text-xs font-mono"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
          </svg>
          Clear
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-ink-950/50">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair touch-none"
          style={{ cursor: tool === "eraser" ? "cell" : "crosshair" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        <div className="absolute bottom-4 left-4 text-white/10 text-xs font-mono pointer-events-none select-none">
          {tool === "eraser" ? "Erasing" : `Drawing · ${color}`}
        </div>
      </div>
    </div>
  );
}