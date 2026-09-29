"use client";

import type { RefObject } from "react";
import { Magnet } from "./Magnet";
import { StickyNote, type Note } from "./StickyNote";

const FRIDGE_BG = "radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.7) 0%, transparent 50%), linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 30%, #c8c8c8 50%, #d8d8d8 70%, #e0e0e0 100%)";
const FRIDGE_LINES = "repeating-linear-gradient(90deg, transparent, transparent 119px, rgba(255,255,255,0.3) 120px, transparent 121px)";

type BoardProps = {
  boardRef: RefObject<HTMLDivElement | null>;
  notes: Note[];
  selected: string | null;
  topZIndexNoteId: string | null;
  deleteMode: boolean;
  onSelect: (id: string | null) => void;
  onDeleteNote: (id: string) => void;
  onMoveNote: (id: string, x: number, y: number) => void;
  onNoteClick: (id: string) => void;
  onBringToFront: (id: string) => void;
};

export default function Board({
  boardRef,
  notes,
  selected,
  topZIndexNoteId,
  deleteMode,
  onSelect,
  onDeleteNote,
  onMoveNote,
  onNoteClick,
  onBringToFront,
}: BoardProps) {
  const hasNotes = notes.length > 0;

  return (
    <div ref={boardRef} className="absolute inset-4 overflow-hidden rounded-3xl shadow-2xl" style={{ background: FRIDGE_BG }} onClick={() => onSelect(null)}>
      <div className="absolute inset-0 opacity-40" style={{ background: FRIDGE_LINES }} />
      <div className="absolute right-7 top-1/2 h-32 w-3 -translate-y-1/2 rounded-full shadow-inner" style={{ background: "linear-gradient(90deg, #aaa 0%, #e0e0e0 40%, #aaa 60%, #888 100%)" }} />
      <div className="absolute left-0 right-0 top-0 h-1 rounded-t-3xl" style={{ background: "linear-gradient(90deg, #bbb, #ddd, #bbb)" }} />

      <div className="absolute shadow-xl" style={{ top: 32, left: hasNotes ? 40 : "50%", transform: hasNotes ? "rotate(-3deg)" : "rotate(-3deg) translateX(-50%)", transition: "left 0.6s ease, transform 0.3s ease", zIndex: 5 }}>
        <Magnet color="#EF5350" className="-top-2 h-3 w-3 shadow" style={{ background: "radial-gradient(circle at 35% 35%, white, #EF5350)" }} />
        <div className="px-8 py-6 shadow-md" style={{ background: "#FFF176", borderBottom: "3px solid #F9A825", fontFamily: "cursive", fontSize: hasNotes ? "1.5rem" : "2.8rem", transition: "font-size 0.4s ease", minWidth: hasNotes ? "160px" : "320px" }}>
          <div className="font-bold leading-tight text-gray-800 patrick-hand-text">I&apos;m Board</div>
          <div className="mt-1 text-gray-500 patrick-hand-text" style={{ fontSize: "0.7em" }}>:)</div>
        </div>
      </div>

      {!hasNotes && <div className="pointer-events-none absolute bottom-24 left-0 right-0 flex justify-center"><p className="text-lg text-gray-400 patrick-hand-text">Ideas live here</p></div>}

      {notes.map((note) => (
        <StickyNote
          key={note.id}
          note={note}
          onDelete={onDeleteNote}
          onMove={onMoveNote}
          selected={selected === note.id}
          onClick={onNoteClick}
          deleteMode={deleteMode}
          isTopMost={topZIndexNoteId === note.id}
          onBringToFront={onBringToFront}
        />
      ))}
    </div>
  );
}