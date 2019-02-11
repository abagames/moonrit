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
}

function player(
  a: Actor & { move: Function; jump: Function; explode: Function }
) {
  a.setPriority(0.5);
  a.pos.set(7.5, 7.5);
  let vy = 0;
  let isOnWall = false;
  let isExplosionReady = false;
  a.move = mx => {
    a.pos.x = clamp(a.pos.x + mx, 0, 15);
  };
  a.jump = () => {
    if (isOnWall) {
      vy = -0.9;
      isOnWall = false;
    }
  };
  a.explode = () => {
    if (isExplosionReady) {
      spawn(explosion, a.pos);
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
    vy = clamp(vy + 0.05, -1, 1);
    if (vy > 0.25) {
      isOnWall = false;
    }
    a.pos.y += vy;
    for (let i = 0; i < 16; i++) {
      const l = matrix.getLed(a.pos.x, a.pos.y);
      if (l == null) {
        break;
      }
      if (l.brightnessIndex === 2 && l.colorChar === "c") {
        vy = 0;
        a.pos.y = Math.floor(a.pos.y - 1) + 0.5;
        isOnWall = true;
        isExplosionReady = true;
      } else {
        break;
      }
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
    const speed = (1 + difficulty) * 0.1;
    _player.move(pos.x + 0.5 > _player.pos.x ? speed : -speed);
  }
}

function ground(a: Actor, x: number, y: number) {
  a.str = "c";
  a.pos.set(x, y);
}

function explosion(a: Actor, p: Vector) {
  const strs = ["r", "rrr\nryr\nrrr", "rrrrr\nryyyr\nrypyr\nryyyr\nrrrrr"];
  a.str = "";
  a.pos.set(Math.floor(p.x), Math.floor(p.y));
  a.addUpdater(() => {
    if (a.ticks >= Math.PI / 0.07) {
      a.remove();
      return;
    }
    const pt = Math.floor(Math.sin(a.ticks * 0.07) * 3);
    matrix.print(strs[pt], 2, a.pos.x - pt, a.pos.y - pt);
    a.pool.get(ground).forEach((g: Actor) => {
      if (
        Math.abs(g.pos.x - a.pos.x) <= pt - 1 &&
        Math.abs(g.pos.y - a.pos.y) <= pt - 1
      ) {
        g.remove();
      }
    });
    a.pool.get(meteor).forEach((m: Actor) => {
      if (
        Math.abs(m.pos.x - a.pos.x) <= pt + 1 &&
        Math.abs(m.pos.y - a.pos.y) <= pt + 1
      ) {
        spawn(explosion, m.pos);
        m.remove();
      }
    });
  });
}

function meteor(a: Actor) {
  a.str = "r";
  a.pos.set(random.get(16), 0);
  const tx = random.get(16);
  const fallTicks = 500;
  const vel = new Vector((tx - a.pos.x) / fallTicks, 16 / fallTicks);
  a.addUpdater(() => {
    a.pos.add(vel);
    if (a.pos.y > 15) {
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

function initMarkSounds() {}

function onStartingGame() {
  _player = spawn(player);
  range(16).forEach(i => {
    spawn(ground, i, 10);
  });
  difficulty = 1;
  addUpdater(u => {
    difficulty += 1 / 30 / 600;
    if (u.ticks % 100 === 0) {
      pool.get(ground).forEach((g: Actor) => {
        g.pos.x--;
        if (g.pos.x < 0) {
          g.remove();
        }
      });
      spawn(ground, 15, 10);
    }
    if (random.get() < 0.02) {
      spawn(meteor);
    }
  });
}

function onStartingGameOver() {}

function onStartingTitle() {}

game.init({
  title: "JEX",
  description: "",
  onInitialize,
  onStartingGame,
  onStartingGameOver,
  onStartingTitle,
  onJustPressedCursor,
  onPressedCursor,
  matrixOptions: { isMarkerHorizontal: true },
  isDebugMode: true
});
