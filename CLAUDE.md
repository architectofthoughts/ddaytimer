# CLAUDE.md — ddaytimer

## Cloudflare Deployment

- **Platform**: Cloudflare Pages
- **Project name**: `ddaytimer`
- **Production branch**: `main`
- **Build**: `npm run build`
- **Build output**: `dist`
- **Deploy command**: `wrangler pages deploy dist --project-name=ddaytimer --branch=main`
- **Resources**: KV Namespace (SYNC_KV)

> 배포 시 반드시 `--branch=main`을 명시하세요.
