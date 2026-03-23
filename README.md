# ddaytimer

`ddaytimer` is a React + TypeScript + Vite app for tracking D-Day countdowns, holiday plans, mood logs, and archived milestones.

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`

## Core Product Areas

- D-Day countdown cards with share links, progress tracking, and time capsule messages
- Holiday planner board with drag-and-drop tasks
- Emotion logging and timeline history
- Archive view for completed milestones

## Nightly Experiment

This nightly branch adds an offline-first PWA experiment:

- install prompt support for standalone app usage
- service worker update and offline-ready notices
- local-first sync behavior when `/api/sync` is unavailable
- queued sync retries after the network reconnects

## Build Notes

The app is configured as a Progressive Web App through `vite-plugin-pwa`, and production builds emit a web manifest plus service worker assets.
