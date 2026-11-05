import { rules } from "../config/rules";
import type { Actor, Frog } from "../entities/types";
export function overlaps(
  left: number,
  right: number,
  otherLeft: number,
  otherRight: number,
) {
  return left < otherRight && right > otherLeft;
}
export function hits(frog: Frog, actor: Actor) {
  return (
    frog.row === actor.row &&
    overlaps(
      frog.x + rules.frogInset,
      frog.x + rules.cell - rules.frogInset,
      actor.x,
      actor.x + actor.width,
    )
  );
}
export function turtleState(
  actor: Actor,
  elapsed: number,
): "surface" | "warning" | "submerged" {
  if (!actor.diving) return "surface";
  const phase =
    (((elapsed + actor.diveOffset) % rules.divePeriod) + rules.divePeriod) %
    rules.divePeriod;
  return phase >= rules.diveStart
    ? "submerged"
    : phase >= rules.diveWarning
      ? "warning"
      : "surface";
}
export function supports(frog: Frog, actor: Actor, elapsed: number) {
  return (
    frog.row === actor.row &&
    turtleState(actor, elapsed) !== "submerged" &&
    frog.x + rules.frogInset >= actor.x &&
    frog.x + rules.cell - rules.frogInset <= actor.x + actor.width
  );
}
