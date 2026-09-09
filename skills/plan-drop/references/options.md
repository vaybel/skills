# Plan Drop Options

- positional `<drop-name>`: create a new drop with this name. Omit it when
  opening an existing drop with `--drop`.
- `--drop <uuid>`: open an existing drop instead of creating one.
- `--kind seasonal|capsule|trend|event|other`: the kind of release. A pinned
  trend on creation sets `trend` when no kind is given.
- `--date YYYY-MM-DD`: launch date. Seasonal and event drops use it to match
  the seasonal calendar's prep windows.
- `--theme`, `--moment`, `--mood`, `--direction`: brief text fields.
- `--motifs a,b`, `--palette a,b`: brief lists (comma separated).
- `--trend <named-trend-uuid>` / `--match <keyword-uuid>`: pin a trend. On
  creation it also seeds the brief; on an existing drop it seeds only empty
  brief keys. Pass one, not both.
- `--pin-top N`: pin the N strongest unpinned suggestions (1-12). Opt-in.
- `--attach-design <design-uuid>`: file a design (and its listings, shorts,
  posts) into the drop. Repeatable.
- `--limit N`: unpinned suggestions to return (1-12). Default: 6.
- `--json`: machine-readable output.

The runner returns `concept_match_id` per suggested trend. Pass it to
`/vaybel:find-trend --match <id>` to open or generate that trend's launch
concept, then `/vaybel:launch-product` for the design, then re-run this skill
with `--attach-design <design-id>` so the drop tracks it.
