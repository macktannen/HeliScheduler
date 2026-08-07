# CHANGELOG

All notable changes to the Helicopter Scheduler application will be documented in this file.

## [v0.1.65] - 2026-08-07

### Changed
- **Aircraft Status Display**: Replaced the static status dropdown on the Aircraft Fleet Management page with a dynamic, read-only display that reflects the aircraft's calendar status for the current day. This provides immediate visibility into whether an aircraft is available, scheduled for flights, or in maintenance today, similar to the pilot status page.

---

## [v0.1.64] - 2026-08-07

### Added
- **Expanded Expenses Overview Table**: Added new columns for "Aircraft", "Account", "Payment" (Payer), "Fuel Provider" (Fuel Type), and "Purchaser" to the main Expenses Overview table, matching the fields available in the flight card's expenses tab.

---

## [v0.1.63] - 2026-08-07

### Fixed
- **Row-Level Save Now Persists Across the Entire App**:
  - Root cause: clicking the line Save icon wrote to `localStorage` but CalendarView and ExpensesPage never listened for storage changes, so their in-memory `flights` state stayed stale. Closing and reopening a flight card would reload old data.
  - Added `storage` event listeners to both CalendarView and ExpensesPage so they refresh their flight/expense state whenever `localStorage` is updated.
  - Now clicking the line-level Save icon immediately persists the row's changes to `localStorage`, CalendarView picks up the update, and re-opening the flight card shows the saved data — exactly like clicking "Save Flight" but scoped to just that one expense row.

---

## [v0.1.62] - 2026-08-07

### Fixed
- **Instant Expense Line Persistence**:
  - Fixed an issue where clicking the line-level Save icon updated the checkmark state locally in component memory but didn't write to `localStorage` unless the overall flight card Save button was also pressed.
  - Now, clicking the line-level Save icon (or deleting/importing a line) immediately writes the updated expense array directly to `localStorage` and broadcasts a `storage` event, ensuring edits are fully preserved even if you close the card without pressing the main Save button.

---

## [v0.1.61] - 2026-08-07

### Improved
- **Expense Field Auto-Highlight**:
  - Clicking into any fillable text or number box on expense rows (Date, Gallons, Purchaser, Amount, Notes, and custom category text box) now automatically selects/highlights all text.
  - Excludes select dropdown menus (Vendor, Category dropdown, Payment, Location, Fuel Type) as requested.

---

## [v0.1.60] - 2026-08-07

### Improved
- **Flight Card Save Sync for Expenses**:
  - Clicking the overall **Save Flight** button in the flight card now automatically marks all expense rows as clean and saved.
  - Switches any pending blue line-level Save icons to green check marks (**✓**) across the entire expense tab upon flight save.

---

## [v0.1.59] - 2026-08-07

### Improved
- **Expense Line Save Icon & Auto-Save Overhaul**:
  - Auto-fills from PDF / Receipt or AI uploader now automatically save expenses upon import/upload.
  - Added line-level **Save** button (blue disk icon) that appears in the first column whenever an expense line is newly added or edited.
  - Clicking the Save icon saves changes for that line specifically and updates the icon to a green check mark (**✓**) to confirm saved state.

---

## [v0.1.58] - 2026-08-07

### Fixed
- **Vendor Auto-Creation Fix**:
  - Fixed a bug where deleting a vendor caused the system to fall back to `mockVendors` because `localStorage.getItem('userVendors')` returned `[]` (an empty array), preventing new vendor creation.
  - Tightened vendor matching to exact vendor ID/name so deleted vendors can be re-created cleanly upon uploading a new receipt.

---

## [v0.1.57] - 2026-08-07

### Improved
- **Button Label Update**:
  - Renamed the AI invoice upload button to **"Auto-Fill Expense"** across all expense tabs and views.

---

## [v0.1.56] - 2026-08-07

### Improved
- **Maximized Vendor Information Extraction**:
  - Enhanced Gemini AI prompt rules to actively search for and extract street address, city/state/zip, phone number, email/domain, and cashier/manager/point of contact (POC) name from documents.
  - Automatically populates `address`, `phone`, `email`, and `poc` fields on new vendor entries when created in Vendor Management.

---

## [v0.1.55] - 2026-08-07

### Improved
- **Context-Aware AI Vendor Matching & Auto-Creation**:
  - The existing vendor list (including vendor names, IDs, categories, and addresses) is now fed directly into the Gemini prompt context.
  - The AI uses full document context (header titles, company names, airport/FBO facility names, address, phone number) to match against existing vendors.
  - If a match is found, it automatically links the existing vendor by Name / Vendor ID.
  - If no match is found, a new vendor entry is created in `localStorage` containing the extracted business name, category, address, and phone number, and dispatched across all views.

---

## [v0.1.54] - 2026-08-07

### Improved
- **Smart AI Invoice Parsing Overhaul**:
  - AI prompt now includes exact dropdown option lists for Category, Payment, Fuel Type, and Gallons fields — only fills values it's confident about.
  - **Category**: Uses exact category names from dropdown. Can create new custom categories if no match fits.
  - **Payment**: Only selects from existing payment methods (Avcard, Avfuel, World Fuel, etc.). Leaves blank if unknown.
  - **Fuel Type**: Only populated when category is Fuel. Defaults to "FBO" if fuel supplier isn't in the dropdown list.
  - **Gallons**: Only filled for fuel invoices with visible quantity. Left blank otherwise.
  - **Amount**: Total invoice/receipt amount. Left blank if unable to determine.
  - **Vendor**: Always extracted and auto-creates a new vendor entry in the Vendors list.
  - **Document Auto-Upload**: Parsed PDF/image is automatically attached as a receipt viewable via the document icon.

---

## [v0.1.53] - 2026-08-07

### Fixed
- **Migrated to Current Free-Tier Gemini Models**:
  - Replaced deprecated `gemini-1.5-flash` and quota-exhausted `gemini-2.0-flash` endpoints with active free-tier models: **`gemini-3.5-flash-lite`** (primary) and **`gemini-3.6-flash`** (fallback).
  - The older 1.5/2.0 models have been removed from Google's free tier as of 2026, causing all previous attempts to fail with 404 or 429 (limit: 0) errors.

---

## [v0.1.52] - 2026-08-07

### Fixed
- **API Endpoint Diagnostics & Model Ordering**:
  - Placed standard **`v1beta/models/gemini-1.5-flash`** at the top of candidate endpoints in `pdfParserService.js` and `SettingsView.jsx`.
  - Added clean error diagnostics for invalid or uninitialized API keys to guide users to `aistudio.google.com`.

---

## [v0.1.51] - 2026-08-07

### Fixed
- **Free-Tier Model Priority & Quota Routing**:
  - Re-ordered model candidate list to prioritize **`v1/models/gemini-1.5-flash`** (the 100% free model with 1,500 requests/day).
  - Enhanced candidate loop in `pdfParserService.js` and `SettingsView.jsx` to automatically bypass `429 (limit: 0)` errors from unbilled preview models (e.g. `gemini-2.0-flash`), routing directly to active free-tier endpoints.

---

## [v0.1.50] - 2026-08-07

### Fixed
- **Multi-Model Endpoint Fallback**:
  - Implemented automatic sequential fallback (`gemini-2.0-flash`, `v1/gemini-1.5-flash`, `gemini-1.5-flash-latest`, `gemini-1.5-pro`) in `pdfParserService.js` and `SettingsView.jsx`.
  - Automatically bypasses 404 model routing errors regardless of regional API key tier or endpoint permissions.

---

## [v0.1.49] - 2026-08-07

### Fixed
- **Updated AI Vision Endpoint**:
  - Replaced endpoint URL to use `gemini-1.5-flash` in `pdfParserService.js` and `SettingsView.jsx`, resolving 404 API model deprecation error.

---

## [v0.1.48] - 2026-08-07

### Added
- **AI & Integrations Settings Panel**:
  - Added a dedicated **AI & Integrations** tab in `SettingsView.jsx` for managing and testing Google Gemini API keys.
  - Included 1-click test button (`Test Connection`) to instantly verify key connectivity and status.

---

## [v0.1.47] - 2026-08-07

### Added
- **AI-Powered PDF Invoice & Receipt Reader**:
  - Integrated `pdfjs-dist` and Google Gemini Vision API (`gemini-2.5-flash`) into `src/services/pdfParserService.js` to automatically extract structured expense details (`vendor`, `amount`, `date`, `category`, `invoiceNumber`, `description`) from uploaded PDF invoices or paper receipt scans.
  - Added interactive `<AIInvoiceUploader />` dropzone buttons to both the global **Expenses Page** and the **Flight Expenses Tab** inside the Flight Modal.
  - Included a key setup modal for saving free Gemini API keys locally or configuring via `VITE_GEMINI_API_KEY`.

---

## [v0.1.46] - 2026-08-07

### Changed
- **Matched Passengers UI Format & Text Size**:
  - Aligned the dropdown size, label styling, tag font size (`0.62rem`), padding, and dedicated `X` remove button structure of the **Passengers** section to match **Pilots / Crew** in `EventModal.jsx`.
  - Maintained distinct domain logic: PIC/SIC role toggling remains strictly for Pilots, while Passengers remain a clean passenger assignment list.

---

## [v0.1.45] - 2026-08-07

### Fixed
- **Isolated Leg Card Drag-and-Drop**:
  - Updated `handleDrop` in `CalendarView.jsx` so dragging a flight card on a multi-day flight only moves the dates of the specific leg corresponding to the dragged card (`sourceDay`), keeping other legs on their scheduled dates untouched.

---

## [v0.1.44] - 2026-08-07

### Fixed
- **Synchronized Drag-and-Drop Date Shifting**:
  - Updated `handleDrop` in `CalendarView.jsx` to calculate the date offset when moving a flight card and shift both Takeoff Date (`date`) and Landing Date (`arrDate`) across all legs in sync.
  - Preserved multi-day overnight leg spans when moving flight cards to new calendar dates.

---

## [v0.1.43] - 2026-08-07

### Changed
- **Cleaned Flight Card Labels**:
  - Removed `Tail:` prefix to display the aircraft tail directly (e.g. `N123HA`).
  - Removed `Acc:` prefix to display the account name directly on flight cards in `CalendarView.jsx`.

---

## [v0.1.42] - 2026-08-07

### Fixed
- **Atomic Pilot Removal & Compact Badge Sizing**:
  - Replaced double state updates with atomic `handleAddPilotToLeg` and `handleRemovePilotFromLeg` helpers in `EventModal.jsx`, fixing the issue where clicking `X` would fail to remove a pilot from the leg.
  - Compacted pilot tag font size (`0.62rem`), padding (`2px 4px`), and `X` button icon size (`9px`) so multi-pilot badges fit cleanly without inflating leg card height.

---

## [v0.1.41] - 2026-08-07

### Fixed
- **Pilot Tag Role Transitions & Dedicated Remove Button**:
  - Automatically assign newly added pilots as `SIC` when a `PIC` already exists on the leg.
  - Clicking an existing `[PIC]` moves them to `[SIC]` and bumps the previous `[SIC]` to `Crew` (unassigned).
  - Separated the pilot tag name click target from a dedicated `X` remove button with explicit event stopping, ensuring clean pilot removal from legs.

---

## [v0.1.40] - 2026-08-07

### Added
- **Clickable PIC / SIC Pilot Role Toggling**:
  - Clicking an assigned pilot tag badge in `EventModal.jsx` cycles their role through `[PIC]` (Gold highlight) -> `[SIC]` (Blue highlight) -> `Crew` (Neutral).
  - Linked explicit `PIC` and `SIC` role designations directly into `FlightLogTab.jsx` for log summary reporting.
- **Dynamic "Pilots" Card Label**:
  - Updated `CalendarView.jsx` flight cards to display **Pilots:** when more than 1 pilot is assigned to a leg, and **Pilot:** when 1 pilot is assigned.

---

## [v0.1.39] - 2026-08-07

### Added
- **Multi-Pilot Selection per Leg**:
  - Upgraded the leg pilot selection in `EventModal.jsx` to support multi-pilot assignment (`pilots: string[]`), matching the passenger selection UI with tag badges and remove buttons.
  - Updated `FlightLogTab.jsx` to render the primary pilot as **PIC** and secondary assigned pilots as **SIC**.
  - Updated `CrewSchedule.jsx` and `CalendarView.jsx` to resolve and display all assigned pilots across schedule rows and calendar cards.

---

## [v0.1.38] - 2026-08-07

### Added
- **Multi-Day Leg 2+ Overnight Symbol Support**:
  - Expanded `isOvernight` flight card logic on `CalendarView.jsx` and `CrewSchedule.jsx` to show the top-right moon symbol badge whenever any leg (including Leg 2 or Leg 3+) takes off or lands on a different date than Leg 1.
  - Added a `Multi-day leg` purple badge on the takeoff date picker in `EventModal.jsx` when Leg 2+ is set to a different date than Leg 1.

---

## [v0.1.37] - 2026-08-07

### Fixed
- **Independent Leg Editing for Leg 2+**:
  - Replaced global loop recalculations with single-leg handlers (`calculateSingleLegArrival` and `calculateSingleLegDuration`) in `EventModal.jsx`.
  - Leg 2, Leg 3, and subsequent legs now allow editing takeoff date, takeoff time, departure location, destination location, duration, landing date, landing time, pilot, and passengers independently, matching Leg 1 behavior.

---

## [v0.1.36] - 2026-08-07

### Changed
- **Compact Top-Right Moon Icon Badge**:
  - Removed the text label from the top-right overnight badge on `CalendarView.jsx` and `CrewSchedule.jsx`, leaving solely the moon icon (`🌙`) in a clean circular badge.
  - Prevents overlap or clipping with long flight titles.

---

## [v0.1.35] - 2026-08-07

### Added
- **Top-Right Overnight Badge on Calendar & Schedule Flight Cards**:
  - Added a dedicated top-right **Overnight Symbol Badge** (`🌙 Overnight`) to flight cards on both the originating date and spanned next-day date in `CalendarView.jsx` and `CrewSchedule.jsx`.
  - Positioned in the top right corner with a dark slate background, warm yellow moon icon, and high-visibility styling.

---

## [v0.1.34] - 2026-08-07

### Added
- **Multi-Day Leg Takeoff & Landing Date Support**:
  - Added dedicated **Takeoff Date** (`date`) and **Landing Date** (`arrDate`) input fields for each flight leg in `EventModal.jsx`.
  - Automatically defaults the Landing Date to match the Takeoff Date when a leg is initialized or when the Takeoff Date changes.
  - Enforced `min={leg.date}` and date validation logic to prevent landing dates from being selected backwards in time.
  - Automatically calculates flight duration (in minutes & decimal hours) across multi-day overnight flight spans (e.g. departing 23:00 and landing 02:30 next day).
  - Added an overnight indicator badge (`+1d overnight`) on the flight plan leg card when a flight lands on a subsequent date.
  - Updated `CalendarView.jsx` and `CrewSchedule.jsx` date range queries so multi-day overnight legs render across all spanned calendar days.

---

## [v0.1.33] - 2026-08-06

### Added
- **Clickable Flight Cards on Schedule Grid**:
  - Clicking any flight card on the **Schedules Grid** (`CrewSchedule.jsx`) now opens the full interactive **Flight Modal** (`EventModal.jsx`).
  - Allows viewing and editing flight details, leg actuals, flight log signatures, and flight expenses directly from the schedule grid view.
  - Added live data sync so changes made in the flight modal immediately update the schedule grid.

---

## [v0.1.32] - 2026-08-06

### Changed
- **Unified Layout Color Palette**:
  - Removed blue text (`#2b6cb0`) and blue background shading (`#ebf8ff`, `#bee3f8`) across `AircraftList.jsx`, `FlightLogTab.jsx`, `PilotsList.jsx`, `SettingsView.jsx`, `ExpensesTab.jsx`, and `ExpensesPage.jsx`.
  - Restored standard table input backgrounds, default dark text, and theme primary / neutral background styling for full design consistency.

---

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
