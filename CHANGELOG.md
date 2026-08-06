# CHANGELOG

All notable changes to the Helicopter Scheduler application will be documented in this file.

## [v0.1.31] - 2026-08-06

### Added
- **Flight Log & Fleet Aircraft Meter Synchronization**:
  - Dynamically synchronized the Flight Log card totals with the live Fleet Aircraft management page (`userAircraft`).
  - Added live meter syncing for unsigned flight logs so opening any flight card always displays the latest live `Before` meter figures from the aircraft logbook.
  - Ensured signing a flight updates `totalHours`, `landings`, `engine1Hours`, `engine1Cycles`, `engine2Hours`, `engine2Cycles`, and `hobbs` in real-time across both pages.
- **Twin Engine Leg Actuals Support**:
  - Updated `FlightLogTab.jsx` to render separate **Engine 1 (Hrs)**, **Engine 2 (Hrs)**, **Eng 1 Cyc**, and **Eng 2 Cyc** input fields when a twin-engine aircraft (`dualEngine`) is selected.
  - Mirrored the exact 7 boxes of logbook meters (Aircraft Hours, Aircraft Landings, Engine 1 Hours, Engine 1 Cycles, Engine 2 Hours, Engine 2 Cycles, Hobbs) between `FlightLogTab` and `AircraftList`.

---

## [v0.1.30] - 2026-08-06

### Added
- **Expanded Expenses & Vendor Permissions for Coordinator & Pilot Roles**:
  - Granted full access to **Coordinator** and **Pilot** roles to manage flight expenses (add, edit, delete, mark paid/unpaid).
  - Granted full access to **Coordinator** and **Pilot** roles for **Vendor Management** (add, edit, and delete vendor records in the vendor database).
  - Enabled access to the **Expenses Page** and **Expenses Tab** for both roles.

---

## [v0.1.29] - 2026-08-06

### Added
- **Full Role-Based Access Control (RBAC) System**: Complete multi-role permission engine across the entire app.
  - **New** `src/services/permissionService.js`: Centralized `PERMISSIONS` map per role with a `can(user, permission)` helper. Roles: `admin`, `coordinator`, `pilot`, `maintenance`, `view_only`.
  - **Multi-Role User Support**: Users can now hold multiple roles simultaneously. Permissions are additive — the union of all assigned roles.
  - **authService.js** overhauled: User schema upgraded from `role: string` to `roles: string[]`. Auto-migrates all existing users on startup. Chad McKie → `admin`, Test User → `pilot`.
  - **AuthContext.jsx** updated: Exposes `can(permission)`, `hasRole(role)`, and `getUserRoles()` helpers bound to the current session user.
  - **SettingsView.jsx** redesigned: Multi-role checkbox selectors with colored role badges for user management. View Only users get a "Show My Flights Only" toggle in their profile.
  - **AircraftList.jsx**: Granular permission guards — `canEditMeters` (admin/maintenance), `canEditMaintenance` (admin/maintenance), `canEditProfile` (admin only), `canEditStatus` (admin/coordinator/maintenance), `canEditOps` (admin/coordinator/maintenance).
  - **App.jsx**: Accounts & Expenses nav items hidden for roles without `manageAccounts` or `viewExpensesOverview` permissions.

---

## [v0.1.28] - 2026-08-06

## [v0.1.28] - 2026-08-06

### Added
- **Twin Engine Toggle & Engine 1/2 Logbook Tracking**: Updated `AircraftList.jsx` and `FlightLogTab.jsx` to support multi-engine aircraft management:
  - Added a **Twin Engine** checkbox toggle on the Fleet Aircraft management card.
  - Enabled separate **Engine 1 Hours**, **Engine 1 Cycles**, **Engine 2 Hours**, and **Engine 2 Cycles** input fields.
  - Dynamically updated flight log signature handling to record before/after meter changes for both engines on twin-engine helicopters.

---

## [v0.1.27] - 2026-08-06

### Added
- **Dynamic Pilot Medical Status Indicators**: Added real-time medical status indicators tied to each pilot's entered medical expiration date in `PilotsList.jsx`:
  - **Current** (Green): Expiration date is more than 30 days in the future.
  - **Caution** (Yellow/Orange): Expiration date is within 30 days.
  - **Expired** (Red): Expiration date has passed.
  - Rendered next to the expiration date input on the pilot card and under the duty/flight status indicator in the pilot list.

---

## [v0.1.26] - 2026-08-06

### Changed
- **Fillable Logged Flight Hours Display & Any Signature Trigger**: Updated `PilotsList.jsx` so that any valid signature (pilot or admin) on a flight log triggers logged hours calculation. The fillable input box now dynamically displays the total running flight hours (`signed hours + baseline hours`), allowing direct adjustment while preserving automated flight time addition.

---

## [v0.1.25] - 2026-08-06

### Added
- **Automatic Pilot Flight Hours Accumulation**: Updated `PilotsList.jsx` to dynamically sum all completed flight hours from signed flight logs (`flightLog.signature`) for each assigned pilot. The total running flight time (baseline set in profile + accumulated signed flight hours) displays across the pilot directory and profile card.

---

## [v0.1.24] - 2026-08-06

### Changed
- **Crew & Passengers Navigation Labels**: Simplified subtab button titles in `CrewView.jsx` from "Pilots Directory", "Crew Directory", and "Passengers Directory" to **Pilots**, **Crew**, and **Passengers**.

---

## [v0.1.23] - 2026-08-06

### Changed
- **Dynamic Pilot Card Status & Flight Info**: Replaced the static status dropdown in `PilotsList.jsx` with live status pulling directly from the schedule grid for the current day. If a pilot is on duty and assigned to a flight today, the card displays their duty status along with the Flight Trip number and Flight Title (`#FLT-1: Flight Title`).

---

## [v0.1.22] - 2026-08-06

### Changed
- **Expenses Dropdowns Usage & Alphabetical Sorting**: Updated the **Vendor**, **Category**, **Payment**, and **Fuel** dropdown menus on the Flight Card Expenses tab to calculate historical usage frequency across saved flights. Dropdown options now order by frequency (most used first) and then alphabetically.

---

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
