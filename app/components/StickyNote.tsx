"use client";

import { useEffect, useRef, useState } from "react";

export type NoteColor = "yellow" | "pink" | "blue" | "green" | "purple" | "orange";
export type NoteMode = "type" | "draw";

export interface Note {
  id: string;
  color: NoteColor;
  content: string;
  drawingData?: string;
  mode: NoteMode;
  x: number;
  y: number;
  rotation: number;
  magnetColor: string;
}

export const NOTE_COLORS: Record<NoteColor, string> = {
  yellow: "#FFF176", pink: "#FFCDD2", blue: "#BBDEFB",
  green: "#C8E6C9", purple: "#E1BEE7", orange: "#FFE0B2",
};

export const NOTE_BORDER: Record<NoteColor, string> = {
  yellow: "#F9A825", pink: "#E57373", blue: "#42A5F5",
  green: "#66BB6A", purple: "#AB47BC", orange: "#FFA726",
};

function Magnet({ color }: { color: string }) {
  return <div className="absolute -top-3 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-white/60 shadow-md" style={{ background: `radial-gradient(circle at 35% 35%, white 0%, ${color} 50%, ${color}cc 100%)` }} />;
}

export function StickyNote({ note, onDelete, onMove, selected, onClick, deleteMode }: {
  note: Note;
  onDelete: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  selected: boolean;
  onClick: (id: string) => void;
  deleteMode: boolean;
}) {
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const didMove = useRef(false);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (deleteMode) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current = true;
    didMove.current = false;
    dragOffset.current = { x: event.clientX - note.x, y: event.clientY - note.y };
    event.stopPropagation();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    didMove.current = true;
    onMove(note.id, event.clientX - dragOffset.current.x, event.clientY - dragOffset.current.y);
  };

  const handlePointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (!didMove.current) onClick(note.id);
  };

  return (
    <div
      className="group absolute"
      style={{ left: note.x, top: note.y, transform: `rotate(${note.rotation}deg)`, zIndex: selected ? 20 : 10, cursor: deleteMode ? "pointer" : "grab", touchAction: "none" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={deleteMode ? () => onClick(note.id) : undefined}
    >
      <Magnet color={note.magnetColor} />
      <div
        className="relative flex h-36 w-36 flex-col p-3 pt-4 shadow-lg transition-shadow duration-150 group-hover:shadow-xl"
        style={{ background: NOTE_COLORS[note.color], borderBottom: `3px solid ${NOTE_BORDER[note.color]}`, borderRight: `2px solid ${NOTE_BORDER[note.color]}44`, fontFamily: "cursive", boxShadow: selected ? `0 0 0 3px ${NOTE_BORDER[note.color]}, 0 12px 24px rgba(0,0,0,0.2)` : undefined }}
      >
        {note.mode === "draw" && note.drawingData ? <img src={note.drawingData} alt="Drawing" className="h-full w-full object-contain" draggable={false} /> : <p className="break-words overflow-hidden text-sm leading-snug text-gray-700">{note.content}</p>}
      </div>
      <button type="button" className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-red-400 text-xs text-white shadow group-hover:flex" onClick={(event) => { event.stopPropagation(); onDelete(note.id); }} aria-label="Delete note" title="Delete note">x</button>
    </div>
  );
}

export function DrawingCanvas({ color, onSave }: { color: NoteColor; onSave: (data: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [penSize, setPenSize] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.fillStyle = NOTE_COLORS[color];
    context.fillRect(0, 0, canvas.width, canvas.height);
  }, [color]);

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
    context.strokeStyle = tool === "eraser" ? NOTE_COLORS[color] : "#333";
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const stop = () => { drawing.current = false; };

  return <div className="flex flex-col gap-3">
    <canvas ref={canvasRef} width={280} height={240} className="w-full rounded-lg border-2 border-dashed" style={{ borderColor: NOTE_BORDER[color], touchAction: "none", cursor: tool === "eraser" ? "cell" : "crosshair" }} onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop} onTouchStart={start} onTouchMove={draw} onTouchEnd={stop} />
    <div className="flex items-center justify-between gap-3">
      <div className="flex gap-2"><button type="button" onClick={() => setTool("pen")} className={`rounded-lg p-2 text-sm ${tool === "pen" ? "bg-gray-200 shadow-inner" : ""}`} title="Pen">Pen</button><button type="button" onClick={() => setTool("eraser")} className={`rounded-lg p-2 text-sm ${tool === "eraser" ? "bg-gray-200 shadow-inner" : ""}`} title="Eraser">Erase</button></div>
      <div className="flex items-center gap-2">{[2, 4, 7].map((size) => <button type="button" key={size} onClick={() => setPenSize(size)} className={`rounded-full bg-gray-700 ${penSize === size ? "ring-2 ring-gray-400" : ""}`} style={{ width: size * 3 + 4, height: size * 3 + 4 }} title={`${size}px pen`} />)}</div>
      <button type="button" className="rounded-xl px-4 py-1.5 text-sm font-bold text-white shadow" style={{ background: NOTE_BORDER[color] }} onClick={() => { if (canvasRef.current) onSave(canvasRef.current.toDataURL()); }}>Paste it!</button>
    </div>
  </div>;
}
