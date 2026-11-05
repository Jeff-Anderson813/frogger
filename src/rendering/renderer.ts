import { rules as r } from "../config/rules";
import type { Game } from "../game/game";
import type { Actor, Direction } from "../entities/types";
import { turtleState } from "../systems/collision";
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
    this.canvas.width = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
    this.canvas.height = Math.round((this.canvas.width * r.height) / r.width);
    this.ctx.setTransform(
      this.canvas.width / r.width,
      0,
      0,
      this.canvas.height / r.height,
      0,
      0,
    );
    this.ctx.imageSmoothingEnabled = false;
  }
  private rect(x: number, y: number, w: number, h: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }
  private text(
    text: string,
    x: number,
    y: number,
    color = "#dce8ba",
    size = 7,
  ) {
    this.ctx.fillStyle = color;
    this.ctx.font = size + "px monospace";
    this.ctx.fillText(text, x, y);
  }
  draw(game: Game) {
    const c = this.ctx;
    c.textBaseline = "top";
    this.rect(0, 0, r.width, r.height, "#101814");
    this.text("1UP", 8, 4, "#a4b3a2", 6);
    this.text("ROUND", 164, 4, "#a4b3a2", 6);
    this.text(String(game.score).padStart(6, "0"), 8, 14, "#e5f3bd", 9);
    this.text(String(game.level).padStart(2, "0"), 171, 14, "#e5f3bd", 9);
    this.text("LIVES", 82, 4, "#a4b3a2", 6);
    for (let i = 0; i < Math.min(5, game.lives); i++)
      this.frog(79 + i * 14, 14, "up", false, 0.65);

    this.rect(0, 32, r.width, 16, "#49683a");
    this.rect(0, 48, r.width, 80, "#142f40");
    for (let y = 51; y < 128; y += 8)
      for (let x = 0; x < r.width; x += 24)
        this.rect(
          x + Math.round(Math.sin(game.elapsed + y) * 2),
          y,
          8,
          1,
          "#20485a",
        );
    for (const row of [r.medianRow, r.startRow]) {
      this.rect(0, row * r.cell, r.width, r.cell, "#49683a");
      for (let x = 2; x < r.width; x += 8)
        this.rect(x, row * r.cell + 10, 2, 3, "#80a75c");
    }
    this.rect(0, 144, r.width, 80, "#20262b");
    for (let row = 9; row < 14; row++)
      for (let x = 2; x < r.width; x += 16)
        this.rect(x, row * r.cell + 15, 7, 1, "#62665b");
    for (let i = 0; i < r.homeColumns.length; i++) {
      const x = r.homeColumns[i] * r.cell;
      this.rect(x, 32, 16, 16, "#142f40");
      this.rect(x, 32, 16, 2, "#a2b75e");
      if (game.homes[i]) this.frog(x, 33, "up", false);
      else if (game.homeEvent?.index === i) {
        if (game.homeEvent.kind === "fly") {
          this.rect(x + 5, 36, 3, 3, "#d5e6d1");
          this.rect(x + 9, 36, 3, 3, "#d5e6d1");
          this.rect(x + 7, 38, 3, 5, "#f0bf5b");
        } else {
          this.rect(x + 2, 38, 13, 7, "#86a451");
          this.rect(x + 4, 35, 3, 3, "#eab16c");
          this.text("▲▲", x + 3, 42, "#f2e6c7", 5);
        }
      }
    }
    for (const actor of game.actors) this.actor(actor, game.elapsed);
    for (const hazard of game.hazards) {
      const y = hazard.row * r.cell;
      this.rect(
        hazard.x,
        y + 6,
        hazard.width,
        5,
        hazard.kind === "snake" ? "#c3b271" : "#b98b68",
      );
      this.rect(hazard.x + hazard.width - 5, y + 4, 5, 7, "#d6be81");
      this.rect(hazard.x + hazard.width - 2, y + 5, 1, 2, "#101814");
    }
    const lady = game.lady;
    if (lady)
      this.frog(lady.x - 8, lady.row * 16, "up", false, 0.75, "#ed94b2");
    if (game.phase !== "home" && game.phase !== "level") {
      const progress = 1 - game.hopRemaining / r.hopSeconds;
      const x =
        game.previousFrog.x + (game.frog.x - game.previousFrog.x) * progress;
      const y =
        (game.previousFrog.row +
          (game.frog.row - game.previousFrog.row) * progress) *
          r.cell -
        Math.sin(progress * Math.PI) * 2;
      this.frog(
        x,
        y,
        game.frog.direction,
        game.phase === "dead" || game.phase === "over",
      );
      if (game.carryingLady) this.rect(x + 6, y + 9, 4, 3, "#ed94b2");
    }
    this.text(
      "HOME " + game.homes.filter(Boolean).length + "/5",
      8,
      244,
      "#a4b3a2",
      6,
    );
    this.text(
      "TIME " + String(Math.ceil(game.remaining)).padStart(2, "0"),
      153,
      244,
      game.remaining < 10 ? "#ec6c5b" : "#a4b3a2",
      6,
    );
    this.rect(8, 256, 192, 5, "#2b3c2b");
    this.rect(
      8,
      256,
      (192 * game.remaining) / r.crossingSeconds,
      5,
      game.remaining < 10 ? "#ec6c5b" : "#b4d975",
    );
    const titles = {
      ready: "READY TO HOP?",
      over: "GAME OVER",
      level: "ROUND COMPLETE",
      home: "SAFELY HOME",
    };
    if (
      game.phase === "ready" ||
      game.phase === "over" ||
      game.phase === "level" ||
      game.phase === "home"
    ) {
      this.rect(14, 132, 180, 44, "#101814ed");
      c.textAlign = "center";
      this.text(titles[game.phase], 104, 140, "#e5f3bd", 10);
      this.text(
        game.phase === "level"
          ? "+1000 · NEXT ROUND"
          : game.phase === "home"
            ? "+" + game.lastAward + " POINTS"
            : "PRESS ENTER OR START",
        104,
        158,
        "#a4b3a2",
        6,
      );
      c.textAlign = "left";
    }
  }
  private actor(a: Actor, time: number) {
    const x = Math.round(a.x),
      y = a.row * r.cell;
    if (a.kind === "turtle") {
      const state = turtleState(a, time);
      for (let offset = 0; offset < a.width - 8; offset += 15) {
        if (state === "submerged") {
          this.rect(x + offset + 4, y + 6, 7, 1, "#3b6776");
          this.rect(x + offset + 3, y + 10, 9, 1, "#3b6776");
          continue;
        }
        const color = state === "warning" ? "#59a0a5" : "#81b175";
        this.rect(x + offset + 3, y + 3, 9, 10, color);
        this.rect(x + offset + 5, y + 5, 5, 6, "#426b51");
        this.rect(x + offset, y + 6, 4, 4, color);
        this.rect(x + offset + 4, y + 1, 2, 3, color);
        this.rect(x + offset + 9, y + 12, 2, 3, color);
        this.rect(x + offset + 1, y + 6, 1, 1, "#101814");
      }
    } else if (a.kind === "log" || a.kind === "crocodile") {
      if (a.kind === "log") {
        this.rect(x, y + 3, a.width, 11, "#946b47");
        this.rect(x + 2, y + 4, a.width - 4, 2, "#c09662");
        this.rect(x + 3, y + 10, a.width - 8, 1, "#5c4835");
        for (let off = 8; off < a.width; off += 20)
          this.rect(x + off, y + 7, 7, 1, "#b58657");
        this.rect(x + 1, y + 5, 2, 7, "#d0a774");
      } else {
        this.rect(x, y + 4, a.width - 2, 9, "#7d9e57");
        for (let off = 2; off < a.width - 14; off += 7)
          this.rect(x + off, y + 2, 3, 3, "#a9bb70");
        this.rect(x + a.width - 14, y + 3, 3, 3, "#edc77f");
        this.rect(
          x + a.width - 12,
          y + 7,
          12,
          time % 3 < 1.5 ? 5 : 2,
          "#1b3027",
        );
        for (let off = 2; off < 12; off += 3)
          this.rect(x + a.width - 12 + off, y + 7, 1, 2, "#e4e3bb");
      }
    } else {
      const colors: Record<string, string> = {
        car: "#f0bf5b",
        truck: "#b4b7db",
        racer: "#e78276",
      };
      this.rect(x + 2, y + 2, a.width - 4, 13, "#090f16");
      this.rect(x, y + 4, a.width, 9, colors[a.kind]);
      this.rect(
        x + 6,
        y + 3,
        a.kind === "truck" ? a.width - 14 : 10,
        11,
        colors[a.kind],
      );
      this.rect(x + 7, y + 5, 4, 7, "#8caeb5");
      this.rect(x + a.width - 8, y + 5, 3, 7, "#3d6574");
      this.rect(a.speed < 0 ? x : x + a.width - 2, y + 6, 2, 5, "#fff4c9");
      for (const off of [3, a.width - 7]) {
        this.rect(x + off, y + 2, 4, 2, "#101315");
        this.rect(x + off, y + 13, 4, 2, "#101315");
      }
    }
  }
  private frog(
    x: number,
    y: number,
    direction: Direction,
    dead: boolean,
    scale = 1,
    color = "#a9db62",
  ) {
    const c = this.ctx;
    c.save();
    c.translate(x + 8, y + 8);
    c.scale(scale, scale);
    c.rotate(
      { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[
        direction
      ],
    );
    c.fillStyle = dead ? "#ec6c5b" : color;
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
