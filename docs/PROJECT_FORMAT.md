# TW3 project format, version 1

A project is UTF-8 JSON using the `.tw3` or `.json` extension. It is parsed as data; no imported code is executed. The full importer validates the schema, strips unrecognized fields, checks IDs and portrait URLs, and rejects structural errors before replacing the current project.

Top-level keys:

| Key | Type | Meaning |
| --- | --- | --- |
| format | string | Exactly `tw3` |
| version | integer | Exactly `1` |
| id | string | Unique story ID |
| title | string | Project title |
| medium | enum | `game`, `novel`, `film`, `tv` |
| unit | string | Author-defined numeric timeline unit |
| description | string | Story synopsis |
| characters | array | Character records |
| events | array | Event records |
| connections | array | Directed relationships |
| updatedAt | string | ISO date string written by the editor |

Every node has `id`, `x`, and `y`. Board coordinates are independent of chronology. IDs contain only letters, digits, underscores, or hyphens and are unique across nodes/connections.

Characters contain:

- `named` (Boolean), `name`, `archetype`, and `importance` (`major` or `minor`).
- Exactly one `justification` string and one `narrative` string.
- Optional `personality` string.
- `staticTraits`, an array of strings.
- `dynamicTraits`, an array of `{ id, key, value, eventId, choiceId, effect, importance }`. `effect` is `trait` or `exit`; trait importance is `low`, `normal`, or `high`. Empty `choiceId` means the event’s occurrence is sufficient.
- `entrance`: `{ eventId, why, how }`.
- `exit`: `null` or `{ eventId, why, how }`.
- `portrait`: an embedded base64 PNG/JPEG/WebP data URL, or an empty string requesting the default placeholder.

Events contain `title`, `description`, `role` (`beginning`, `event`, `ending`), `behavior` (`static`, `dynamic`), and numeric `begin` and `end` values. End must be at least begin and times are nonnegative. The unique beginning is always static. Alternate endings in a game must all be dynamic. Linear media permit exactly one ending and no dynamic content.

Connections contain `{ id, from, to, kind, label, choiceId }`. Kind is `static` or `dynamic`. `choiceId` is optional and is meaningful for a dynamic character relationship. Event→event dynamic links are choices themselves, grouped exclusively by source event. A dynamic connection needs a label.

Character entrance/exit times are not duplicated as independent fields: they resolve through the linked event. Editing that event therefore changes every affected character track. Old non-entrance relationships are retained when a character’s entrance changes; the author can remove or relabel them.

Read `src/core.js` for exact parsing and validation. To evolve the format, add explicit migration logic before changing the top-level version. Do not silently reinterpret existing fields. Pure domain functions use CommonJS in Node and a `TW3Core` global in browsers so the same implementation is tested and shipped.

A selected-record JSON export uses `format: "tw3-record"`. It includes a source-story title, record, connected relationships, and readable summary fields. It is a report, not a complete project import.
