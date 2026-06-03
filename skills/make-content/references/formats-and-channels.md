# Content Formats and Channels

Formats:

- `video`: default AI shoppable video; no image URL required.
- `slideshow`: MP4 assembled from supplied images; requires `--image-url`.
- `carousel`: multi-image social post; requires one or more `--image-url`.
- `single`: one still image post; accepts exactly one `--image-url`.

Channels:

- `tiktok`
- `instagram`
- `youtube`
- `x`

Use `--channels` to generate social post drafts. Use `--publish` only when the
user explicitly wants the persisted drafts sent to the channels.
