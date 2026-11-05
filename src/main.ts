import "./style.css";
import { Game } from "./game/game";
import { Renderer } from "./rendering/renderer";
import { commandForKey } from "./systems/input";
import { FixedClock } from "./systems/clock";
import { Sound } from "./audio/sound";
import type { Direction } from "./game/game";
const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
const status = document.querySelector<HTMLElement>("#status")!;
const readout = document.querySelector<HTMLElement>("#readout")!;
const game = new Game(),
  renderer = new Renderer(canvas),
  clock = new FixedClock(),
  sound = new Sound();
let previous = performance.now(),
  previousPhase = game.phase;
const start = () => {
  game.start();
  canvas.focus();
};
const move = (direction: Direction) => {
  const before = game.frog;
  game.move(direction);
  if (before !== game.frog) sound.play("hop");
};
document.querySelector("#start")!.addEventListener("click", start);
const soundButton = document.querySelector<HTMLButtonElement>("#sound")!;
soundButton.addEventListener("click", async () => {
  try {
    await sound.toggle();
    soundButton.textContent = sound.enabled ? "SOUND ON" : "SOUND OFF";
    soundButton.setAttribute("aria-pressed", String(sound.enabled));
  } catch {
    sound.enabled = false;
    soundButton.textContent = "SOUND UNAVAILABLE";
  }
});
window.addEventListener("keydown", (event) => {
  if (
    event.target instanceof HTMLButtonElement &&
    (event.key === "Enter" || event.key === " ")
  )
    return;
  if (event.key.startsWith("Arrow") || event.key === " ")
    event.preventDefault();
  const command = commandForKey(event.key, event.repeat);
  if (command === "start") start();
  else if (command) move(command);
});
document
  .querySelectorAll<HTMLButtonElement>("[data-direction]")
  .forEach((button) => {
    button.addEventListener("click", () =>
      move(button.dataset.direction as Direction),
    );
  });
window.addEventListener("resize", () => renderer.resize());
document.addEventListener("visibilitychange", () => {
  clock.reset();
  previous = performance.now();
});
const reasons = {
  traffic: "Hit by traffic.",
  water: "No platform beneath you.",
  edge: "Swept beyond the riverbank.",
  home: "Missed or occupied home.",
  time: "Time ran out.",
  creature: "Caught by a creature.",
};
function frame(now: number) {
  if (!document.hidden)
    clock.advance((now - previous) / 1000, (dt) => game.update(dt));
  previous = now;
  renderer.draw(game);
  const messages = {
    ready: "Ready. Press Enter or Start.",
    playing: "Five homes to fill. Ride logs and turtles.",
    dead: reasons[game.deathReason] + " One life lost.",
    home: "Safely home! +" + game.lastAward + " points.",
    level: "All five home! Next round approaches.",
    over: "Game over. Press Enter or Start to retry.",
  };
  if (status.textContent !== messages[game.phase])
    status.textContent = messages[game.phase];
  readout.textContent =
    "Score " +
    game.score +
    " · Lives " +
    game.lives +
    " · Round " +
    game.level +
    " · Homes " +
    game.homes.filter(Boolean).length +
    "/5 · Time " +
    Math.ceil(game.remaining);
  if (
    previousPhase !== game.phase &&
    (game.phase === "dead" || game.phase === "home" || game.phase === "level")
  )
    sound.play(game.phase);
  previousPhase = game.phase;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
