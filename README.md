# I'm Board: A Simple Sticky Note App

I'm Board is for anyone who wants to jot down ideas quickly and see them together on a visual board. It turns quick thoughts into movable notes instead of leaving them buried in a list.

## Problem and Opportunity

Capturing an idea should take only a moment, and reviewing several ideas at once is easier when they are visible together. I'm Board brings typed notes, quick sketches, and GIFs onto one playful, rearrangeable board.

## Primary User Flow

1. Open the board and choose the add-note button.
2. Choose a note color and whether to type, draw, or search GIPHY for a GIF.
3. Add the note to the board, then drag it into place.
4. Delete notes when they are no longer needed; restore a recently deleted note from the trash panel.

Notes and the recently deleted list are saved in the browser, so they remain available on that browser between visits.

## Technical Stack

- Next.js 16 App Router with React 19
- TypeScript
- Tailwind CSS 4
- Browser `localStorage` for notes and recently deleted notes
- HTML canvas for drawing notes
- GIPHY API for GIF search

## GIPHY API

The GIF picker searches GIPHY and lets the user add a result as a visual note. The server-side `app/api/giphy` route calls GIPHY's search endpoint and returns up to 12 G-rated results. The API key stays on the server and is read from `GIPHY_API_KEY`.

## Run Locally

1. Install dependencies:

	```bash
	npm install
	```

2. To enable GIF search, create `.env.local` in the project root (beside `package.json`) and add your GIPHY API key:

	```env
	GIPHY_API_KEY=your_api_key
	```

	Keep this file private and do not commit your key. Restart the dev server whenever you add or change the key. The rest of the app works without it.

3. Start the development server:

	```bash
	npm run dev
	```

4. Visit [http://localhost:3000/](http://localhost:3000/).

## Deployed Site

Visit [https://sticky-note-app-rho.vercel.app/](https://sticky-note-app-rho.vercel.app/).

## Known Limitations

- Notes are stored only in the current browser; there are no accounts, cloud backups, or cross-device sync.
- GIF search requires a valid GIPHY API key and an internet connection. GIF notes rely on the remote image remaining available.
- The board does not automatically arrange notes or prevent them from overlapping.
- The recently deleted panel retains at most three notes.
- Drawings are stored as image data in `localStorage`, which is subject to browser storage limits.

## What to Improve Next

- Drawing on the sticky note is pretty limited: add an undo button so you don't have to erase an entire drawing, allow a variety of colors.
- Add right mouse click option that allows you to add a new note with the options of "new note, new drawing, new gif".
- Allow users to edit the sticky note after creating it, such as the color and text.
- Improve mobile and keyboard accessibility for creating, selecting, and moving notes.
- Add clearer empty, loading, and retry states for GIF search and image failures.
