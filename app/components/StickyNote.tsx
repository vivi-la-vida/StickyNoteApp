"use client";

import { useRef, useState } from "react";
import { Magnet } from "./Magnet";

export type NoteColor = "yellow" | "pink" | "blue" | "green" | "purple" | "orange";
export type NoteMode = "type" | "draw" | "gif";
export const STICKY_NOTE_SIZE = 144;

export interface Note {
  id: string;
  color: NoteColor;
  content: string;
  drawingData?: string;
  gifUrl?: string;
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

export function StickyNote({ note, onDelete, onMove, selected, onClick, deleteMode, isTopMost, onBringToFront }: {
  note: Note;
  onDelete: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  selected: boolean;
  onClick: (id: string) => void;
  deleteMode: boolean;
  isTopMost: boolean;
  onBringToFront: (id: string) => void;
}) {
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const didMove = useRef(false);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (deleteMode) return;
    onBringToFront(note.id);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current = true;
    didMove.current = false;
    const boardBounds = event.currentTarget.parentElement?.getBoundingClientRect();
    dragOffset.current = {
      x: event.clientX - (boardBounds?.left ?? 0) - note.x,
      y: event.clientY - (boardBounds?.top ?? 0) - note.y,
    };
    event.stopPropagation();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    didMove.current = true;
    const boardBounds = event.currentTarget.parentElement?.getBoundingClientRect();
    onMove(
      note.id,
      event.clientX - (boardBounds?.left ?? 0) - dragOffset.current.x,
      event.clientY - (boardBounds?.top ?? 0) - dragOffset.current.y,
    );
  };

  const handlePointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (!didMove.current) onClick(note.id);
  };

  return (
    <div
      className="group absolute"
      style={{ left: note.x, top: note.y, transform: `rotate(${note.rotation}deg)`, zIndex: isTopMost ? 30 : selected ? 20 : 10, cursor: deleteMode ? "pointer" : "grab", touchAction: "none" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={deleteMode ? () => onClick(note.id) : undefined}
    >
      <Magnet color={note.magnetColor} />
      <div
        className="relative flex h-36 w-36 flex-col p-3 pt-4 shadow-lg transition-shadow duration-150 group-hover:shadow-xl"
        style={{ width: STICKY_NOTE_SIZE, height: STICKY_NOTE_SIZE, background: NOTE_COLORS[note.color], borderBottom: `3px solid ${NOTE_BORDER[note.color]}`, borderRight: `2px solid ${NOTE_BORDER[note.color]}44`, fontFamily: '"Patrick Hand", cursive', boxShadow: selected ? `0 0 0 3px ${NOTE_BORDER[note.color]}, 0 12px 24px rgba(0,0,0,0.2)` : undefined }}
      >
        {note.mode === "gif" && note.gifUrl ? <img src={note.gifUrl} alt="GIF" className="h-full w-full object-cover" draggable={false} /> : note.mode === "draw" && note.drawingData ? <img src={note.drawingData} alt="Drawing" className="h-full w-full object-contain" draggable={false} /> : <p className="break-words overflow-hidden text-sm leading-snug text-gray-700 patrick-hand-text">{note.content}</p>}
      </div>
      <button
        type="button"
        className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-red-400 text-xs text-white shadow transition-opacity hover:scale-110 group-hover:flex"
        onPointerDown={(event) => {
          event.stopPropagation();
          event.preventDefault();
        }}
        onClick={(event) => {
          event.stopPropagation();
          onDelete(note.id);
        }}
        aria-label="Delete note"
        title="Delete note"
      >
        x
      </button>
    </div>
  );
}

export function DrawingCanvas({ color, onSave }: { color: NoteColor; onSave: (data: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const undoHistory = useRef<ImageData[]>([]);
  const [undoCount, setUndoCount] = useState(0);
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
    undoHistory.current.push(context.getImageData(0, 0, canvas.width, canvas.height));
    if (undoHistory.current.length > 20) undoHistory.current.shift();
    setUndoCount(undoHistory.current.length);
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
    context.lineWidth = penSize;
    context.lineCap = "round";
    context.strokeStyle = "#333";
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const stop = () => { drawing.current = false; };

  const undo = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const previous = undoHistory.current.pop();
    if (!canvas || !context || !previous) return;
    drawing.current = false;
    context.putImageData(previous, 0, 0);
    setUndoCount(undoHistory.current.length);
  };

  return <div className="flex flex-col gap-3">
    <canvas ref={canvasRef} width={280} height={240} className="w-full rounded-lg border-2 border-dashed" style={{ background: NOTE_COLORS[color], borderColor: NOTE_BORDER[color], touchAction: "none", cursor: "crosshair" }} onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop} onTouchStart={start} onTouchMove={draw} onTouchEnd={stop} />
    <div className="flex items-center justify-between gap-3">
      <div className="flex gap-2"><button type="button" className="rounded-lg p-2 text-sm text-gray-500 disabled:opacity-40" onClick={undo} disabled={undoCount === 0} title="Undo last stroke">Undo</button></div>
      <div className="flex items-center gap-2">{[2, 4, 7].map((size) => <button type="button" key={size} onClick={() => setPenSize(size)} className={`rounded-full bg-gray-700 ${penSize === size ? "ring-2 ring-gray-400" : ""}`} style={{ width: size * 3 + 4, height: size * 3 + 4 }} title={`${size}px pen`} />)}</div>
      <button type="button" className="rounded-xl px-4 py-1.5 text-sm font-bold text-white shadow" style={{ background: NOTE_BORDER[color] }} onClick={() => { if (canvasRef.current) onSave(canvasRef.current.toDataURL()); }}>Paste it!</button>
    </div>
  </div>;
}

