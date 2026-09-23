"use client";

import { useState, useRef, useEffect } from "react";
import {
  NOTE_COLORS,
  NOTE_COLORS_DARK,
  ChecklistContent,
  StickyNote,
  type Note,
  type NoteColor,
} from "./components/StickyNote";

const NOTE_COLORS_MED: Record<NoteColor, string> = {
  yellow: "#F5DC60",
  pink: "#FF8FAF",
  blue: "#85C4FF",
  green: "#7DE8A8",
  lavender: "#BB8FFF",
};

const CATEGORY_COLORS: NoteColor[] = ["yellow", "pink", "blue", "green", "lavender"];

function getCategories(notes: Note[]): string[] {
  return Array.from(new Set(notes.map((n) => n.category)));
}

function getCategoryColor(category: string, categories: string[]): NoteColor {
  const idx = categories.indexOf(category);
  return CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
}

// ── Inline editable text helpers ──────────────────────────────────────────────

function EditableTitle({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const commit = () => {
    const t = draft.trim();
    if (t && t !== value) onChange(t);
    else setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
        className="text-3xl font-semibold text-stone-800 bg-transparent focus:outline-none border-b-2 border-stone-400"
        style={{ fontFamily: "var(--font-sketch)", minWidth: 120 }}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-3xl font-semibold text-stone-800 flex items-center gap-2 hover:text-stone-600 transition-colors group"
      style={{ fontFamily: "var(--font-sketch)" }}
    >
      {value}
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none"
        className="opacity-0 group-hover:opacity-40 transition-opacity">
        <path d="M10 2L12 4L5 11H3V9L10 2Z" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

// ── Add Note Modal ─────────────────────────────────────────────────────────────

function AddNoteModal({
  onSave,
  onClose,
}: {
  onSave: (text: string, color: NoteColor, checklist: boolean) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [checklist, setChecklist] = useState(false);
  const [color, setColor] = useState<NoteColor>("yellow");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const handleSave = () => {
    if (text.trim()) onSave(text.trim(), color, checklist);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(80,65,45,0.35)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-3xl overflow-hidden flex flex-col"
        style={{ width: "min(520px, 100%)", background: NOTE_COLORS[color], boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
      >
        {/* Color bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex gap-2.5">
            {(["yellow", "pink", "blue", "green", "lavender"] as NoteColor[]).map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="rounded-full transition-transform active:scale-90"
                style={{
                  width: 22, height: 22,
                  background: NOTE_COLORS[c],
                  border: color === c ? `3px solid ${NOTE_COLORS_DARK[c]}` : "3px solid rgba(0,0,0,0.1)",
                  boxShadow: color === c ? "0 0 0 2px white" : "none",
                }}
              />
            ))}
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-800 text-xl leading-none transition-colors">✕</button>
        </div>

        {/* Text area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your idea here..."
          rows={5}
          className="mx-6 mb-4 bg-transparent resize-none focus:outline-none text-2xl leading-relaxed text-stone-700 placeholder-stone-400"
          style={{ fontFamily: "var(--font-sketch)" }}
        />

        <label className="flex items-center gap-2 px-6 pb-4 text-stone-600" style={{ fontFamily: "var(--font-body)" }}>
          <input type="checkbox" checked={checklist} onChange={(e) => setChecklist(e.target.checked)} />
          Use as checklist
        </label>

        {/* Save button */}
        <div className="px-6 pb-5">
          <button
            onClick={handleSave}
            disabled={!text.trim()}
            className="w-full py-2.5 rounded-2xl font-semibold text-lg transition-all disabled:opacity-30"
            style={{
              fontFamily: "var(--font-sketch)",
              background: "rgba(0,0,0,0.12)",
              color: "#3a2e1a",
            }}
          >
            Add note ↵
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stack flip overlay ─────────────────────────────────────────────────────────

function StackOverlay({
  category,
  notes,
  startIndex,
  onClose,
  onDelete,
  onEditNote,
  onToggleChecklistItem,
}: {
  category: string;
  notes: Note[];
  startIndex: number;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEditNote: (id: string, text: string) => void;
  onToggleChecklistItem: (id: string, index: number) => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [flipping, setFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState<"next" | "prev">("next");
  const [editingText, setEditingText] = useState(false);
  const [draft, setDraft] = useState("");
  const total = notes.length;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") flip("next");
      if (e.key === "ArrowLeft") flip("prev");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const flip = (dir: "next" | "prev") => {
    if (flipping || editingText) return;
    if (dir === "next" && index >= total - 1) return;
    if (dir === "prev" && index <= 0) return;
    setFlipDir(dir);
    setFlipping(true);
    setTimeout(() => {
      setIndex((i) => dir === "next" ? i + 1 : i - 1);
      setFlipping(false);
    }, 280);
  };

  const note = notes[index];
  if (!note) return null;
  const stackDepth = Math.min(3, total - index - 1);

  const startEdit = () => {
    setDraft(note.text);
    setEditingText(true);
  };
  const commitEdit = () => {
    const t = draft.trim();
    if (t && t !== note.text) onEditNote(note.id, t);
    setEditingText(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(60,50,35,0.5)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !editingText) onClose(); }}
    >
      <div className="flex flex-col items-center gap-6" style={{ width: "min(500px, 90vw)" }}>
        {/* Header */}
        <div className="flex items-center justify-between w-full px-2">
          <span className="text-stone-300 text-xl" style={{ fontFamily: "var(--font-sketch)" }}>{category}</span>
          <span className="text-stone-400 text-lg" style={{ fontFamily: "var(--font-sketch)" }}>{index + 1} / {total}</span>
        </div>

        {/* Stack */}
        <div className="relative w-full" style={{ height: 320 }}>
          {Array.from({ length: stackDepth }).map((_, i) => {
            const depth = stackDepth - i;
            const behind = notes[index + depth];
            if (!behind) return null;
            return (
              <div
                key={behind.id}
                className="absolute inset-0 rounded-3xl"
                style={{
                  background: NOTE_COLORS[behind.color],
                  boxShadow: "3px 4px 12px rgba(0,0,0,0.18)",
                  transform: `translateY(${depth * 7}px) rotate(${depth % 2 === 0 ? depth * 1.8 : -depth * 1.8}deg)`,
                  zIndex: i + 1,
                }}
              />
            );
          })}

          <div
            className="absolute inset-0 rounded-3xl p-8 flex flex-col"
            style={{
              background: NOTE_COLORS[note.color],
              boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
              zIndex: stackDepth + 2,
              transform: flipping && flipDir === "next"
                ? "translateY(-130%) rotate(-6deg)"
                : flipping && flipDir === "prev"
                ? "translateY(130%) rotate(6deg)"
                : "none",
              transition: flipping ? "transform 0.26s cubic-bezier(0.4,0,0.2,1)" : "transform 0.15s ease",
              opacity: flipping ? 0 : 1,
            }}
          >
            {editingText ? (
              <div className="flex-1 flex flex-col gap-3">
                <textarea
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="flex-1 text-2xl leading-relaxed text-stone-700 bg-transparent resize-none focus:outline-none"
                  style={{ fontFamily: "var(--font-sketch)" }}
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingText(false)} className="px-4 py-1.5 rounded-full text-stone-500 text-base" style={{ fontFamily: "var(--font-body)", background: "rgba(0,0,0,0.07)" }}>Cancel</button>
                  <button onClick={commitEdit} className="px-4 py-1.5 rounded-full text-stone-700 text-base font-semibold" style={{ fontFamily: "var(--font-body)", background: "rgba(0,0,0,0.12)" }}>Save</button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col" onClick={() => !flipping && flip("next")} style={{ cursor: index < total - 1 ? "pointer" : "default" }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-2xl leading-relaxed text-stone-700 flex-1">
                    <ChecklistContent note={note} onToggle={(itemIndex) => onToggleChecklistItem(note.id, itemIndex)} className="text-2xl" />
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); startEdit(); }} className="shrink-0 opacity-30 hover:opacity-70 transition-opacity mt-0.5">
                    <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
                      <path d="M10 2L12 4L5 11H3V9L10 2Z" stroke="#4a3a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                {index < total - 1 && (
                  <p className="text-sm text-stone-400 mt-auto pt-4 text-right" style={{ fontFamily: "var(--font-body)" }}>tap or → to flip</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5">
          {notes.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className="rounded-full transition-all"
              style={{
                width: i === index ? 20 : 7, height: 7,
                background: i === index ? NOTE_COLORS_MED[note.color] : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button onClick={() => flip("prev")} disabled={index === 0}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white disabled:opacity-20 transition-colors text-xl"
            style={{ background: "rgba(255,255,255,0.12)" }}>←</button>
          <button
            onClick={() => { onDelete(note.id); if (index >= total - 1) setIndex(Math.max(0, total - 2)); if (total <= 1) onClose(); }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-red-300 transition-colors"
            style={{ background: "rgba(255,255,255,0.12)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M6 5V3h4v2M7 8v4M9 8v4M4 5l1 8h6l1-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button onClick={() => flip("next")} disabled={index === total - 1}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white disabled:opacity-20 transition-colors text-xl"
            style={{ background: "rgba(255,255,255,0.12)" }}>→</button>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────

function Sidebar({
  notes,
  selected,
  onSelect,
  onAddNote,
}: {
  notes: Note[];
  selected: string | null;
  onSelect: (cat: string | null) => void;
  onAddNote: () => void;
}) {
  const categories = getCategories(notes);
  const total = notes.length;

  return (
    <aside
      className="flex flex-col h-full shrink-0"
      style={{ width: 240, background: "#EDE7DA", borderRight: "1px solid #DDD6C8" }}
    >
      {/* Logo */}
      <div className="px-5 pt-7 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: NOTE_COLORS.yellow, boxShadow: "1px 2px 4px rgba(0,0,0,0.12)" }}>💡</div>
          <span className="text-xl font-semibold text-stone-700" style={{ fontFamily: "var(--font-sketch)" }}>My Ideas</span>
        </div>
      </div>

      {/* Add note */}
      <div className="px-4 pb-4">
        <button
          onClick={onAddNote}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-stone-600 font-medium transition-all hover:bg-black/5 active:scale-98"
          style={{ fontFamily: "var(--font-sketch)", fontSize: 17, border: "1.5px dashed #C8C0B0" }}
        >
          <span className="text-lg leading-none">+</span> New Note
        </button>
      </div>

      <div className="px-4 pb-2">
        <p className="text-xs text-stone-400 uppercase tracking-widest" style={{ fontFamily: "var(--font-body)", fontSize: 10 }}>Categories</p>
      </div>

      {/* All notes */}
      <button
        onClick={() => onSelect(null)}
        className="mx-3 mb-1 flex items-center justify-between px-3 py-2 rounded-xl transition-all"
        style={{
          background: selected === null ? "rgba(0,0,0,0.07)" : "transparent",
          fontFamily: "var(--font-sketch)",
        }}
      >
        <span className="text-base text-stone-700">All Notes</span>
        <span className="text-sm text-stone-400">{total}</span>
      </button>

      {/* Category list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 flex flex-col gap-0.5">
        {categories.map((cat) => {
          const count = notes.filter((n) => n.category === cat).length;
          const col = getCategoryColor(cat, categories);
          return (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              className="flex items-center justify-between px-3 py-2 rounded-xl transition-all group"
              style={{
                background: selected === cat ? "rgba(0,0,0,0.07)" : "transparent",
                fontFamily: "var(--font-sketch)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: NOTE_COLORS_MED[col] }} />
                <span className="text-base text-stone-700 text-left">{cat}</span>
              </div>
              <span className="text-sm text-stone-400">{count}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

// ── Main canvas ────────────────────────────────────────────────────────────────

function LegacyApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [stackNote, setStackNote] = useState<{ category: string; index: number } | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "stack">("grid");
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const categories = getCategories(notes);

  const visibleNotes = selectedCategory
    ? notes.filter((n) => n.category === selectedCategory)
    : notes;

  const handleSave = (text: string, color: NoteColor, category: string, checklist: boolean) => {
    setNotes((prev) => [...prev, { id: Date.now().toString(), text, color, category, createdAt: Date.now(), checklist, checkedItems: checklist ? text.split("\n").map(() => false) : undefined }]);
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleEdit = (id: string, text: string) => {
    setNotes((prev) => prev.map((note) => note.id === id
      ? { ...note, text, checkedItems: note.checklist ? text.split("\n").map((_, index) => note.checkedItems?.[index] ?? false) : undefined }
      : note));
  };

  const handleToggleChecklistItem = (id: string, index: number) => {
    setNotes((prev) => prev.map((note) => note.id === id
      ? { ...note, checkedItems: note.checkedItems?.map((checked, itemIndex) => itemIndex === index ? !checked : checked) }
      : note));
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
    setNotes((prev) => prev.map((n) => n.category === oldName ? { ...n, category: newName } : n));
    if (selectedCategory === oldName) setSelectedCategory(newName);
  };

  const handleReorder = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setNotes((prev) => {
      const fromIdx = prev.findIndex((n) => n.id === fromId);
      const toIdx = prev.findIndex((n) => n.id === toId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  };

  const stackCategory = stackNote?.category ?? selectedCategory ?? (visibleNotes[0]?.category ?? "");
  const stackNotes = stackCategory
    ? notes.filter((n) => n.category === stackCategory)
    : visibleNotes;

  const title = selectedCategory ?? "All Notes";

  return (
    <div className="flex h-full min-h-0 w-full max-w-full overflow-hidden" style={{ background: "#F5F0E6", fontFamily: "var(--font-sketch)" }}>
      <Sidebar
        notes={notes}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
        onAddNote={() => setShowAddModal(true)}
      />

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-8 pt-7 pb-5 shrink-0"
          style={{ borderBottom: "1px solid #DDD6C8" }}
        >
          <div className="flex items-center gap-3">
            {selectedCategory ? (
              <EditableTitle
                value={selectedCategory}
                onChange={(newName) => handleRenameCategory(selectedCategory, newName)}
              />
            ) : (
              <h1 className="text-3xl font-semibold text-stone-800" style={{ fontFamily: "var(--font-sketch)" }}>All Notes</h1>
            )}
            <span className="text-stone-400 text-xl mt-0.5">{visibleNotes.length}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex rounded-xl overflow-hidden" style={{ background: "#DDD6C8" }}>
              <button
                onClick={() => setViewMode("grid")}
                className="px-3 py-2 transition-all"
                style={{ background: viewMode === "grid" ? "#FAF7F2" : "transparent" }}
                title="Grid view"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="6" height="6" rx="1.5" fill={viewMode === "grid" ? "#57534e" : "#a8a29e"} />
                  <rect x="9" y="1" width="6" height="6" rx="1.5" fill={viewMode === "grid" ? "#57534e" : "#a8a29e"} />
                  <rect x="1" y="9" width="6" height="6" rx="1.5" fill={viewMode === "grid" ? "#57534e" : "#a8a29e"} />
                  <rect x="9" y="9" width="6" height="6" rx="1.5" fill={viewMode === "grid" ? "#57534e" : "#a8a29e"} />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("stack")}
                className="px-3 py-2 transition-all"
                style={{ background: viewMode === "stack" ? "#FAF7F2" : "transparent" }}
                title="Stack view"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="6" width="12" height="8" rx="1.5" fill={viewMode === "stack" ? "#57534e" : "#a8a29e"} />
                  <rect x="4" y="3.5" width="10" height="8" rx="1.5" fill={viewMode === "stack" ? "#9ca3af" : "#c4c7cc"} />
                  <rect x="6" y="1" width="8" height="8" rx="1.5" fill={viewMode === "stack" ? "#d1d5db" : "#e5e7eb"} />
                </svg>
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-stone-700 transition-all hover:bg-black/5 active:scale-95"
              style={{ fontFamily: "var(--font-sketch)", fontSize: 17, background: NOTE_COLORS.yellow, boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}
            >
              + Add Note
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto">
          {visibleNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-stone-400">
              <span className="text-5xl">📌</span>
              <p className="text-2xl">No notes yet</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2 rounded-full text-lg"
                style={{ background: NOTE_COLORS.yellow, color: "#4a3a1a", fontFamily: "var(--font-sketch)" }}
              >Add your first idea</button>
            </div>
          ) : viewMode === "grid" ? (
            <div
              className="p-8"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 20,
                alignItems: "start",
              }}
            >
              {visibleNotes.map((note, i) => (
                <StickyNote
                  key={note.id}
                  note={note}
                  onEdit={handleEdit}
                  onToggleChecklistItem={handleToggleChecklistItem}
                  onOpenStack={() => {
                    setStackNote({ category: note.category, index: notes.filter(n => n.category === note.category).findIndex(n => n.id === note.id) });
                  }}
                  isDragOver={dragOver === note.id}
                  onDragStart={() => setDragging(note.id)}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(note.id); }}
                  onDrop={() => { if (dragging) handleReorder(dragging, note.id); setDragging(null); setDragOver(null); }}
                  onDragEnd={() => { setDragging(null); setDragOver(null); }}
                />
              ))}
            </div>
          ) : (
            // Stack view inline (centered in canvas)
            <StackInline
              notes={visibleNotes}
              onDelete={handleDelete}
              onEditNote={handleEdit}
              onToggleChecklistItem={handleToggleChecklistItem}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      {showAddModal && (
        <AddNoteModal
          onSave={(text, color, checklist) => handleSave(text, color, "General", checklist)}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {stackNote && (
        <StackOverlay
          category={stackNote.category}
          notes={notes.filter((n) => n.category === stackNote.category)}
          startIndex={stackNote.index}
          onClose={() => setStackNote(null)}
          onDelete={(id) => { handleDelete(id); }}
          onEditNote={handleEdit}
          onToggleChecklistItem={handleToggleChecklistItem}
        />
      )}
    </div>
  );
}

// ── Stack inline (main view when stack mode selected) ─────────────────────────

function StackInline({
  notes,
  onDelete,
  onEditNote,
  onToggleChecklistItem,
}: {
  notes: Note[];
  onDelete: (id: string) => void;
  onEditNote: (id: string, text: string) => void;
  onToggleChecklistItem: (id: string, index: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState<"next" | "prev">("next");
  const [editingText, setEditingText] = useState(false);
  const [draft, setDraft] = useState("");
  const total = notes.length;

  useEffect(() => {
    if (index >= total) setIndex(Math.max(0, total - 1));
  }, [total, index]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") flip("next");
      if (e.key === "ArrowLeft") flip("prev");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const flip = (dir: "next" | "prev") => {
    if (flipping || editingText) return;
    if (dir === "next" && index >= total - 1) return;
    if (dir === "prev" && index <= 0) return;
    setFlipDir(dir);
    setFlipping(true);
    setTimeout(() => {
      setIndex((i) => dir === "next" ? i + 1 : i - 1);
      setFlipping(false);
    }, 280);
  };

  if (total === 0) return null;

  const safeIndex = Math.min(index, total - 1);
  const note = notes[safeIndex];
  if (!note) return null;
  const stackDepth = Math.min(3, total - safeIndex - 1);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-8 py-12">
      <div className="relative" style={{ width: "min(440px, 100%)", height: 340 }}>
        {Array.from({ length: stackDepth }).map((_, i) => {
          const depth = stackDepth - i;
          const behind = notes[safeIndex + depth];
          if (!behind) return null;
          return (
            <div key={behind.id} className="absolute inset-0 rounded-3xl"
              style={{
                background: NOTE_COLORS[behind.color],
                boxShadow: "3px 5px 16px rgba(0,0,0,0.12)",
                transform: `translateY(${depth * 8}px) rotate(${depth % 2 === 0 ? depth * 1.5 : -depth * 1.5}deg)`,
                zIndex: i + 1,
              }} />
          );
        })}

        <div
          className="absolute inset-0 rounded-3xl p-10 flex flex-col"
          style={{
            background: NOTE_COLORS[note.color],
            boxShadow: "0 8px 28px rgba(0,0,0,0.15)",
            zIndex: stackDepth + 2,
            transform: flipping && flipDir === "next" ? "translateY(-130%) rotate(-5deg)"
              : flipping && flipDir === "prev" ? "translateY(130%) rotate(5deg)" : "none",
            transition: flipping ? "transform 0.26s cubic-bezier(0.4,0,0.2,1)" : "transform 0.15s ease",
            opacity: flipping ? 0 : 1,
          }}
        >
          {editingText ? (
            <div className="flex-1 flex flex-col gap-3">
              <textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
                onBlur={() => { const t = draft.trim(); if (t && t !== note.text) onEditNote(note.id, t); setEditingText(false); }}
                className="flex-1 text-2xl leading-relaxed text-stone-700 bg-transparent resize-none focus:outline-none"
                style={{ fontFamily: "var(--font-sketch)" }} />
              <button onMouseDown={(e) => { e.preventDefault(); const t = draft.trim(); if (t && t !== note.text) onEditNote(note.id, t); setEditingText(false); }}
                className="self-end text-sm px-3 py-1 rounded-full" style={{ fontFamily: "var(--font-body)", background: "rgba(0,0,0,0.1)", color: "#4a3a1a" }}>Done</button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col" onClick={() => !flipping && flip("next")} style={{ cursor: safeIndex < total - 1 ? "pointer" : "default" }}>
              <div className="flex items-start justify-between gap-2">
                <div className="text-2xl leading-relaxed text-stone-700 flex-1">
                  <ChecklistContent note={note} onToggle={(itemIndex) => onToggleChecklistItem(note.id, itemIndex)} className="text-2xl" />
                </div>
                <button onClick={(e) => { e.stopPropagation(); setDraft(note.text); setEditingText(true); }}
                  className="shrink-0 opacity-30 hover:opacity-70 transition-opacity mt-0.5">
                  <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
                    <path d="M10 2L12 4L5 11H3V9L10 2Z" stroke="#4a3a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              {safeIndex < total - 1 && <p className="text-sm text-stone-400 mt-auto pt-4 text-right" style={{ fontFamily: "var(--font-body)" }}>tap or → to flip</p>}
            </div>
          )}
        </div>
      </div>

      {/* Dots */}
      <div className="flex gap-1.5">
        {notes.map((_, i) => (
          <button key={i} onClick={() => setIndex(i)} className="rounded-full transition-all"
            style={{ width: i === safeIndex ? 20 : 7, height: 7, background: i === safeIndex ? NOTE_COLORS_MED[note.color] : "#c8c0b0" }} />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button onClick={() => flip("prev")} disabled={safeIndex === 0}
          className="w-10 h-10 rounded-full flex items-center justify-center text-stone-500 disabled:opacity-20 hover:bg-black/5 transition-colors text-xl"
          style={{ background: "#EDE7DA" }}>←</button>
        <span className="text-stone-400 text-lg w-16 text-center" style={{ fontFamily: "var(--font-sketch)" }}>{safeIndex + 1} / {total}</span>
        <button onClick={() => { onDelete(note.id); if (safeIndex >= total - 1) setIndex(Math.max(0, total - 2)); }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-stone-400 hover:text-red-400 transition-colors"
          style={{ background: "#EDE7DA" }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 5h10M6 5V3h4v2M7 8v4M9 8v4M4 5l1 8h6l1-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button onClick={() => flip("next")} disabled={safeIndex === total - 1}
          className="w-10 h-10 rounded-full flex items-center justify-center text-stone-500 disabled:opacity-20 hover:bg-black/5 transition-colors text-xl"
          style={{ background: "#EDE7DA" }}>→</button>
      </div>
    </div>
  );
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);

  const handleSave = (text: string, color: NoteColor, checklist: boolean) => {
    setNotes((previous) => [...previous, {
      id: Date.now().toString(),
      text,
      color,
      category: "General",
      createdAt: Date.now(),
      checklist,
      checkedItems: checklist ? text.split("\n").map(() => false) : undefined,
    }]);
    setShowAddModal(false);
  };

  const handleEdit = (id: string, text: string) => {
    setNotes((previous) => previous.map((note) => note.id === id
      ? { ...note, text, checkedItems: note.checklist ? text.split("\n").map((_, index) => note.checkedItems?.[index] ?? false) : undefined }
      : note));
  };

  const handleToggleChecklistItem = (id: string, index: number) => {
    setNotes((previous) => previous.map((note) => note.id === id
      ? { ...note, checkedItems: note.checkedItems?.map((checked, itemIndex) => itemIndex === index ? !checked : checked) }
      : note));
  };

  return (
    <main className="relative h-full min-h-0 w-full overflow-hidden" style={{ background: "#d2d4d6", fontFamily: "var(--font-sketch)" }}>
      <button
        type="button"
        onClick={() => setShowAddModal(true)}
        className="absolute right-6 top-6 z-10 flex h-12 w-12 items-center justify-center rounded-full text-3xl text-stone-700 shadow-md transition-transform hover:scale-105 active:scale-95"
        style={{ background: "#f1f2f3" }}
        title="Add note"
        aria-label="Add note"
      >+</button>

      <div className="h-full overflow-y-auto px-6 pb-28 pt-24 sm:px-10">
        {notes.length === 0 ? (
          <div className="flex h-full items-center justify-center text-stone-500">
            <p className="text-xl">Add a note to begin</p>
          </div>
        ) : (
          <div className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {notes.map((note) => (
              <StickyNote
                key={note.id}
                note={note}
                onEdit={handleEdit}
                onDelete={(id) => setNotes((previous) => previous.filter((item) => item.id !== id))}
                onToggleChecklistItem={handleToggleChecklistItem}
                onOpenStack={() => undefined}
                isDragOver={false}
                onDragStart={() => setDragging(note.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => setDragging(null)}
                onDragEnd={() => setDragging(null)}
              />
            ))}
          </div>
        )}
      </div>

      {showAddModal && <AddNoteModal onSave={handleSave} onClose={() => setShowAddModal(false)} />}
    </main>
  );
}

