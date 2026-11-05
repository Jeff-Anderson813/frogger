# Frogger · Arcade study

[Play the game](https://jeff-anderson813.github.io/frogger/)

A browser-only, single-player TypeScript / Canvas recreation of the classic
road-and-river game, with original procedural artwork and optional synthesized sound.

## Play

Press Enter, Space or Start Game. Arrow keys hop one cell per press; touch
buttons provide the same controls. Hops take 0.12 seconds and held keys do not repeat.

Cross five alternating traffic lanes, rest on the median, then ride logs and
turtles across five river lanes. Fill all five separate homes to advance.
Blue turtles are about to dive; ripple outlines are submerged and unsafe.
Water, open crocodile mouths, creatures, occupied homes and missed home bays
cost a life. Platforms can carry you off-screen.

Each frog starts with 60 seconds. You have three lives. Score 10 per new
hazard row, 50 for a home, 10 per whole second left and 1000 for completing
all five homes. Flies and escorted pink lady frogs award 200 each. One extra
life is awarded at 20000 points. Later rounds speed up and introduce crocodiles,
a median snake (round 3) and a river otter (round 4).

Use Sound Off / On for original oscillator effects. Audio defaults to off.
Enter or Start retries after game over. The simulation pauses while the tab is hidden.

## Develop and verify

Use Node 24 or newer and npm.

```sh
npm ci
npm run dev
npm run check
npm run preview
```

`check` runs Prettier, ESLint, strict TypeScript, Vitest and a production build.
Individual scripts: `format:check`, `lint`, `typecheck`, `test`, `build`.
Use `npm run format` to format. No backend, framework or runtime dependencies.

## Structure

- `src/game/game.ts`: deterministic state, scoring, homes, timer and progression
- `src/config/rules.ts`: grid, lane definitions and configurable tuning
- `src/entities/types.ts`: typed frog and moving actors
- `src/systems/`: collisions, platform support, spawning, input and fixed-step clock
- `src/rendering/`: original Canvas artwork, independent of game rules
- `src/audio/`: optional original oscillator effects
- `src/main.ts`: browser wiring and requestAnimationFrame
- Colocated `*.test.ts`: browser-independent rules tests

Logical coordinates remain 208 × 272 regardless of window size or pixel density.
A 120 Hz fixed simulation prevents display refresh rate from changing game speed.
Tests cover 30, 60, 120 and 144 Hz, both river edges, diving, all homes and final-life transitions.

## GitHub Pages

The site is served at https://jeff-anderson813.github.io/frogger/.
Repository Settings → Pages → Source is **GitHub Actions**.
The Pages workflow checks the exact source, builds and uploads `dist`, then deploys
only if checks pass. An explicitly authorized release can be published with
Run workflow, selecting a branch permitted by the existing `github-pages`
environment policy. Currently that is `codex/initial-playable-slice`.
Advance that branch only by a reviewed fast-forward; do not weaken its environment rules.
Automatic releases from `main` are also configured but require deliberate review
and the repository's approval boundaries.
Vite uses relative asset paths (`base: './'`) for repository hosting.
Development pushes and PRs run CI without deploying.

## References and licensing

See [behaviour notes](docs/original-game-behaviour.md) for sources, exact tuning,
historical uncertainties and the reference implementation review.
This recreates the classic structure and mechanics; it is not a ROM emulator
or a claim of frame-perfect arcade timing.
No reference source, graphics, music or fonts were copied.
All artwork consists of original Canvas primitives.
This implementation is MIT licensed; Frogger belongs to its respective trademark
owner and this project is unaffiliated.

The lint toolchain overrides minimatch to its patched 11.x release; the lockfile
pins the verified dependency graph.
