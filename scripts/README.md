# istudy-cms — Scripts Index

Quick map of every runnable script under `scripts/`. Group by purpose. All `.ts`
entries run via `pnpm tsx scripts/<path>.ts` unless noted.

## Seed & Content

| Script | Purpose | Usage |
|---|---|---|
| `seed/index.ts` | Full seed pipeline (provinces, subjects, exams stub, posts, events) | `pnpm seed` |
| `seed/import-post-future-continuous.ts` | One-shot import bài viết "Thì tương lai tiếp diễn" (Lexical richText) — pattern tham khảo cho import bài docx khác | `pnpm tsx scripts/seed/import-post-future-continuous.ts` |
| `seed/check-users.ts` | List users + role (debug auth) | `pnpm tsx scripts/seed/check-users.ts` |
| `seed/promote-admin.ts` | Đổi role user (admin/editor/reviewer/student) — fix nút Edit disabled trong admin UI | `pnpm tsx scripts/seed/promote-admin.ts <email> [role]` |

## Import / Bulk Operations

| Script | Purpose | Usage |
|---|---|---|
| `folder-watch/index.ts` | chokidar watcher cho `import-inbox/` — auto trigger bulk PDF import | `pnpm watch:imports` |
| `import-exams/parse-csv.ts` | Pure parser: CSV row → exam shape (+ test) | unit module, gọi từ endpoint `import-exams-csv` |
| `import-exams/parse-filename.ts` | Pure parser: filename → metadata (category/year/subject) (+ test) | unit module |
| `import-exams/resolve-refs.ts` | Lookup province/subject IDs by slug (+ test) | unit module |
| `import-exams/upload-media.ts` | SHA256 dedupe + upload media to R2 (+ test) | unit module |
| `import-exams/upsert-exam.ts` | Upsert exam record by slug (+ test) | unit module |

## Smoke / Verification

| Script | Purpose | Usage |
|---|---|---|
| `r2-smoke-test.ts` | HEAD/PUT/GET/DELETE 3 R2 bucket — verify credentials + connectivity | `pnpm tsx scripts/r2-smoke-test.ts` |
| `upload-pdf-test.ts` | Test upload PDF qua Media collection | `pnpm tsx scripts/upload-pdf-test.ts` |
| `mb2-smoke.ts` | MB2 pipeline smoke (derivedMeta + watermark) | `pnpm tsx scripts/mb2-smoke.ts` |

## Cleanup / Ops

| Script | Purpose | Usage |
|---|---|---|
| `cleanup-test-media.ts` | Xoá media test orphan + R2 object trùng | `pnpm tsx scripts/cleanup-test-media.ts` |
| `check-deferred-agents.sh` | Audit deferred subagent work (test status per agent) | `./scripts/check-deferred-agents.sh` |

## Convention

- Mọi script `seed/` load `.env.local` qua dotenv trước import `payload.config`.
- Idempotent: check `existing.docs.length` trước create, dùng update path khi đã tồn tại.
- Override access: dùng `overrideAccess: true` khi script run with no user context (vd promote-admin).
- Module-pattern (`import-exams/*.ts`): pure function + `.test.ts` cùng folder, KHÔNG side-effect ở top-level.

## Quick Recipes

```bash
# Reset admin quyền cho gmail chính
pnpm tsx scripts/seed/promote-admin.ts uet.hant@gmail.com admin

# Kiểm tra ai đang là admin
pnpm tsx scripts/seed/check-users.ts

# Import bài viết mới (copy import-post-future-continuous.ts → đổi content + slug)
cp scripts/seed/import-post-future-continuous.ts scripts/seed/import-post-<slug>.ts
pnpm tsx scripts/seed/import-post-<slug>.ts

# Seed toàn bộ dev data
pnpm seed

# Verify R2 bucket
pnpm tsx scripts/r2-smoke-test.ts
```
