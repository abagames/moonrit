import * as view from "./view";
import * as matrix from "./matrix";
import * as sga from "./simpleGameActor";
import { Actor } from "./actor";
import * as keyboard from "./keyboard";
import { Random } from "./random";
import * as sound from "./sound";
import { range } from "./math";

function init() {
  matrix.init({ tempo: 300, isMarkerHorizontal: false });
  const ms = matrix.addMarkerSound(
    (l, x, y) => l.brightnessIndex >= 2 && (_fire == null || y < _fire.pos.y)
  );
  ms.add(0, "synth_drum", "major pentatonic", "A", 2, 5, 4);
  ms.add(4, "synth_bass_2", "major pentatonic", "A", 2, 1, 8);
  ms.add(12, "melodic_tom", "major pentatonic", "A", 4, 5, 2);
  ms.add(14, "kalimba", "major pentatonic", "A", 3, 5, 2);
  const fms = matrix.addMarkerSound(
    (l, x, y) => _fire != null && y >= _fire.pos.y && l.colorIndex === 3
  );
  fms.add(0, "timpani", "minor pentatonic", "A", 3, 5, 2);
  fms.add(2, "synth_choir", "minor pentatonic", "A", 3, 1, 12);
  fms.add(14, "taiko_drum", "minor pentatonic", "A", 3, 5, 2);
  keyboard.init({ isFourWaysStick: true, isUsingStickKeysAsButton: true });
  sga.setActorClass(Actor);
  initGame();
}

type StageType = "log" | "car" | "bank";
const stage: [number, number, number, StageType, number][] = [
  [3, 1, 27, "log", 1.5],
  [2, -1, 22, "log", 1.1],
  [4, 1, 12, "log", 1],
  [3, 1, 30, "log", 1.4],
  [3, -1, 20, "log", 1.1],
  [0, 0, 0, "bank", 0],
  [2, -1, 40, "car", 1.5],
  [1, 1, 8, "car", 1],
  [1, -1, 25, "car", 1],
  [1, 1, 20, "car", 1],
  [1, -1, 30, "car", 1]
];
let spawnings = range(11).map(() => 0);
let _player;
let _fire;
let random = new Random();
let bgStr: string;

function initGame() {
  sga.reset();
  bgStr = `gggggggggggggggg
g--g--g--g--g--g
${stage
  .map(s => {
    switch (s[3]) {
      case "log":
        return "bbbbbbbbbbbbbbbb";
      case "car":
        return "----------------";
      case "bank":
        return "pppppppppppppppp";
    }
  })
  .join("\n")}
pppppppppppppppp
pppppppppppppppp
pppppppppppppppp`;
  _player = sga.spawn(player);
  sga.addUpdater(u => {
    for (let i = 0; i < 11; i++) {
      const st = stage[i];
      if (st[3] === "bank") {
        continue;
      }
      spawnings[i]--;
      if (spawnings[i] < 0) {
        sga.spawn(logOrCar, i + 2, st[0], st[1], st[2], st[3]);
        spawnings[i] = random.getInt(100, 150) * st[4];
      }
    }
  });
  for (let i = 0; i < 200; i++) {
    sga.update();
  }
  _fire = sga.spawn(fire);
}

function player(a: Actor) {
  const instName = "pad_3_polysynth";
  sound.loadInstrument(instName);
  const notes = sound.getNotes("major pentatonic", "A", 3, 1, 16);
  a.setPriority(0.5);
  a.pos.set(7, 13);
  a.addUpdater(() => {
    // TODO: move with pointer
    if (keyboard.isJustPressed && keyboard.stick.length > 0) {
      a.pos.add(keyboard.stick);
      matrix.scheduleSound(instName, notes[15 - a.pos.y]);
    }
  });
}

function logOrCar(
  a: Actor,
  y: number,
  length: number,
  way: number,
  speed: number,
  type: StageType
) {
  const c = type === "log" ? "y" : "r";
  a.str = range(length)
    .map(() => c)
    .join("");
  a.pos.set(way > 0 ? -a.str.length : 16, y);
  a.addUpdater(() => {
    if (a.ticks % speed === 0) {
      if (
        type === "log" &&
        _player.pos.y === a.pos.y &&
        a.pos.x <= _player.pos.x &&
        _player.pos.x < a.pos.x + a.str.length
      ) {
        _player.pos.x += way;
      }
      a.pos.x += way;
      if (a.pos.x <= -a.str.length || a.pos.x >= 16) {
        a.remove();
      }
    }
    if (_fire != null && a.pos.y >= _fire.pos.y) {
      a.remove();
    }
  });
}

function fire(a: Actor) {
  a.str = range(16)
    .map(() => (random.get() < 0.2 ? "y" : "r"))
    .join("");
  a.pos.y = 15;
  a.addUpdater(() => {
    if ((a.ticks + 1) % 100 === 0) {
      const l = `r${a.str.substr(a.str.length - 16)}r`;
      function getBit(n: number) {
        return l.charAt(n + 1) === "y" ? 1 : 0;
      }
      const rule = "ryyyyrrr";
      a.str +=
        "\n" +
        range(16)
          .map(i => {
            const pn = (getBit(i - 1) << 2) | (getBit(i) << 1) | getBit(i + 1);
            return rule.charAt(pn);
          })
          .join("");
      a.pos.y--;
    }
  });
}

function update() {
  matrix.print(bgStr, 1, 0, 0);
  keyboard.update();
  sga.update();
  matrix.update();
}

view.init(init, update);
