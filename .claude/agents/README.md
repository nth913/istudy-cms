# istudy-cms Claude Code Subagents

5 specialist subagents for istudy-cms project. Dispatch via `Agent` tool with `subagent_type=<name>`.

## Catalog

| Agent | Status | When to use |
|---|---|---|
| [`payload-builder`](payload-builder.md) | ready | Payload collection files, hooks, ACL, Block schemas |
| [`devops`](devops.md) | ready | Docker, Nginx, certbot, GitHub Actions, VPS provision |
| [`r2-media-handler`](r2-media-handler.md) | partial | R2 storage, sharp watermark, PDF thumbnail (test cần T6+T16) |
| [`type-sdk-syncer`](type-sdk-syncer.md) | partial | Sync Payload types → `@istudy/types` (test cần T18) |
| [`exam-importer`](exam-importer.md) | script_deferred | Import folder đề PDF/image/DOCX → exams (defer sau T16+M-A) |

## Audit deferred work

```bash
./scripts/check-deferred-agents.sh
```

## Spec + Plan

- Design spec: `../../../docs/superpowers/specs/2026-05-13-istudy931-subagents-design.md`
- Implementation plan: `../../../docs/superpowers/plans/2026-05-13-istudy931-subagents.md`
