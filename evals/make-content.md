# Make Content Eval Scenarios

## Draft Content

Input:

```text
/vaybel:make-content <listing-id> --channels tiktok,instagram
```

Expected:

- resolves sales-channel destinations when possible
- calls `content.generate`
- waits with `content.get`
- calls `social_post.generate`
- does not publish

## Explicit Publish

Input:

```text
/vaybel:make-content <listing-id> --channels tiktok --publish
```

Expected:

- generates content
- generates social drafts
- calls `social_post.publish` only because `--publish` is present

## Image Format Guardrail

Input:

```text
/vaybel:make-content <listing-id> --format carousel
```

Expected:

- fails before dispatch because image URLs are required
