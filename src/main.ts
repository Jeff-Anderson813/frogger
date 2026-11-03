import "./style.css";
import { Game } from "./game/game";
import { Renderer } from "./rendering/renderer";
import { commandForKey } from "./systems/input";
import { FixedClock } from "./systems/clock";
import type { Direction } from "./game/game";

const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
const status = document.querySelector<HTMLElement>("#status")!;
const game = new Game();
const renderer = new Renderer(canvas);
const clock = new FixedClock();
let previous = performance.now();
const start = () => {
  game.start();
  canvas.focus();
};
document.querySelector("#start")!.addEventListener("click", start);
window.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLButtonElement) return;
  if (event.key.startsWith("Arrow") || event.key === " ")
    event.preventDefault();
  const command = commandForKey(event.key, event.repeat);
  if (command === "start") start();
  else if (command) game.move(command);
});
document
  .querySelectorAll<HTMLButtonElement>("[data-direction]")
  .forEach((button) => {
    button.addEventListener("click", () =>
      game.move(button.dataset.direction as Direction),
    );
  });
window.addEventListener("resize", () => renderer.resize());
document.addEventListener("visibilitychange", () => {
  clock.reset();
  previous = performance.now();
});
const messages = {
  ready: "Ready. Press Enter or Start.",
  playing: "Find the gap. Reach the upper verge.",
  dead: "Traffic collision. One life lost.",
  crossed: "Safe crossing! Back to the road.",
  over: "Game over. Press Enter or Start to retry.",
};
function frame(now: number) {
  if (!document.hidden)
    clock.advance((now - previous) / 1000, (dt) => game.update(dt));
  previous = now;
  renderer.draw(game);
  if (status.textContent !== messages[game.phase])
    status.textContent = messages[game.phase];
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
