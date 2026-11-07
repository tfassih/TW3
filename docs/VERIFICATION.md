# Verification record

Build: TW3 1.0.0 · 7 November 2026

## Automated checks

`npm run check` passes JavaScript syntax checks and all **26 domain regression tests**. Coverage includes:

- Valid default projects in all four supported media.
- Required character fields, proper names, and unnamed/minor rules.
- Mandatory entrance-event relationships.
- Static-only linear stories and alternative-ending rules.
- Selected and undecided routes; static event invariants; inherited reachability.
- Traits taking effect at the correct time and inactive remembered choices staying inactive.
- Conditional exits and the exact exit timestamp.
- Automatic entrance timing from its event.
- Invalid chronology, disconnected events, backward links, dead ends, and loops.
- Non-red dynamic colors and red static connections.
- Complete-project serialization/import; duplicate IDs, unsupported formats, external portrait URLs, and unknown properties.

The standalone build has been generated successfully. It includes its CSS, scripts, sample project, and placeholder portrait generator without external dependencies.

## Browser interaction checks

Tested in Chromium using a local HTTP preview, including the built standalone HTML:

- Example project renders with portrait cards, colored connections, timeline, library, and inspector.
- A selected branch hides its alternative ending and changes the active timeline/traits.
- At the exit event’s end time, the inspector reports the conditional character has exited.
- Changing a named major character to unnamed disables major importance and saves the character as minor.
- Undo restores the original identity and data.
- A new novel project has static events and no dynamic character controls.
- A new unnamed character with all mandatory fields saves correctly and links to the entrance event.
- A PNG portrait is accepted, resized, and embedded.
- Events can be created and connected; graph warnings disappear after appropriate connections are added.
- Portrait-card dragging changes board coordinates; undo restores the original position.
- Dragging an event bar changes its begin/end and the linked character’s entrance time.
- Whole-story PDF, selected-character PDF, combined PNG, interactive HTML, and JSON downloads complete.
- Whole-story JSON imports through the app’s Open flow and restores the original cast, events, and connections.
- The interactive HTML reader renders and opens full character records on selection.
- The final sample has zero story-check issues and no captured application console errors.

## Artifact checks

- The final sample PDF is valid PDF 1.4 and contains 10 pages. It was rendered with Poppler and visually checked for layout and clipping. Dossiers fit cleanly after spacing refinements.
- The combined PNG is valid and measured 2628 × 2513 pixels in the example export.
- The downloaded whole-story JSON passed the same importer and domain checks used by the editor.
- The ZIP was tested for integrity and contains both full source and prebuilt standalone files.

## Verification limits

- This environment’s browser policy blocks `file://` navigation. Direct double-click launch could not be exercised here. The exact standalone HTML was tested over local HTTP; its direct-open design uses classic inline scripts and embedded assets. A Python/Node local-server fallback is supplied.
- Native OS Save/Save As picker dialogs were not exercised end-to-end. The download-based JSON path and subsequent import were exercised. Direct save support uses the browser File System Access API and falls back to a download for common permission/unsupported errors.
- GitHub Actions and GitHub Pages deployment have not been run against your GitHub account. A workflow and deployment instructions are included, based on GitHub’s official documentation.
- Firefox, Safari, mobile touch interactions, and import/performance limits have not been independently tested in this environment.
- PDFs use rasterized text. They preserve Unicode appearance but are not searchable or tagged for assistive technology. The application UI and JSON/HTML records retain text.
