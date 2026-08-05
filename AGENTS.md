# Helicopter Scheduler Agent Guidelines & Mandatory Workflow

All AI models and coding assistants (Antigravity, Claude, GPT, Gemini, etc.) working on this repository **MUST** strictly follow the workflow and rules outlined below for **EVERY** code modification.

---

## 1. Version Bump & Navigation Menu Rule
Whenever any feature, bugfix, or code change is made:
1. **Increment `APP_VERSION`** in `src/App.jsx` (e.g. from `v0.1.8` to `v0.1.9`).
2. Verify that the version number renders at the top of the main sidebar menu.

---

## 2. Mandatory Change Log Updates
Every code modification must be logged in `CHANGELOG.md`:
1. Add a new header for the bumped version: `## [vX.Y.Z] - YYYY-MM-DD`.
2. Document all changes under appropriate headers (`### Added`, `### Fixed`, `### Changed`, `### Removed`).
3. Keep descriptions clear and concise.

---

## 3. Data Synchronization Rule
1. Ensure all data storage operations respect state synchronization.
2. If new persistent keys are added to `localStorage`, ensure they trigger or listen to `dataSyncService.js` so data stays consistent across multiple ports (`:5173`, `:5174`, etc.) and browser tabs.

---

## 4. Mandatory Git Version Control Workflow
Before finishing any user request, you **MUST** run the following git workflow from the project root:
```bash
git add -A
git commit -m "vX.Y.Z - Brief description of changes made"
git push origin main
```
Never leave pending modifications uncommitted or unpushed when concluding a turn.

---

## 5. UI & Component Rules
1. **Dropdowns & Popups**: Every dropdown menu or popover filter must support click-outside dismissal (`mousedown` + `touchstart` listeners with React `useRef`).
2. **Code Safety**: Always run `npx oxlint` on modified files to catch unused variables or broken syntax before committing.
