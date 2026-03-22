# Link Saver — Project Guide

## What This App Is

A personal link saver — save tweets, articles, webpages, and anything else you want to come back to later. It runs as a web app designed to be "saved to homescreen" on iPhone so it looks and feels like a native app.

## Design Philosophy

- **Apple-level polish.** Every detail should feel premium — smooth animations, clean typography, generous whitespace.
- **Liquid glass aesthetic.** Translucent panels with backdrop blur, soft glows, subtle gradients, and frosted-glass surfaces. Think iOS 26 / visionOS.
- **Mobile-first.** Built for iPhone. The primary use case is saving and browsing links on a phone. Desktop is a bonus, not the priority.
- **Simple and fast.** One tap to save a link. No friction. No accounts. No complexity.

## Tech Stack

This is a simple, self-contained web app. No build tools, no frameworks, no npm.

- **HTML / CSS / JavaScript** — vanilla, no dependencies
- **Single `index.html` file** (or minimal files) — keeps deployment dead simple
- **LocalStorage** for saving links — no server, no database, no login
- **Service Worker** for offline support and PWA "add to homescreen" capability
- **`manifest.json`** for PWA metadata (app name, icon, theme colour)

### Why these choices?

The owner is not a developer. Keeping everything in plain HTML/CSS/JS with no build step means:
- Open any file and read it — it's just standard web code
- No `npm install`, no bundlers, no config files
- Deploy by dropping files on any static host (Netlify, Vercel, GitHub Pages, etc.)

## Code Style

- **Comment generously.** Explain *why*, not just *what*. Assume the reader knows basic HTML/CSS but not JavaScript patterns.
- **Plain language.** No jargon without explanation. If a concept is technical (e.g., Service Worker, localStorage), add a short comment explaining it in simple terms.
- **Keep functions short.** Each function does one thing. Name it clearly so the code reads like English.
- **No cleverness.** Prefer obvious, readable code over compact or "clever" solutions.
- **CSS custom properties** (variables) for all colours, spacing, and design tokens — makes theming easy and keeps values consistent.

## Key Features (MVP)

1. **Save a link** — paste or share a URL, give it an optional title/note
2. **Browse saved links** — scrollable list, newest first
3. **Open a link** — tap to open in a new tab
4. **Delete a link** — swipe or tap to remove
5. **Offline access** — saved links are available even without internet
6. **PWA homescreen** — add to homescreen on iPhone, launches fullscreen like a native app

## File Structure

```
link-app/
├── CLAUDE.md          # This file — project guide for Claude
├── index.html         # The app (HTML + inline or linked CSS/JS)
├── style.css          # Styles — liquid glass design system
├── app.js             # App logic — saving, loading, deleting links
├── sw.js              # Service Worker — enables offline + PWA
├── manifest.json      # PWA manifest — app name, icons, theme
└── icons/             # App icons for homescreen (192x192, 512x512)
```

## Design Tokens

Use CSS custom properties. Example palette:

```css
--glass-bg: rgba(255, 255, 255, 0.15);
--glass-border: rgba(255, 255, 255, 0.3);
--glass-blur: 20px;
--text-primary: #1d1d1f;       /* Apple-style near-black */
--text-secondary: #6e6e73;
--accent: #007aff;              /* iOS blue */
--bg-gradient: linear-gradient(135deg, #667eea, #764ba2);
--radius: 16px;
--shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
```

## Commands

No build step. To work on this locally:

```bash
# Serve locally (any static server works)
npx serve .
# or
python3 -m http.server 8000
```

## Notes

- All data lives in the browser's localStorage. There is no backend. If the user clears browser data, saved links are lost.
- The app should handle the Web Share Target API if possible, so users can "share" a link from Safari directly into the app.
- Keep the total app size tiny — aim for under 100KB total so it loads instantly.
- Test on iPhone Safari. That's the primary target.
