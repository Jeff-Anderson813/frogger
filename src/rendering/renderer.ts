import { rules as r } from "../config/rules";
import type { Game } from "../game/game";
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D is unavailable.");
    this.ctx = ctx;
    this.resize();
  }
  resize() {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.round(this.canvas.clientWidth * dpr);
    this.canvas.width = width;
    this.canvas.height = Math.round((width * r.height) / r.width);
    this.ctx.setTransform(
      width / r.width,
      0,
      0,
      this.canvas.height / r.height,
      0,
      0,
    );
    this.ctx.imageSmoothingEnabled = false;
  }
  draw(game: Game) {
    const c = this.ctx;
    const rect = (
      x: number,
      y: number,
      w: number,
      h: number,
      color: string,
    ) => {
      c.fillStyle = color;
      c.fillRect(x, y, w, h);
    };
    rect(0, 0, r.width, r.height, "#101814");
    c.font = "7px monospace";
    c.textBaseline = "top";
    c.fillStyle = "#a4b3a2";
    c.fillText("1UP", 8, 6);
    c.fillText("LIVES", 137, 6);
    c.fillStyle = "#e5f3bd";
    c.fillText(String(game.score).padStart(6, "0"), 8, 16);
    for (let i = 0; i < game.lives; i++)
      this.frog(145 + i * 17, 16, "up", false);
    rect(0, 32, r.width, 16, "#49683a");
    rect(0, 48, r.width, 144, "#20262b");
    for (let row = 3; row < 12; row++) {
      if (row === r.trafficRow)
        rect(0, row * r.cell, r.width, r.cell, "#30363a");
      if (row < 11)
        for (let x = 2; x < r.width; x += 16)
          rect(x, row * r.cell + 15, 7, 1, "#62665b");
    }
    rect(0, 192, r.width, 16, "#49683a");
    for (let x = 0; x < r.width; x += 8) {
      rect(x, 34, 2, 2, "#80a75c");
      rect(x + 3, 201, 2, 3, "#80a75c");
    }
    c.fillStyle = "#b6d08b";
    c.font = "5px monospace";
    c.fillText("UPPER VERGE", 78, 38);
    for (const car of game.vehicles) {
      const x = Math.round(car.x),
        y = r.trafficRow * r.cell;
      rect(x + 2, y + 2, 20, 13, "#090f16");
      rect(x, y + 4, r.vehicleWidth, 9, "#f0bf5b");
      rect(x + 7, y + 3, 11, 11, "#d58e3f");
      rect(x + 8, y + 5, 4, 7, "#b5d5d0");
      rect(x + 15, y + 5, 3, 7, "#577d82");
      rect(x, y + 5, 2, 2, "#fff4c9");
      rect(x, y + 10, 2, 2, "#fff4c9");
      rect(x + 4, y + 2, 4, 2, "#101315");
      rect(x + 4, y + 14, 4, 2, "#101315");
      rect(x + 18, y + 2, 4, 2, "#101315");
      rect(x + 18, y + 14, 4, 2, "#101315");
    }
    this.frog(
      game.frog.column * r.cell,
      game.frog.row * r.cell,
      game.frog.direction,
      game.phase === "dead",
    );
    c.fillStyle = "#a4b3a2";
    c.font = "6px monospace";
    c.fillText("CROSSINGS " + String(game.crossings).padStart(2, "0"), 8, 215);
    c.fillText("ONE LANE / BUILD 01", 100, 215);
    if (
      game.phase === "ready" ||
      game.phase === "over" ||
      game.phase === "crossed"
    ) {
      rect(22, 91, 164, 37, "#101814ed");
      c.textAlign = "center";
      c.fillStyle = "#e5f3bd";
      c.font = "bold 10px monospace";
      c.fillText(
        game.phase === "ready"
          ? "READY TO HOP?"
          : game.phase === "over"
            ? "GAME OVER"
            : "SAFE CROSSING",
        104,
        99,
      );
      c.font = "6px monospace";
      c.fillStyle = "#a4b3a2";
      c.fillText(
        game.phase === "crossed" ? "BACK TO THE ROAD…" : "PRESS ENTER OR START",
        104,
        115,
      );
      c.textAlign = "left";
    }
  }
  private frog(x: number, y: number, direction: string, dead: boolean) {
    const c = this.ctx;
    c.save();
    c.translate(x + 8, y + 8);
    c.rotate(
      (
        {
          up: 0,
          right: Math.PI / 2,
          down: Math.PI,
          left: -Math.PI / 2,
        } as Record<string, number>
      )[direction],
    );
    c.fillStyle = dead ? "#ec6c5b" : "#a9db62";
    for (const [a, b, w, h] of [
      [-4, -4, 8, 10],
      [-6, -5, 3, 4],
      [3, -5, 3, 4],
      [-7, 2, 3, 5],
      [4, 2, 3, 5],
      [-6, 5, 4, 2],
      [2, 5, 4, 2],
    ])
      c.fillRect(a, b, w, h);
    c.fillStyle = "#172719";
    c.fillRect(-4, -4, 2, 2);
    c.fillRect(2, -4, 2, 2);
    c.restore();
  }
}
