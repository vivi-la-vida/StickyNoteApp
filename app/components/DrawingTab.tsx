"use client";

import { useRef, useState } from "react";
import { NOTE_BORDER, NOTE_COLORS, type NoteColor } from "./StickyNote";

type DrawingTabProps = {
  active: boolean;
  color: NoteColor;
  onSave: (data: string) => void;
};

export default function DrawingTab({ active, color, onSave }: DrawingTabProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [penSize, setPenSize] = useState(3);

  const position = (event: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const bounds = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bounds.width;
    const scaleY = canvas.height / bounds.height;
    if ("touches" in event) {
      const touch = event.touches[0] ?? event.changedTouches[0];
      return { x: (touch.clientX - bounds.left) * scaleX, y: (touch.clientY - bounds.top) * scaleY };
    }
    return { x: (event.clientX - bounds.left) * scaleX, y: (event.clientY - bounds.top) * scaleY };
  };

  const start = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    drawing.current = true;
    const point = position(event, canvas);
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!drawing.current || !canvas || !context) return;
    const point = position(event, canvas);
    context.lineWidth = tool === "eraser" ? penSize * 4 : penSize;
    context.lineCap = "round";
    context.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    context.strokeStyle = "#333";
    context.lineTo(point.x, point.y);
    context.stroke();
    context.globalCompositeOperation = "source-over";
  };

  const stop = () => { drawing.current = false; };

  return (
    <div hidden={!active} className="flex flex-col gap-3">
      <canvas
        ref={canvasRef}
        width={280}
        height={240}
        className="w-full rounded-lg border-2 border-dashed"
        style={{ background: NOTE_COLORS[color], borderColor: NOTE_BORDER[color], touchAction: "none", cursor: tool === "eraser" ? "cell" : "crosshair" }}
        onMouseDown={start}
        onMouseMove={draw}
        onMouseUp={stop}
        onMouseLeave={stop}
        onTouchStart={start}
        onTouchMove={draw}
        onTouchEnd={stop}
      />
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <button type="button" onClick={() => setTool("pen")} className={`rounded-lg p-2 text-sm ${tool === "pen" ? "bg-gray-200 shadow-inner" : ""}`} title="Pen">Pen</button>
          <button type="button" onClick={() => setTool("eraser")} className={`rounded-lg p-2 text-sm ${tool === "eraser" ? "bg-gray-200 shadow-inner" : ""}`} title="Eraser">Erase</button>
        </div>
        <div className="flex items-center gap-2">
          {[2, 4, 7].map((size) => (
            <button type="button" key={size} onClick={() => setPenSize(size)} className={`rounded-full bg-gray-700 ${penSize === size ? "ring-2 ring-gray-400" : ""}`} style={{ width: size * 3 + 4, height: size * 3 + 4 }} title={`${size}px pen`} />
          ))}
        </div>
        <button type="button" className="rounded-xl px-4 py-1.5 text-sm font-bold text-white shadow" style={{ background: NOTE_BORDER[color] }} onClick={() => { if (canvasRef.current) onSave(canvasRef.current.toDataURL()); }}>Paste it!</button>
      </div>
    </div>
  );
}