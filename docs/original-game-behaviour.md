# Original-game behaviour and implementation choices

## Sources and historical target

Primary reference: the [1981 Sega/Gremlin owner's manual, game concept and scoring,
pages 4–6](https://device.report/m/f97dd1cbf416fea26336a298a8782974a05ea9a7a12ebc14718dbc87e2234086).
It describes traffic, logs, sinkable turtles, five home bases, lady-frog escorts,
insect bonuses and river creatures. It specifies sixty timer beats, 50 for
reaching home, 10 per saved beat, 200 per bonus and 1000 for filling the homes.
The cabinet has adjustable starting lives; this implementation selects three.

The five-road/five-river board and alternating road directions are also
documented in [Arcade History's original arcade description](https://www.arcade-history.com/game/879).
That source specifies forward-hop scoring and one bonus life at 20000.
The manual's “safe jump” scoring wording is ambiguous; we use new forward
hazard-row progress, capped at 100 per crossing, to prevent score farming.

## Board

A 13-column playfield with 16-unit cells. Coordinates are logical units, independent
of browser size and pixel density. The original arcade's physical raster is not
reproduced; this 208 × 272 surface includes the game's HUD and timer.

| Area        | Row, top to bottom | Rule                                 |
| ----------- | ------------------ | ------------------------------------ |
| HUD         | 0–1                | Score, lives, round                  |
| Homes       | 2                  | Five slots at columns 0, 3, 6, 9, 12 |
| River       | 3–7                | Logs, turtles and later crocodiles   |
| Median      | 8                  | Safe until round-3 snake             |
| Road        | 9–13               | Five lanes, vehicles lethal          |
| Start strip | 14                 | Start at x=96                        |
| Footer      | 15–16              | Homes occupied and time remaining    |

River order from bottom: turtles left, short logs right, long logs right,
turtles left, short logs right. The bottom road lane travels left; lanes alternate.

## Configurable tuning

All lane values are centralized in `src/config/rules.ts`.
Speeds below are logical units per second at round 1. They are intentionally
play-tested approximations, not measured ROM constants.

| Road row, bottom first | Speed | Width | Spacing |
| ---------------------- | ----- | ----- | ------- |
| 13, car                | -24   | 22    | 80      |
| 12, car                | +20   | 25    | 92      |
| 11, car                | -32   | 20    | 88      |
| 10, racer              | +44   | 20    | 112     |
| 9, truck               | -22   | 40    | 112     |

| River row, bottom first | Speed | Width | Spacing |
| ----------------------- | ----- | ----- | ------- |
| 7, turtles              | -20   | 44    | 76      |
| 6, logs                 | +18   | 64    | 96      |
| 5, long logs            | +30   | 96    | 136     |
| 4, turtles              | -26   | 44    | 80      |
| 3, logs                 | +22   | 64    | 104     |

Each lane has a deterministic repeating cycle. Three vehicles/logs or four
turtle groups maintain gaps without random impossible clusters.
Speeds multiply by 1 + 0.12 × (round − 1), capped at 2.4.
The 60-beat clock is represented as 60 real seconds and resets after each frog.
Exact arcade beat duration and level-specific speed tables remain unverified.

One turtle group in each turtle lane dives on an 8-second cycle, warning
from 5.5 seconds and submerging at 6.5. The upper turtle lane is offset 3 seconds.
Warnings, dive periods and the round speed curve are explicit approximations.

## Collision and state rules

The frog hops 16 units, at most once per 0.12 seconds. Held keyboard repeat is
ignored. Rendering interpolates the hop; collision uses its destination.
A 120 Hz fixed simulation checks moving collisions and platform support.
Vehicle overlap uses a 3-unit inset on each frog edge. Touching hitbox edges
alone is clear. River support requires the whole inset hitbox to be inside
one surfaced platform. A rider moves by the platform velocity; it does not
teleport when the platform wraps. Carrying any part of the frog beyond the
screen loses a life. These tolerances approximate arcade behaviour.

At the top, x must lie within 5 units of a home centre alignment.
An occupied, missed or crocodile-occupied home kills. Homes persist through
death. Each valid home freezes briefly, preserves score/lives, and resets
the frog and timer. The fifth awards 1000 and advances to a faster round
after 1.8 seconds, clearing homes and reseeding lanes.
Death freezes the simulation for 0.8 seconds; final death leads to game over.
These presentation pauses are tuned, not measured original animation lengths.
Visibility changes pause the browser simulation rather than consuming lives.

## Bonuses and later-round hazards

Flies appear for 4 seconds per 12-second cycle in an unoccupied home.
At round 2 onward, alternating cycles show a lethal home crocodile.
A pink lady frog rides a short log during the opening 10 seconds of each
16-second window, until collected once per round. Escorting her home gives
200; death loses the carried bonus. The schedule is deterministic for testing,
rather than reproducing the original random scheduling.

From round 2, one top-river log becomes a crocodile with a dangerous open mouth
during half its 3-second cycle. From round 3 a snake crosses the median;
from round 4 an otter crosses the middle river lane. These implement the
original hazard types with simplified, documented schedules. Their exact
original spawn conditions and movement curves are not claimed.
The extra life at 20000 is awarded once per game.

## Reference implementation review

Before initial implementation, reviewed:

- [adrianeyre/frogger](https://github.com/adrianeyre/frogger): package.json,
  player.ts, game.ts, tests layout and CI/release workflows. MIT.
  Adopted concepts: typed state, furthest-row scoring and verification before
  publishing. No React, copied sprites or tick-count timers.
- [LostInTheBugs/MiniGames](https://github.com/LostInTheBugs/MiniGames/tree/main/frogger):
  inspected index.html. MIT. Useful concepts: Canvas, lane arrays, explicit
  death state, procedural art and D-pad. Its six-home layout and frame timing
  were not used as historical evidence.
- [kubowania/Frogger](https://github.com/kubowania/Frogger): inspected app.js.
  Useful concept: bounded grid movement. No declared license found; no reuse.
- [denodell/frogger](https://github.com/denodell/frogger): README and main.js.
  Useful concepts: logical rows and separate collision/rendering concerns.
  No declared license found; no reuse of code, sprite sheets or fonts.

All implementation and artwork are original. If material MIT reference code is
adapted in future, preserve its required copyright/license notice.
