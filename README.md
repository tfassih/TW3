# The Webs We Weave (TW3)

**TW3**, pronounced **“twee”**, is a private character and narrative workspace. Build a cast on an evidence board, connect characters to events, and see their chronology emerge on a linked timeline.

Version 1.0.0 · Offline browser application · MIT license · No runtime dependencies

## Start in under a minute

1. Double-click **TW3.html** in that folder. If needed, right-click it and choose **Open with → Microsoft Edge** or **Google Chrome**. `Start-Windows.bat` is an optional shortcut.
2. Explore **The Bellwether Archive**, the included branching example, or select **New**.
3. Choose **Video game**, **Novel**, **Film**, or **Television**. Name your story and choose a time unit such as `beat`, `scene`, `chapter`, or `day`.
4. Use **Save** to keep your story as a `.tw3` file. The HTML is the application; the `.tw3` file is your story.

No installation, internet connection, Node.js, Python, or account is needed for the direct-open application. Keep your own `.tw3` backups outside this application folder before replacing the app with an update.

### If your browser restricts local HTML files

Use the included local server instead. This still works offline:

- With Python installed: run `python serve.py` (Windows also supports `py serve.py`). A local browser tab opens automatically.
- With Node.js 20 or newer installed: run `npm run dev`, then open the printed `http://localhost:5173` address.

The Python server listens only on `127.0.0.1:8000`. Stop it with Ctrl+C. The Node development server listens on all interfaces for preview compatibility; use the Python launcher when you specifically want a loopback-only server.

## What is implemented

| Area | Functionality |
| --- | --- |
| Evidence board | Draggable portrait cards and post-it events; pan, zoom, fit, arrange, search, selection, keyboard access, and editable threads |
| Character records | One justification, one narrative description, entrance with why/when/how, optional exit and personality, static/dynamic traits, portrait, identity, importance, and archetype |
| Character rules | Required fields enforced; named characters need names; unnamed characters must be minor; every character links to its entrance event |
| Portraits | Default placeholder; uploaded PNG/JPEG/WebP resized to at most 600 pixels on the longest edge and embedded as JPEG |
| Events | Unique static beginning; at least one ending; numeric begin/end fields; static and conditional events; alternate endings in games |
| Relationships | Character↔character, character↔event, and directed event→event connections; red static threads; chronology-assigned non-red conditional colors |
| Timeline | Derived event/character tracks; event bars can be dragged in time; entrance/exit timing updates from event references; dynamic-trait markers; time cursor |
| Branch preview | Exclusive choices from each decision event, route visibility, character state at a selected time, conditional permanent exits, and active ending count |
| Persistence | Save, Save As, Open, embedded portraits, browser draft recovery, 50-step undo/redo, schema-checked project import |
| Exports | Whole-story or selected-record PDF/JSON, board/timeline/combined PNG, and an offline interactive HTML reader |
| Deployment | Static hosting, ready-to-upload source, prebuilt standalone files, GitHub Pages workflow, dependency-free tests/build |

## How to build a story

1. **Create the events.** The initial beginning and ending can be edited but the beginning cannot be deleted. Add intermediate events and set their numeric begin/end times. Zero-duration milestones are allowed.
2. **Create the cast.** Complete the required narrative fields and choose an entrance event. Put one static trait on each line. An entrance thread is created automatically; defining an exit also creates a thread when needed.
3. **Connect the board.** Select **Connect**, then two cards. Alternatively, select an item and use **Connect this character/event** in the inspector. A connection may have a relationship description or choice label. Click any thread or inspector relationship to edit it.
4. **Add game choices.** Create dynamic event→event connections with clear choice labels. Destinations of these links can automatically become dynamic events. For alternate endings, change the existing ending to dynamic before adding another; all alternative endings must be conditional.
5. **Add dynamic traits.** Choose the trigger event, optional required choice, importance, and effect. A permanent-exit effect ends the character’s presence at the trigger event’s end. Trait names act as state keys: later active values with the same name replace earlier ones.
6. **Preview a route.** Turn on **Branch preview** and select choices. Use the **At** input or click the timeline ruler to inspect state at a time. Unreached events and characters fade. A route with zero or multiple active endings is highlighted in the preview bar for review.
7. **Review Story checks.** Warnings identify disconnected events, dead ends, graph loops, backward connections, and references outside a character’s lifetime. Errors are blocked by the editor and importer.
8. **Save the project.** Use Save/Save As for files and Export for deliverables.

### Precise branching and chronology rules

- **Static events are global invariants:** they occur on every route, including disconnected static events. Disconnected events produce a warning. Make an event dynamic if it should only occur on a branch.
- **Event connections are directed.** A static connection continues from an active source. A dynamic connection continues only when selected at its source event. Choices sharing a source are exclusive. Static continuations from a conditional event inherit that event’s reachability.
- A branch decision must be represented by its **own event**. If two independent choices happen at the same time, represent them as separate decision events with the same timestamp.
- Characters enter at the referenced event’s **begin** time. A normal exit uses the referenced event’s **end** time if that event occurs. No exit means the track continues to the end of the displayed story range.
- A dynamic trait begins at its event’s **begin** time, provided the event occurs and its optional required choice is selected on an active route. A stale choice remembered on an inactive branch cannot trigger a trait.
- A conditional exit uses the trigger event’s **end** time. The character is considered exited at that exact timestamp. The earliest applicable permanent exit wins.
- With branch preview off, every possibility is shown. Conditional state changes are not asserted as a single canonical state.
- A conditional character relationship may require one choice; its event endpoints must also be active. Character-to-character threads express narrative relationships, rather than changing character lifetimes themselves.
- Dynamic colors follow the source event’s chronology (or a source character’s entrance chronology), with stable ID ordering for ties. The six non-red colors repeat for large graphs.
- Temporal overlaps are allowed. Event connections do not force timestamps to be consecutive. Backward links and cycles are reported for the author to review.
- This is a character/story authoring tool, not a game-engine runtime or general-purpose scripting language. Conditions are explicit event reachability plus one optional selected choice, rather than arbitrary Boolean scripts.

## Saving, recovery, and portability

`.tw3` is readable JSON with `format: "tw3"` and `version: 1`. It includes every record, relationship, card position, timestamp, and embedded portrait. The example project is in `examples/`.

Where direct filesystem access is supported, **Save** can update the selected file and **Save As** chooses another location. Elsewhere, saves download a copy; keep the newest copy and rename/move it as needed. Opening uses a portable file input, so the first Save after opening may ask for a destination again. Browser permission or policy restrictions can cause a download fallback.

Browser recovery stores the most recent project for this browser/location. It does not synchronize across devices or protect against browser-data deletion. Large portrait collections may exceed the browser storage quota; TW3 shows a warning and you should immediately save a `.tw3` file. Opening another project replaces the current recovery draft. Only saved projects should be treated as durable backups.

The editor stores up to 50 undo snapshots in memory. It deliberately prevents deletion of events or choices referenced by character entrances, exits, or dynamic traits. Update those references first. Undo history resets when another project is opened.

## Export behavior

| Export | What it contains |
| --- | --- |
| PDF, entire story | Landscape evidence-board and timeline pages, story synopsis/checks, and paginated character/event records |
| PDF, selected item | The complete text record and its relationships |
| PNG | Full board, full timeline, or both, independent of the current viewport |
| Interactive HTML | Self-contained all-routes snapshot with board pan/zoom, selection, record inspector, highlighting, timeline image, and a project-download button |
| JSON, entire story | The reopenable project, equivalent in structure to `.tw3` |
| JSON, selected item | A `tw3-record` summary with the record, connections, and readable fields; this is not a complete project and cannot be opened as one |

All visual exports contain **all routes**, even when branch preview is active. HTML exports are read-only snapshots, not copies of the editor. Exported character fields describe the conditions that control each trait. PDFs render text as high-resolution images to preserve fonts and Unicode offline; the PDF text is not selectable/searchable. Use JSON when searchable or machine-readable text is important. Large diagrams scale to fit the PDF’s landscape page; the PNG and HTML exports are better for detailed zooming.

### Easiest GitHub Pages deployment

1. Push/upload the source.
2. In the repository, open **Settings → Pages**.
3. Choose **Deploy from a branch**, branch **main**, folder **/(root)**, and save.
4. Open the site URL GitHub shows once deployment completes.

The root `index.html` works on a repository subpath because all asset paths are relative. Root `.nojekyll` disables Jekyll processing. Hosting the app does not upload users’ projects: editing and exports still happen inside each visitor’s browser.

### Included Actions deployment

The included `.github/workflows/pages.yml` builds and tests the app, then deploys `dist/`.

1. Choose **GitHub Actions** as the repository’s Pages source.
2. Open **Actions → Deploy TW3 to GitHub Pages → Run workflow**, or push to `main`/`master`.
3. Keep the normal `github-pages` environment permissions. No third-party service or personal access token is required by the workflow.

Reference: [GitHub’s custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), consulted 7 November 2026.

### Other static hosts

Upload the **contents of `dist/`**. Its `index.html` is self-contained. No server functions, database, environment variables, build service, or paid storage are needed. Download `TW3.html` if you need a portable offline copy; this version does not install a service worker or promise offline reloads of a hosted URL.

## Development

Node.js is needed only for development checks, the optional Node server, and rebuilding the single-file bundle. No `npm install` is necessary.

```bash
npm test
npm run build
npm run dev
```

Edit the source files, then rebuild. Do not edit the generated `TW3.html` or `dist/` files directly: the build regenerates them.

| Path | Purpose |
| --- | --- |
| `TW3.html` | Ready-to-open standalone application |
| `index.html` | Source page and accessible application structure |
| `styles.css` | Evidence-board design and responsive layout |
| `src/core.js` | Data model, validation, branch evaluation, sample story |
| `src/app.js` | Editing, drag interactions, file operations, recovery, history |
| `src/exports.js` | Offline canvas, PDF, PNG, and HTML snapshot exporters |
| `scripts/build.cjs` | Dependency-free single-file build |
| `scripts/serve.cjs` | Optional Node development server |
| `serve.py` | Optional loopback-only Python launcher |
| `tests/core.test.cjs` | Domain and import regression tests |
| `examples/The-Bellwether-Archive.tw3` | Complete example project |
| `docs/PROJECT_FORMAT.md` | Data format and extension notes |
| `docs/VERIFICATION.md` | What was actually tested and known limits |
| `dist/` | Prebuilt static deployment files |

## Practical limits

Desktop is the intended authoring environment. The responsive layout keeps the board and inspector available on smaller screens, but a large screen is preferable for complex stories. Import caps are 500 characters, 500 events, 3,000 connections, 100 static and 100 dynamic traits per character, and 40 MB per project. These are guardrails, not a performance guarantee. Large graphs and portrait-heavy undo histories can be memory-intensive.

No collaboration, cloud syncing, database, executable scripting, engine-specific export, automatic layout optimization, or multi-project dashboard is included in this version. The directory contains the full source so these can be added without a service dependency.
