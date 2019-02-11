import * as game from "../util/game";
import * as matrix from "../util/matrix";
import * as text from "../util/text";
import { spawn, addUpdater, pool } from "../util/simpleGameActor";
import { Actor } from "../util/actor";
import * as keyboard from "../util/keyboard";
import * as sound from "../util/sound";
import { range, clamp, wrap } from "../util/math";
import { Random } from "../util/random";
import { Vector } from "../util/vector";

const random = new Random();
let difficulty: number;
let _player;

function onInitialize() {
  initMarkSounds();
  initBackground();
}

function player(
  a: Actor & { move: Function; jump: Function; explode: Function }
) {
  a.setPriority(0.5);
  a.pos.set(7.5, 7.5);
  a.brightness = 3;
  let vy = 0;
  let isOnWall = false;
  let isExplosionReady = false;
  a.move = mx => {
    a.pos.x = clamp(a.pos.x + mx * Math.sqrt(difficulty) * 0.2, 0, 15);
  };
  a.jump = () => {
    if (isOnWall) {
      vy = -0.9;
      isOnWall = false;
    }
  };
  a.explode = () => {
    if (isExplosionReady) {
      spawn(explosion, a.pos, 0);
      vy = -0.6;
      isExplosionReady = false;
    }
  };
  a.addUpdater(() => {
    if (keyboard.isStickPressed[0]) {
      game.cursor.onPressed(a.pos.x + 1, a.pos.y);
    }
    if (keyboard.isStickPressed[2]) {
      game.cursor.onPressed(a.pos.x - 1, a.pos.y);
    }
    if (keyboard.isStickJustPressed[3]) {
      game.cursor.onJustPressed(a.pos.x, a.pos.y - 1);
    }
    if (keyboard.isStickJustPressed[1]) {
      game.cursor.onJustPressed(a.pos.x, a.pos.y + 1);
    }
    vy += 0.05;
    if (vy > 0.25) {
      isOnWall = false;
    }
    a.pos.y += clamp(vy * Math.sqrt(difficulty), -1, 1);
    for (let i = 0; i < 16; i++) {
      const l = matrix.getLed(a.pos.x, a.pos.y);
      if (l == null) {
        break;
      }
      if (l.brightnessIndex === 2 && l.colorChar === "c") {
        vy = 0;
        a.pos.y = Math.floor(a.pos.y - 1);
        isOnWall = true;
        isExplosionReady = true;
      } else {
        break;
      }
    }
    if (a.pos.y >= 16) {
      game.startGameOver();
      a.remove();
    }
  });
}

function onJustPressedCursor(pos) {
  if (_player != null) {
    if (pos.y < _player.pos.y) {
      _player.jump();
    }
    if (pos.y > _player.pos.y) {
      _player.explode();
    }
  }
}

function onPressedCursor(pos) {
  if (_player != null && _player.pos.x != pos.x) {
    _player.move(pos.x + 0.5 > _player.pos.x ? 1 : -1);
  }
}

function ground(a: Actor, x: number, y: number) {
  a.setPriority(0.9);
  a.str = "c";
  a.pos.set(x, y);
}

let _addScoreText;

function explosion(a: Actor, p: Vector, score = -1) {
  const instName = "lead_7_fifths";
  sound.loadInstrument(instName);
  const notes = sound.getNotes("minor pentatonic", "A2", 1, 16);
  const strs = ["r", "ryr\nyry\nryr", "ryryr\nyryry\nrygyr\nyryry\nryryr"];
  a.str = "";
  a.pos.set(Math.floor(p.x), Math.floor(p.y));
  matrix.scheduleSound(instName, notes[15 - clamp(a.pos.y, 0, 15)]);
  if (score >= 1 && game.scene === "game") {
    if (_addScoreText != null) {
      _addScoreText.remove();
    }
    _addScoreText = spawn(text.text);
    _addScoreText.setPriority(1);
    _addScoreText.addUpdater(u => {
      if (u.ticks > 20) {
        _addScoreText.remove();
        _addScoreText = undefined;
        if (game.scene === "game") {
          game.hideScore();
        }
      }
    });
    _addScoreText.pos.y = 1;
    _addScoreText.setText(`+${score}`);
    game.addScore(score);
    game.showScore();
  }
  a.addUpdater(() => {
    if (a.ticks >= Math.PI / 0.07) {
      a.remove();
      return;
    }
    const pt = Math.floor(Math.sin(a.ticks * 0.07) * 3);
    matrix.print(strs[pt], 2, a.pos.x - pt, a.pos.y - pt);
    a.pool.get(ground).forEach((g: Actor) => {
      if (
        Math.abs(g.pos.x - a.pos.x) <= pt &&
        Math.abs(g.pos.y - a.pos.y) <= pt
      ) {
        g.remove();
      }
    });
    a.pool.get(meteor).forEach((m: Actor) => {
      if (
        Math.abs(m.pos.x - a.pos.x) <= pt + 1 &&
        Math.abs(m.pos.y - a.pos.y) <= pt + 1
      ) {
        spawn(explosion, m.pos, score < 0 ? -1 : score + 1);
        m.remove();
      }
    });
  });
}

function meteor(a: Actor) {
  a.setPriority(0.75);
  a.str = "r";
  a.pos.set(random.get(0, 16), 0);
  const fallTicks = (500 * random.get(0.75, 1.25)) / difficulty;
  const vel = new Vector(
    (random.get(5, 16) - a.pos.x) / fallTicks,
    16 / fallTicks
  );
  a.addUpdater(() => {
    a.pos.add(vel);
    if (a.pos.y >= 16) {
      a.remove();
      return;
    }
    const l = matrix.getLed(a.pos.x, a.pos.y);
    if (l != null && l.brightnessIndex === 2 && l.colorChar === "c") {
      spawn(explosion, a.pos);
      a.remove();
    }
  });
}

function onStartingGame() {
  _player = spawn(player);
  let gy = 12;
  let gvy = 0;
  range(16).forEach(i => {
    spawn(ground, i, gy);
  });
  difficulty = 1;
  let scrollTicks = 30;
  let scrollCount = 0;
  game.scoreText.setPriority(1);
  addUpdater(() => {
    difficulty += 1 / 45 / 60;
    scrollTicks--;
    if (scrollTicks <= 0) {
      scrollTicks = 60 / Math.sqrt(difficulty);
      gvy += random.get(-0.2, 0.2) * difficulty;
      gvy *= 0.95;
      gy += gvy;
      if ((gy <= 10.5 && gvy < 0) || (gy >= 14.5 && gvy > 0)) {
        gvy *= -0.5;
      }
      pool.get(ground).forEach((g: Actor) => {
        g.pos.x--;
        if (g.pos.x < 0) {
          g.remove();
        }
      });
      spawn(ground, 15, gy);
      spawn(ground, 15, gy + 1);
      scrollCount++;
      if (scrollCount % 4 === 0) {
        game.scrollBackground(-1, 0, true);
      }
    }
    if (random.get() < 0.02 * difficulty) {
      spawn(meteor);
    }
  });
}

function initMarkSounds() {
  const ms = matrix.addMarkerSound(
    l =>
      (l.brightnessIndex === 2 && l.colorChar !== "y") ||
      (l.brightnessIndex === 1 && l.colorChar === "p")
  );
  ms.add(7, "lead_3_calliope", "minor pentatonic", "A2", 2, 8, true);
  ms.add(8, "synth_drum", "minor pentatonic", "A2", 2, 8);
}

function initBackground() {
  const m1y = range(16).map(
    x => -Math.sin((x / 16) * Math.PI * 4) * 5 + random.get(-1, 1) + 8
  );
  const m2y = range(16).map(
    x => Math.sin((x / 16) * Math.PI * 3) * 2 + random.get(-1, 1) + 11
  );
  const str = range(16)
    .map(y =>
      range(16)
        .map(x => {
          return y < m1y[x] && y < m2y[x] ? "b" : y < m2y[x] ? "p" : "g";
        })
        .join("")
    )
    .join("\n");
  game.setBackground(str);
}

function onStartingGameOver() {
  game.scoreText.setPriority(0);
}

game.init({
  title: "JEX",
  description: `[lr][AD]: MOVE  [u][W]: JUMP  [d][S]: EXPLODE
JUMP AND EXPLODE TO DESTROY FALLING METEORS`,
  onInitialize,
  onStartingGame,
  onStartingGameOver,
  onJustPressedCursor,
  onPressedCursor,
  matrixOptions: { isMarkerHorizontal: true }
});
