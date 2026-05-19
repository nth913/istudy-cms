# istudy-cms — Backend Instructions

Payload CMS 3 backend cho iStudy931. Repo `istudy-cms/` thuộc monorepo `/Users/Apple/pj/istudy931/`.

## Stack

- Payload 3.84+ trên Next 15 + React 19 (admin built-in)
- MongoDB Atlas M0 free tier (cluster Singapore)
- Cloudflare R2 storage qua `@payloadcms/storage-s3` adapter (3 bucket: `istudy-media-public`, `istudy-media-private`, `istudy-backups`)
- Deploy: VPS DigitalOcean Singapore (Docker + Nginx + Let's Encrypt)
- Types share qua npm package `@istudy/types` → istudy-web

## Status

Scaffold Payload 3.84 + Next 15 + React 19 initial baseline committed trên branch `feat/p0-t1-scaffold-next15` (T1 P0 partial done: deps + scaffold + git baseline). T2+ defer session execute tiếp theo. Stack update rationale: `docs/superpowers/specs/2026-05-13-next15-react19-upgrade-design.md`.

## Commands (sau P0 Task 1)

```bash
pnpm dev                          # Payload admin + API @ localhost:3131
pnpm build                        # production build
pnpm payload generate:types       # regen src/payload-types.ts
pnpm tsx scripts/seed/index.ts    # seed dev data
pnpm lint && pnpm typecheck       # CI gates
./scripts/check-deferred-agents.sh  # audit deferred subagent work
```

## Folder Layout

```
src/
  collections/        # Payload collections (one file per collection)
  blocks/             # Block schemas (typed polymorphic content, 9 type P1 + 5 P2)
  globals/            # header_config, footer_config
  hooks/              # shared hooks (beforeChange, afterChange)
  access/             # ACL functions
  lib/                # utilities (vietnamese-slugify, checksum, etc.)
  payload.config.ts   # entry, register collections + plugins
scripts/
  import-exams/       # exam-importer + endpoints (MB4 shipped)
  media-process/      # r2-media-handler (sharp watermark, pdftoppm)
  seed/               # payload-builder generated
  generate-types.ts   # type-sdk-syncer wrapper
  check-deferred-agents.sh
deploy/               # Dockerfile, docker-compose, nginx.conf, certbot.sh
.github/workflows/    # ci.yml, deploy.yml
.claude/agents/       # 5 subagent definitions + README
```

## Subagent Dispatch

Decision tree (dispatch via `Agent` tool, `subagent_type=<name>`):

| Request pattern | Agent |
|---|---|
| "thêm collection", "wire hook", "ACL", "schema" | `payload-builder` |
| "deploy", "Docker", "Nginx", "CI", "VPS", "DNS" | `devops` |
| "upload R2", "watermark", "PDF thumb", "image dedupe" | `r2-media-handler` |
| "generate types", "sync @istudy/types", "bump types version" | `type-sdk-syncer` |
| "import đề", "nhập kho đề", paste folder path đề | `exam-importer` (ready, MB4 shipped) |

Definitions: `.claude/agents/<name>.md`. Catalog: `.claude/agents/README.md`.

## Critical Rules

- **Draft mode default:** mọi collection content (`exams`, `posts`, `questions`, `mega_menus` khi áp dụng) phải có `versions: { drafts: true, maxPerDoc: 20 }`. Record mới luôn `_status='draft'`, reviewer publish thủ công qua admin. KHÔNG bao giờ set `_status='published'` programmatically.
- **Vietnamese error messages:** field validation phải có message tiếng Việt (vd: `'Tên slug không hợp lệ'`)
- **Slug normalize:** collection có field `slug` phải có `beforeValidate` hook chạy `vietnamese-slugify` (loại dấu, lowercase, hyphen-delimited)
- **Access pattern:** dùng `req.user.roles.includes('admin')`, KHÔNG hardcode user ID hay email
- **Media checksum:** mọi file upload phải compute SHA256 + check `media.checksum` index trước khi upload R2 (dedup)
- **R2 bucket routing:** original (chưa burn watermark) luôn `istudy-media-private`. Watermarked output → `istudy-media-public`. Backups → `istudy-backups`
- **PDF watermark:** KHÔNG burn server-side. FE overlay (PDF.js + canvas) only
- **Memory refs:** KHÔNG dùng anchor `#update-N` cho memory file (Vietnamese heading không slugify được). Dùng text form: `Memory project_X.md — Update lần N (...)`

## Docs References

- `docs/architecture/01-stack-decisions.md` — stack + deploy target
- `docs/architecture/02-collections-schema.md` — field schema reference
- `docs/architecture/03-system-overview.md` — high-level architecture
- `docs/architecture/04-api-contract.md` — REST/GraphQL contract
- `docs/architecture/05-hooks-access-control.md` — hooks + ACL patterns
- `docs/architecture/06-deploy-ops.md` — full deployment spec
- `docs/architecture/07-milestones-p0-p1.md` — milestone breakdown
- `docs/architecture/08-menu-and-content-collections.md` — mega menu + extended content
- `docs/architecture/09-pdf-image-storage-display.md` — R2/sharp/PDF pipeline
- Plans: `../docs/superpowers/plans/`
- Specs: `../docs/superpowers/specs/`

## Don't

- KHÔNG enable Cloudflare proxy (orange cloud) cho `cms.istudy.vn` — WebSocket admin UI sẽ vỡ
- KHÔNG commit `src/payload-types.ts` raw vào `@istudy/types` — phải transform qua `type-sdk-syncer`
- KHÔNG xoá/archive record cũ khi re-import — chỉ upsert (Payload versioning handles history)
- KHÔNG parse từng câu hỏi (deep parse PDF) — defer M-C `question-extractor` agent
- KHÔNG upload tới `istudy-media-public` cho premium content (P4 defer)
- KHÔNG hardcode metadata import-exams trong code — luôn từ folder path + meta.yml
