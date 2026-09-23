"use client";

import { useCallback, useRef, useState } from "react";
import {
  DrawingCanvas,
  NOTE_BORDER,
  NOTE_COLORS,
  StickyNote,
  type Note,
  type NoteColor,
  type NoteMode,
} from "./components/StickyNote";

const COLOR_SWATCHES: NoteColor[] = ["yellow", "pink", "blue", "green", "purple", "orange"];
const MAGNET_COLORS = ["#EF5350", "#42A5F5", "#66BB6A", "#FFD54F", "#AB47BC", "#FF7043"];

function randomBetween(min: number, max: number) {
  return min + Math.random() * Math.max(0, max - min);
}

function AddNoteModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (note: Omit<Note, "id" | "x" | "y" | "rotation" | "magnetColor">) => void;
}) {
  const [color, setColor] = useState<NoteColor>("yellow");
  const [mode, setMode] = useState<NoteMode>("type");
  const [text, setText] = useState("");

  const submit = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (mode === "type" && !text.trim()) return;
    onAdd({ color, content: text.trim(), mode });
    onClose();
  };

  const saveDrawing = (drawingData: string) => {
    onAdd({ color, content: "", drawingData, mode: "draw" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <form className="relative z-10 w-80 rounded-2xl bg-neutral-50 p-6 shadow-2xl" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-xl text-gray-400 hover:text-gray-600" aria-label="Close">←</button>
          <span className="text-base font-bold text-gray-600">New Note</span>
          <div className="w-6" />
        </div>

        <div className="mb-4 flex justify-center gap-2">
          {COLOR_SWATCHES.map((swatch) => (
            <button
              type="button"
              key={swatch}
              onClick={() => setColor(swatch)}
              className="h-8 w-8 rounded-full transition-transform hover:scale-110"
              style={{ background: NOTE_COLORS[swatch], border: color === swatch ? `3px solid ${NOTE_BORDER[swatch]}` : "3px solid transparent", boxShadow: color === swatch ? `0 0 0 2px white, 0 0 0 4px ${NOTE_BORDER[swatch]}` : "none" }}
              aria-label={`Use ${swatch} note`}
            />
          ))}
        </div>

        <div className="mb-4 flex overflow-hidden rounded-xl border border-gray-200">
          {(["type", "draw"] as NoteMode[]).map((option) => (
            <button type="button" key={option} onClick={() => setMode(option)} className="flex-1 py-2 text-sm font-semibold" style={{ background: mode === option ? NOTE_COLORS[color] : "white", color: mode === option ? "#555" : "#aaa" }}>
              {option === "type" ? "Type" : "Draw"}
            </button>
          ))}
        </div>

        {mode === "type" ? (
          <>
            <textarea autoFocus value={text} onChange={(event) => setText(event.target.value)} placeholder="Type here..." className="h-40 w-full resize-none rounded-xl p-4 text-sm leading-relaxed text-gray-700 outline-none" style={{ background: NOTE_COLORS[color], fontFamily: "cursive", borderBottom: `3px solid ${NOTE_BORDER[color]}` }} />
            <button type="submit" disabled={!text.trim()} className="mt-3 w-full rounded-xl py-2 font-bold text-white transition hover:opacity-90 active:scale-95 disabled:opacity-40" style={{ background: NOTE_BORDER[color] }}>Paste it!</button>
          </>
        ) : (
          <DrawingCanvas color={color} onSave={saveDrawing} />
        )}
      </form>
    </div>
  );
}

const FRIDGE_BG = "radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.7) 0%, transparent 50%), linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 30%, #c8c8c8 50%, #d8d8d8 70%, #e0e0e0 100%)";
const FRIDGE_LINES = "repeating-linear-gradient(90deg, transparent, transparent 119px, rgba(255,255,255,0.3) 120px, transparent 121px)";

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const addNote = useCallback((partial: Omit<Note, "id" | "x" | "y" | "rotation" | "magnetColor">) => {
    const board = boardRef.current;
    const width = board?.clientWidth ?? 700;
    const height = board?.clientHeight ?? 600;
    setNotes((previous) => [...previous, {
      ...partial,
      id: Math.random().toString(36).slice(2),
      x: randomBetween(60, width - 200),
      y: randomBetween(80, height - 220),
      rotation: randomBetween(-8, 8),
      magnetColor: MAGNET_COLORS[Math.floor(Math.random() * MAGNET_COLORS.length)],
    }]);
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((previous) => previous.filter((note) => note.id !== id));
    setSelected((current) => current === id ? null : current);
  }, []);

  const moveNote = useCallback((id: string, x: number, y: number) => {
    setNotes((previous) => previous.map((note) => note.id === id ? { ...note, x, y } : note));
  }, []);

  const handleNoteClick = useCallback((id: string) => {
    if (deleteMode) {
      deleteNote(id);
      return;
    }
    setSelected((current) => current === id ? null : id);
  }, [deleteMode, deleteNote]);

  const hasNotes = notes.length > 0;

  return (
    <div className="relative h-screen w-screen select-none overflow-hidden">
      <div ref={boardRef} className="absolute inset-4 overflow-hidden rounded-3xl shadow-2xl" style={{ background: FRIDGE_BG }} onClick={() => setSelected(null)}>
        <div className="absolute inset-0 opacity-40" style={{ background: FRIDGE_LINES }} />
        <div className="absolute right-7 top-1/2 h-32 w-3 -translate-y-1/2 rounded-full shadow-inner" style={{ background: "linear-gradient(90deg, #aaa 0%, #e0e0e0 40%, #aaa 60%, #888 100%)" }} />
        <div className="absolute left-0 right-0 top-0 h-1 rounded-t-3xl" style={{ background: "linear-gradient(90deg, #bbb, #ddd, #bbb)" }} />

        <div className="absolute shadow-xl" style={{ top: 32, left: hasNotes ? 40 : "50%", transform: hasNotes ? "rotate(-3deg)" : "rotate(-3deg) translateX(-50%)", transition: "left 0.6s ease, transform 0.3s ease", zIndex: 5 }}>
          <div className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full shadow" style={{ background: "radial-gradient(circle at 35% 35%, white, #EF5350)" }} />
          <div className="px-8 py-6 shadow-md" style={{ background: "#FFF176", borderBottom: "3px solid #F9A825", fontFamily: "cursive", fontSize: hasNotes ? "1.5rem" : "2.8rem", transition: "font-size 0.4s ease", minWidth: hasNotes ? "160px" : "320px" }}>
            <div className="font-bold leading-tight text-gray-800">I&apos;m Board</div>
            <div className="mt-1 text-gray-500" style={{ fontSize: "0.7em" }}>:)</div>
          </div>
        </div>

        {!hasNotes && <div className="pointer-events-none absolute bottom-24 left-0 right-0 flex justify-center"><p className="text-lg text-gray-400" style={{ fontFamily: "cursive" }}>Ideas live here</p></div>}

        {notes.map((note) => <StickyNote key={note.id} note={note} onDelete={deleteNote} onMove={moveNote} selected={selected === note.id} onClick={handleNoteClick} deleteMode={deleteMode} />)}
      </div>

      <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => setShowModal(true)} className="group absolute right-10 top-8 z-30 transition-transform hover:scale-110 active:scale-95" title="Add note" aria-label="Add note">
        <div className="relative h-14 w-14"><div className="absolute inset-0 rounded-md shadow-md" style={{ background: "#C8E6C9", transform: "rotate(8deg) translate(2px, 3px)" }} /><div className="absolute inset-0 rounded-md shadow-md" style={{ background: "#BBDEFB", transform: "rotate(-5deg) translate(-2px, 2px)" }} /><div className="absolute inset-0 flex items-center justify-center rounded-md border-2 shadow-lg" style={{ background: "#FFF176", borderColor: "#F9A825" }}><span className="text-2xl font-bold leading-none text-gray-700">+</span></div></div>
      </button>

      <button type="button" onClick={() => setDeleteMode((active) => !active)} className="absolute bottom-10 right-10 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-transform hover:scale-110 active:scale-95" style={{ background: deleteMode ? "#EF5350" : "#fff", border: deleteMode ? "2px solid #c62828" : "2px solid #ddd" }} title={deleteMode ? "Click a note to delete it" : "Delete mode"} aria-label="Toggle delete mode">🗑️</button>

      {deleteMode && <div className="absolute bottom-28 right-4 z-30 rounded-xl bg-red-400 px-3 py-2 text-sm text-white shadow">Click a note to delete it</div>}
      {showModal && <AddNoteModal onClose={() => setShowModal(false)} onAdd={addNote} />}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.15)]" />
    </div>
  );
}
