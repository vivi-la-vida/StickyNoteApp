"use client";

import { useRef } from "react";
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

