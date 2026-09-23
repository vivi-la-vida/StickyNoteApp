"use client";

import { useEffect, useState } from "react";

export type NoteColor = "yellow" | "pink" | "blue" | "green" | "lavender";

export interface Note {
  id: string;
  text: string;
  color: NoteColor;
  category: string;
  createdAt: number;
  checklist?: boolean;
  checkedItems?: boolean[];
}

export const NOTE_COLORS: Record<NoteColor, string> = {
  yellow: "#FDED8B",
  pink: "#FFB3C6",
  blue: "#B3D9FF",
  green: "#B3F0C8",
  lavender: "#D4B3FF",
};

export const NOTE_COLORS_DARK: Record<NoteColor, string> = {
  yellow: "#E8CC3A",
  pink: "#FF7098",
  blue: "#5AAEFF",
  green: "#4DD98A",
  lavender: "#A566FF",
};

export function ChecklistContent({
  note,
  onToggle,
  className = "text-lg",
}: {
  note: Note;
  onToggle?: (index: number) => void;
  className?: string;
}) {
  if (!note.checklist) return <>{note.text}</>;

  return (
    <span className={`flex flex-col gap-2 ${className}`}>
      {note.text.split("\n").map((item, index) => (
        <span key={`${item}-${index}`} className="flex items-start gap-2">
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); onToggle?.(index); }}
            className="mt-1.5 w-4 h-4 shrink-0 rounded border-2 border-stone-600/50 flex items-center justify-center"
            style={{ background: note.checkedItems?.[index] ? "rgba(74,58,26,0.35)" : "transparent" }}
            aria-label={note.checkedItems?.[index] ? "Mark incomplete" : "Mark complete"}
          >
            {note.checkedItems?.[index] && <span className="text-xs leading-none">✓</span>}
          </button>
          <span className={note.checkedItems?.[index] ? "line-through opacity-60" : ""}>{item}</span>
        </span>
      ))}
    </span>
  );
}

export function StickyNote({
  note,
  onEdit,
  onDelete,
  onToggleChecklistItem,
  onOpenStack,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  note: Note;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onToggleChecklistItem: (id: string, index: number) => void;
  onOpenStack: () => void;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.text);
  useEffect(() => setDraft(note.text), [note.text]);

  const commit = () => {
    const text = draft.trim();
    if (text && text !== note.text) onEdit(note.id, text);
    else setDraft(note.text);
    setEditing(false);
  };

  return (
    <div
      draggable={!editing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className="rounded-2xl flex flex-col group transition-all duration-150"
      style={{
        background: NOTE_COLORS[note.color],
        boxShadow: isDragOver
          ? `0 0 0 3px ${NOTE_COLORS_DARK[note.color]}, 3px 5px 14px rgba(0,0,0,0.15)`
          : "3px 5px 14px rgba(0,0,0,0.1)",
        cursor: editing ? "default" : "grab",
        opacity: 1,
      }}
    >
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-30 transition-opacity cursor-grab">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex flex-col gap-[3px]">
              {[0, 1].map((column) => <div key={column} className="w-[3px] h-[3px] rounded-full bg-stone-700" />)}
            </div>
          ))}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => { setDraft(note.text); setEditing(true); }}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
              <path d="M10 2L12 4L5 11H3V9L10 2Z" stroke="#4a3a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors text-stone-600 text-xs leading-none"
          >X</button>
        </div>
      </div>

      <div className="flex-1 px-4 pb-4 pt-1">
        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              rows={4}
              className="w-full bg-transparent resize-none focus:outline-none text-lg leading-snug text-stone-700"
              style={{ fontFamily: "var(--font-sketch)" }}
            />
            <div className="flex justify-end">
              <button
                onMouseDown={(e) => { e.preventDefault(); commit(); }}
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{ fontFamily: "var(--font-body)", background: "rgba(0,0,0,0.1)", color: "#4a3a1a" }}
              >Done</button>
            </div>
          </div>
        ) : (
          <p
            className="text-lg leading-snug text-stone-700 cursor-pointer"
            style={{ fontFamily: "var(--font-sketch)" }}
            onClick={onOpenStack}
          >
            <ChecklistContent note={note} onToggle={(index) => onToggleChecklistItem(note.id, index)} />
          </p>
        )}
      </div>
    </div>
  );
}