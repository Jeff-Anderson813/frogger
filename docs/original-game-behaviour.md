# Behaviour target and first-slice decisions

## Reference review before implementation

- [adrianeyre/frogger](https://github.com/adrianeyre/frogger): inspected
  package.json, player.ts, game.ts and CI/release workflows on master.
  Useful concepts: typed state, tracking furthest forward row for scoring,
  independent player tests and a verification gate before Pages deployment.
  Its current implementation uses React and image sprites; neither is needed here.
  Its tick-count timer and grid sprite movement are not adopted; elapsed-time
  simulation makes browser refresh rate irrelevant. MIT declared.
- [LostInTheBugs/MiniGames](https://github.com/LostInTheBugs/MiniGames/tree/main/frogger):
  inspected frogger/index.html. Useful concepts: Canvas procedural objects,
  lane arrays, a D-pad and explicit death state. Its six homes / four-home
  target and frame-based timings are not historical evidence. Avoid the large
  single-file structure. MIT declared at repository level.
- [kubowania/Frogger](https://github.com/kubowania/Frogger): inspected app.js.
  Useful concept: bounded directional grid movement. DOM square classes and
  interval-driven obstacles are inappropriate for the Canvas target.
  No declared repository license found; do not reuse source.
- [denodell/frogger](https://github.com/denodell/frogger): inspected README and
  scripts/main.js. Useful concepts: logical rows, row collision checks,
  Canvas rendering separated from rules. Its global event bus, sprite sheets
  and fonts are not used. No declared repository license found.

No reference code or assets have been reused or adapted. MIT attribution obligations
would apply to future material code adaptation; preserve the upstream notice then.

## Historical target versus implemented slice

The original's structural target supplied in the brief is bottom safe strip,
five road lanes, median, five river lanes, five separated homes.
The completed game should preserve this ordering. This slice intentionally
uses only one traffic lane and a temporary upper-verge crossing target.
It must not be mistaken for a historically complete board.

| Parameter              | First slice                          | Rationale / remaining uncertainty                                                                     |
| ---------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Logical surface        | 208 × 224, 16-unit cells, 13 columns | Convenient portrait prototype, not a claim about arcade video resolution                              |
| Start                  | Column 6, row 12                     | Centred bottom safe strip                                                                             |
| Road                   | Rows 3–11, traffic only row 10       | Temporary space for incremental implementation                                                        |
| Direction              | Traffic travels left                 | One-lane demonstration; full lane directions must be checked against arcade footage                   |
| Traffic speed          | 36 logical units/second              | Provisional tuning only; no verified arcade pixel/frame measurement                                   |
| Traffic spacing        | 84 units, 3 cars, 25-unit width      | Deterministic prototype configuration, not historical spawn data                                      |
| Frog collision         | 3-unit inset on each horizontal edge | Provisional forgiving hitbox; exact arcade hitbox unverified                                          |
| Scoring                | 10 per new forward row per crossing  | Same useful anti-farming pattern as Eyre's player implementation; primary arcade verification pending |
| Lives                  | 3 including active frog              | Provisional cabinet-style default; original DIP switch options require verification                   |
| Death / crossing pause | 0.8 / 0.9 seconds                    | Clear prototype feedback, not measured arcade animation durations                                     |
| Time limit             | Not implemented in first slice       | Original crossing duration and level variation still need a primary source                            |
| Home scores / bonus    | Not implemented                      | Verify home, remaining-time, all-home and extra-life awards before adding                             |
| Difficulty             | Not implemented                      | Exact speed curves, turtle submersion and hazards need level-specific study                           |

## Next research gates

Before finalising full-game constants, inspect an original operator manual and
recorded original-board gameplay, identifying ROM/version and frame rate where
possible. Reference remakes are architecture examples, not proof of arcade timing.
Measure lane direction, object width, spacing and speed relative to a frog hop.
Confirm home centring tolerance, occupied-home death, off-screen carry, unsupported
water, diving turtles, timeout/reset and level transitions. Record uncertainty
instead of presenting guessed settings as exact.

The first slice uses half-open horizontal overlap: touching hitbox edges alone
does not kill. Collision is checked immediately after a hop and every fixed update.
Deaths subtract one life, block input during the pause, preserve score and
reset forward-progress tracking on respawn. Final death transitions to game over.
Traffic freezes during death/crossing feedback. The upper verge resets the frog
and counts a crossing without pretending to be a home or level.
