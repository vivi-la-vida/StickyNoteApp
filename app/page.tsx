"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DrawingCanvas,
  NOTE_BORDER,
  NOTE_COLORS,
  StickyNote,
  type Note,
  type NoteColor,
  type NoteMode,
} from "./components/StickyNote";
import { Magnet } from "./components/Magnet";

const COLOR_SWATCHES: NoteColor[] = ["yellow", "pink", "blue", "green", "purple", "orange"];
const MAGNET_COLORS = ["#EF5350", "#42A5F5", "#66BB6A", "#FFD54F", "#AB47BC", "#FF7043"];
const STORAGE_KEY = "sticky-note-board-notes";
const DELETED_STORAGE_KEY = "sticky-note-board-deleted";

type GiphyResult = { id: string; title: string; url: string };

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
  const [gifQuery, setGifQuery] = useState("");
  const [gifResults, setGifResults] = useState<GiphyResult[]>([]);
  const [selectedGif, setSelectedGif] = useState<GiphyResult | null>(null);
  const [gifLoading, setGifLoading] = useState(false);
  const [gifError, setGifError] = useState("");

  const submit = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (mode === "type" && !text.trim()) return;
    if (mode === "gif") {
      if (!selectedGif) return;
      onAdd({ color, content: "", gifUrl: selectedGif.url, mode: "gif" });
      onClose();
      return;
    }
    onAdd({ color, content: text.trim(), mode });
    onClose();
  };

  const searchGifs = async () => {
    const query = gifQuery.trim();
    if (!query) return;

    setGifLoading(true);
    setGifError("");
    setGifResults([]);
    setSelectedGif(null);
    try {
      const response = await fetch(`/api/giphy?q=${encodeURIComponent(query)}`);
      const payload = await response.json() as { gifs?: GiphyResult[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "GIF search failed.");
      setGifResults(payload.gifs ?? []);
    } catch (error) {
      setGifError(error instanceof Error ? error.message : "GIF search failed.");
    } finally {
      setGifLoading(false);
    }
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
          {(["type", "draw", "gif"] as NoteMode[]).map((option) => (
            <button type="button" key={option} onClick={() => setMode(option)} className="flex-1 py-2 text-sm font-semibold" style={{ background: mode === option ? NOTE_COLORS[color] : "white", color: mode === option ? "#555" : "#aaa" }}>
              {option === "type" ? "Type" : option === "draw" ? "Draw" : "GIF"}
            </button>
          ))}
        </div>

        {mode === "type" ? (
          <>
            <textarea autoFocus value={text} onChange={(event) => setText(event.target.value)} placeholder="Type here..." className="h-40 w-full resize-none rounded-xl p-4 text-sm leading-relaxed text-gray-700 outline-none patrick-hand-text" style={{ background: NOTE_COLORS[color], borderBottom: `3px solid ${NOTE_BORDER[color]}` }} />
            <button type="submit" disabled={!text.trim()} className="mt-3 w-full rounded-xl py-2 font-bold text-white transition hover:opacity-90 active:scale-95 disabled:opacity-40" style={{ background: NOTE_BORDER[color] }}>Paste it!</button>
          </>
        ) : (
          mode === "draw" ? <DrawingCanvas color={color} onSave={saveDrawing} /> : (
            <div>
              <div className="flex gap-2">
                <input
                  value={gifQuery}
                  onChange={(event) => setGifQuery(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void searchGifs(); } }}
                  placeholder="Search GIFs"
                  aria-label="Search GIFs"
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                />
                <button type="button" onClick={() => void searchGifs()} disabled={!gifQuery.trim() || gifLoading} className="rounded-lg px-3 text-sm font-semibold text-white disabled:opacity-50" style={{ background: NOTE_BORDER[color] }}>
                  {gifLoading ? "..." : "Search"}
                </button>
              </div>
              <div className="mt-3 grid max-h-48 grid-cols-3 gap-2 overflow-y-auto">
                {gifResults.map((gif) => (
                  <button type="button" key={gif.id} onClick={() => setSelectedGif(gif)} aria-label={`Select ${gif.title || "GIF"}`} aria-pressed={selectedGif?.id === gif.id} className="aspect-square overflow-hidden rounded-md border-2 bg-gray-100" style={{ borderColor: selectedGif?.id === gif.id ? NOTE_BORDER[color] : "transparent" }}>
                    <img src={gif.url} alt={gif.title || "GIF result"} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
              <p className="mt-2 min-h-5 text-xs text-gray-500" role="status">
                {gifError || (gifLoading ? "Searching..." : gifResults.length === 0 ? "Search GIPHY to choose a GIF." : "Powered by GIPHY")}
              </p>
              <button type="submit" disabled={!selectedGif} className="mt-1 w-full rounded-xl py-2 font-bold text-white transition hover:opacity-90 active:scale-95 disabled:opacity-40" style={{ background: NOTE_BORDER[color] }}>Paste it!</button>
            </div>
          )
        )}
      </form>
    </div>
  );
}

const FRIDGE_BG = "radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.7) 0%, transparent 50%), linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 30%, #c8c8c8 50%, #d8d8d8 70%, #e0e0e0 100%)";
const FRIDGE_LINES = "repeating-linear-gradient(90deg, transparent, transparent 119px, rgba(255,255,255,0.3) 120px, transparent 121px)";

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [deletedNotes, setDeletedNotes] = useState<Note[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [showTrashPanel, setShowTrashPanel] = useState(false);
  const [topZIndexNoteId, setTopZIndexNoteId] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem(STORAGE_KEY);
      const savedDeletedNotes = localStorage.getItem(DELETED_STORAGE_KEY);

      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes) as Note[];
        if (Array.isArray(parsedNotes)) setNotes(parsedNotes);
      }

      if (savedDeletedNotes) {
        const parsedDeletedNotes = JSON.parse(savedDeletedNotes) as Note[];
        if (Array.isArray(parsedDeletedNotes)) setDeletedNotes(parsedDeletedNotes);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(DELETED_STORAGE_KEY);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(deletedNotes));
  }, [deletedNotes, hasHydrated]);

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
    setNotes((previous) => {
      const deletedNote = previous.find((note) => note.id === id);
      if (!deletedNote) return previous;

      setDeletedNotes((current) => [deletedNote, ...current.filter((note) => note.id !== id)].slice(0, 3));
      return previous.filter((note) => note.id !== id);
    });

    setSelected((current) => current === id ? null : current);
    setTopZIndexNoteId((current) => (current === id ? null : current));
  }, []);

  const restoreNote = useCallback((note: Note) => {
    setDeletedNotes((current) => current.filter((deletedNote) => deletedNote.id !== note.id));
    setNotes((previous) => [...previous, { ...note, x: Math.max(40, Math.min(note.x, 540)), y: Math.max(60, Math.min(note.y, 420)) }]);
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
    setTopZIndexNoteId(id);
  }, [deleteMode, deleteNote]);

  const bringToFront = useCallback((id: string) => {
    setTopZIndexNoteId(id);
    setSelected(id);
  }, []);

  const hasNotes = notes.length > 0;

  return (
    <div className="relative h-screen w-screen select-none overflow-hidden">
      <div ref={boardRef} className="absolute inset-4 overflow-hidden rounded-3xl shadow-2xl" style={{ background: FRIDGE_BG }} onClick={() => setSelected(null)}>
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
            onDelete={deleteNote}
            onMove={moveNote}
            selected={selected === note.id}
            onClick={handleNoteClick}
            deleteMode={deleteMode}
            isTopMost={topZIndexNoteId === note.id}
            onBringToFront={bringToFront}
          />
        ))}
      </div>

      <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => setShowModal(true)} className="group absolute right-10 top-8 z-30 transition-transform hover:scale-110 active:scale-95" title="Add note" aria-label="Add note">
        <div className="relative h-14 w-14"><div className="absolute inset-0 rounded-md shadow-md" style={{ background: "#C8E6C9", transform: "rotate(8deg) translate(2px, 3px)" }} /><div className="absolute inset-0 rounded-md shadow-md" style={{ background: "#BBDEFB", transform: "rotate(-5deg) translate(-2px, 2px)" }} /><div className="absolute inset-0 flex items-center justify-center rounded-md border-2 shadow-lg" style={{ background: "#FFF176", borderColor: "#F9A825" }}><span className="text-2xl font-bold leading-none text-gray-700">+</span></div></div>
      </button>

      <button
        type="button"
        onClick={() => {
          setDeleteMode(false);
          setShowTrashPanel((current) => !current);
        }}
        className="absolute bottom-10 right-10 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-transform hover:scale-110 active:scale-95"
        style={{ background: showTrashPanel ? "#EF5350" : "#fff", border: showTrashPanel ? "2px solid #c62828" : "2px solid #ddd" }}
        title="Recently deleted notes"
        aria-label="Open recently deleted notes"
      >
        🗑️
      </button>

      {showTrashPanel && (
        <div className="absolute bottom-28 right-4 z-40 w-72 rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700">Recently deleted</span>
            <button type="button" onClick={() => setShowTrashPanel(false)} className="text-xl text-gray-400 hover:text-gray-600" aria-label="Close deleted notes">×</button>
          </div>

          {deletedNotes.length === 0 ? (
            <p className="text-sm text-gray-500">No recently deleted notes.</p>
          ) : (
            <div className="space-y-3">
              {deletedNotes.map((note) => (
                <div key={note.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-2">
                  <div className="h-10 w-10 overflow-hidden rounded-md border border-gray-300 bg-white/80 p-1">
                    {note.mode === "gif" && note.gifUrl ? (
                      <img src={note.gifUrl} alt="Deleted GIF preview" className="h-full w-full object-cover" />
                    ) : note.mode === "draw" && note.drawingData ? (
                      <img src={note.drawingData} alt="Deleted drawing preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-600" style={{ background: NOTE_COLORS[note.color], fontFamily: "cursive" }}>
                        {note.content.slice(0, 12) || "Note"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-xs font-semibold text-gray-700">{note.mode === "draw" ? "Drawing" : note.content || "Empty note"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      restoreNote(note);
                      setShowTrashPanel(false);
                    }}
                    className="rounded-lg bg-green-500 px-2 py-1 text-xs font-bold text-white shadow hover:bg-green-600"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && <AddNoteModal onClose={() => setShowModal(false)} onAdd={addNote} />}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.15)]" />
    </div>
  );
}
