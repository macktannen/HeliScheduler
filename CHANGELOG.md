# CHANGELOG

All notable changes to the Helicopter Scheduler application will be documented in this file.

## [v0.1.13] - 2026-08-05

### Added
- **Unselectable Fuel Vendors in Dropdowns**: Options already selected in previous expense rows are now disabled with `(Selected)` text in the vendor dropdowns to prevent duplicate selection.
- **Conditional Fuel Vendor Requirement**: Entering a number in the gallons (`Gal`) field now requires selecting a fuel vendor / fuel type, highlighting missing fields in red until selected.

---

## [v0.1.12] - 2026-08-05

### Changed
- **Monday-to-Sunday Schedule Grid Week Format**: Updated `CrewSchedule.jsx` to start each weekly schedule view on Monday (`weekStartsOn: 1`) and end on Sunday instead of starting on Sunday.

---

## [v0.1.11] - 2026-08-05

### Added
- **Custom Save Button Labels & Animation**: Updated `SaveButton` to display specific action labels ("Save Pilot", "Save Crew Member", "Save Passenger") and trigger the checkmark animation upon saving.

### Fixed
- **Fit-To-Screen Layout**: Adjusted line heights, field padding, and container heights across `PilotsList`, `CrewList`, and `PassengersList` so all directory views fit cleanly onto the screen without vertical scrolling of the page layout.

---

## [v0.1.10] - 2026-08-05

### Added
- **Crew Directory Sub-Tab (`CrewList.jsx`)**: Added a dedicated **Crew Directory** tab in the Crew & Passenger Management view between *Pilots Directory* and *Passengers Directory*.

### Changed
- **Automatic Crew/Passenger Separation**: Toggling the "Crew Member" checkbox on any person now automatically routes them to the Crew Directory and removes them from the Passengers Directory.

---

## [v0.1.9] - 2026-08-05

### Added
- **AI Agent Workflow Rules (`AGENTS.md`, `GEMINI.md`, `.agents/rules/workflow.md`)**: Enforced mandatory automated workflow across all AI models (version bump in sidebar, CHANGELOG entry, data sync, and git push).

---

## [v0.1.8] - 2026-08-05

### Added
- **Cross-Port & Multi-Tab Data Sync**: Implemented `BroadcastChannel` + `SharedWorker` fallback data sync service (`dataSyncService.js`) to automatically synchronize `localStorage` state across multiple browser tabs and different ports (`:5173`, `:5174`, etc.).
- **CHANGELOG.md**: Added official change log tracking application versions and updates.

### Fixed
- **Visible Personnel Dropdown**: Added `mousedown` and `touchstart` click-outside event listeners on the Crew & Passenger Management page to close the dropdown menu when clicking anywhere outside of the field.

---

## [v0.1.7] - Initial Setup
- Initial local release with schedule grid, flight modal, fleet, airports/LZs, contacts, and settings.
