# ADR-0001 — Astro 7, Sätteri, and Windows-safe static build

- Status: Accepted
- Date: 2026-09-19
- Phase: 1
- Maps: T-001, AC-004, AC-050, AC-052

## Context

Phase 1 requires Astro static output, TypeScript strict, a committed lockfile, and a build that does not need a Node server, database, or runtime secret. At implementation time the current Astro stable line is 7.3.x (Vite 8). On this Windows workspace the default glob-based content loader loaded `picomatch` as ESM and failed with `require is not defined`. Native `esbuild` binaries were also unreliable in the same environment.

## Decision

1. Stay on **Astro 7.3.3** (current stable, Node 24). Do not downgrade to Astro 6 solely to avoid a Windows loader bug.
2. Load Markdown with a **filesystem directory loader** (`src/lib/markdown-directory-loader.ts`) instead of the glob loader, so content sync does not go through `picomatch`.
3. Use Astro 7’s default Markdown processor **Sätteri** (`@astrojs/markdown-satteri`) and write link/HTML plugins in the Sätteri visitor API. Unified `remarkPlugins` / `rehypePlugins` are deprecated in this line and were silently ignored, which left root-relative `/assets/...` links unbroken.
4. Alias `esbuild` to `esbuild-wasm` in `package.json` so the Windows build does not depend on a native esbuild binary.
5. Keep `output: 'static'`, no SSR adapter, no database.

## Consequences

- Markdown plugins must be Sätteri mdast/hast visitors, not unified plugins.
- CI (Ubuntu) and local Windows share the same lockfile and scripts.
- Owner still has to enable GitHub Pages “Source: GitHub Actions” once; no runtime secret is required.

## Alternatives rejected

- **Astro 6 pin:** would avoid Vite 8, but the spec asks for latest stable compatible with Node LTS, with an ADR only when an older line is required.
- **Keep glob loader:** failed on this workspace and would fail any agent reproducing the same Windows toolchain.
- **SSR or a Node host:** violates AC-052 and BR-004.
