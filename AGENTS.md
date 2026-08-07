# HeliScheduler - Agent Context

## CRITICAL: Working Directory Rules
All project work MUST happen in the Antigravity scratch folders to maintain consistency between tools:

- **HeliScheduler**: `C:\Users\chadm\.gemini\antigravity\scratch\helicopter-scheduler`
- **NIPSCO Lines**: `C:\Users\chadm\.gemini\antigravity\scratch\transmission-map`
- **KVPZ Tracker**: `C:\Users\chadm\.gemini\antigravity\scratch\kvpz-tracker`
- **AM Sync**: `C:\Users\chadm\.gemini\antigravity\scratch\am_sync_project`

If you are ever working in a different directory (e.g., `C:\Users\chadm\Projects\HeliScheduler`), **STOP and ask the user** if they want to switch to the Antigravity scratch folder.

Never create new project folders outside of `C:\Users\chadm\.gemini\antigravity\scratch\` without explicit permission.

## Current State
- Last updated: 2026-08-07 11:18
- Last tool: opencode
- Last commit: 8985e90 Initial commit - HeliScheduler app with fixed EventModal
- In progress: nothing
- Next planned: TBD
- Known issues: none

## Project Overview
Helicopter scheduling app built with React + Vite. Uses Leaflet for maps, date-fns for time handling, localforage for persistence.

## Tech Stack
- React 19, Vite 8, React Router 7
- Leaflet / React-Leaflet for maps
- date-fns + date-fns-tz for scheduling logic
- localforage for local storage
- oxlint for linting

## Commands
- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run lint` - run oxlint

## Conventions
- No comments unless asked
- Small, focused commits
- Update this file's "Current State" section after every change

