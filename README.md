# Frogger · Arcade study

An independent TypeScript / Canvas recreation in small playable increments.
**Current scope: first traffic prototype**, not the complete 1981 game.
It has one moving traffic lane, discrete hops, collisions, death/reset, three
lives, forward-progress scoring and a repeatable upper-verge target.
River platforms, five homes, timers, level progression and audio are future increments.

## Play

Press Enter, Space or Start Game. Use arrow keys to hop one cell per press.
Reach the upper verge, avoid the amber cars, and score 10 for each new forward
row per crossing. After three collisions the game ends. Enter or Start retries.
Touch buttons provide the same movement commands. Held keys do not repeat.
The simulation pauses while the tab is hidden.

## Develop and verify

Use Node 24 or newer and npm.

```sh
npm ci
npm run dev
npm run check
npm run build
npm run preview
```

`check` runs formatting, ESLint, strict TypeScript, Vitest and the production build.
Individual scripts: `format:check`, `lint`, `typecheck`, `test`.
Use `npm run format` to format. No backend, framework or runtime dependencies.

## Structure

- `src/game/game.ts`: deterministic rules, state and collision/death/reset
- `src/config/rules.ts`: coordinates, traffic, scores and timing
- `src/systems/`: pure input mapping and fixed-step clock
- `src/rendering/`: procedural Canvas art, independent of game rules
- `src/main.ts`: browser wiring and requestAnimationFrame
- Colocated `*.test.ts`: browser-independent tests

Add entity/audio modules when the next playable increment needs them.
Logical coordinates remain 208 × 224 regardless of window size or pixel density.
A 120 Hz fixed simulation prevents display refresh rate from changing traffic speed.

## GitHub Pages

Set repository Settings → Pages → Source to **GitHub Actions**.
After reviewing and merging the development branch into `main`, the Pages workflow
checks the exact source, builds and uploads `dist`, then deploys only if checks pass.
The expected address is `https://<account>.github.io/<repository>/`.
Vite emits relative asset paths (`base: './'`) for repository hosting.
PRs and development-branch pushes run CI without deploying.
Repository creation, source push and CI do not themselves activate Pages.

## References and licensing

See [behaviour notes](docs/original-game-behaviour.md) for historical targets,
uncertainties, architecture comparisons and source links.
References: Adrian Eyre's Frogger (MIT), LostInTheBugs MiniGames (MIT),
kubowania/Frogger and Den Odell's Canvas Frogger (no declared license found).
Only concepts were used; no source, graphics, music or fonts were copied.
All artwork here consists of original Canvas primitives.
This implementation is MIT licensed; Frogger is a trademark of its respective owner
and this project is unaffiliated.

The lint toolchain overrides minimatch to its patched 11.x release; the lockfile pins the verified dependency graph.
