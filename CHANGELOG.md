# CHANGELOG

All notable changes to the Helicopter Scheduler application will be documented in this file.

## [v0.1.21] - 2026-08-05

### Added
- **Click Expense Line to Open Flight Card**: Clicking any expense row in `ExpensesPage.jsx` now pops up its corresponding flight card, defaulting directly to the **Expenses** tab for immediate viewing and editing.

---

## [v0.1.20] - 2026-08-05

### Fixed
- **Flight Card Initialization & Date Auto-Fill**: Updated `initialDateStr` parsing in `EventModal.jsx` to prevent React render state array issues when passing Date objects or strings, ensuring leg dates, on-duty pilot, and on-duty crew passengers populate immediately upon clicking any calendar cell.

---

## [v0.1.19] - 2026-08-05

### Added
- **Auto-Fill Date, On-Duty Pilot & On-Duty Crew Passengers**: When clicking a calendar day to create a flight card:
  - Leg dates automatically match the clicked calendar date.
  - The pilot defaults to the scheduled on-duty pilot for that date.
  - Passengers automatically default to any crew/passengers marked as on-duty on that date.

---

## [v0.1.18] - 2026-08-05

### Fixed
- **Hide Unknown Deleted Personnel Badges on Calendar**: Updated `CalendarView.jsx` to filter out schedule entries for personnel who no longer exist in the pilots or passenger/crew directories.
- **Schedule Storage Cleanup on Delete**: Updated `PilotsList.jsx`, `PassengersList.jsx`, and `CrewList.jsx` to automatically remove all schedule keys associated with deleted personnel from `crewSchedules` upon deletion.

---

## [v0.1.17] - 2026-08-05

### Added
- **Auto-Fill On-Duty Pilot on Calendar Flight Creation**: Updated `getDefaultPilotForDate` in `EventModal.jsx` to look up scheduled on-duty/duty-training pilots for the selected date and automatically select them for the flight and all subsequent legs.

---

## [v0.1.16] - 2026-08-05

### Fixed
- **Flight Card Save Animation & Re-Save**: Updated `handleSubmit` in `EventModal.jsx` to reset and re-trigger `isSaved` state on every save click, guaranteeing that the green checkmark animation plays correctly on every single save action.

---

## [v0.1.15] - 2026-08-05

### Changed
- **Expenses Tab Fuel Selection**: Updated the **Fuel** dropdown menu in `ExpensesTab.jsx` to allow clearing back to a blank / default state (`-- Select Fuel --`) after an option has been chosen.

---

## [v0.1.14] - 2026-08-05

### Reverted
- Reverted v0.1.13 changes to Expenses tab fuel vendor selection and gallon input requirements as requested.

---

## [v0.1.13] - 2026-08-05

### Changed
- **Monday-to-Sunday Schedule Grid Week Format**: Updated `CrewSchedule.jsx` to start each weekly schedule view on Monday (`weekStartsOn: 1`) and end on Sunday instead of starting on Sunday.

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
