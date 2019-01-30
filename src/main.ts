import * as view from "./view";
import * as matrix from "./matrix";
import * as sga from "./simpleGameActor";
import { Actor } from "./actor";
import * as keyboard from "./keyboard";
import { Random } from "./random";
import * as sound from "./sound";

let random = new Random();
let logSpawinings = [0, 0, 0, 0, 0];
let carSpawinings = [0, 0, 0, 0, 0];
let _player;

function init() {
  matrix.init({ tempo: 300, isMarkerHorizontal: false });
  matrix.addMarkerSounds(0, "synth_drum", "major pentatonic", "A", 2, 5, 4);
  matrix.addMarkerSounds(4, "synth_bass_2", "major pentatonic", "A", 2, 1, 8);
  matrix.addMarkerSounds(12, "melodic_tom", "major pentatonic", "A", 3, 5, 2);
  matrix.addMarkerSounds(14, "kalimba", "major pentatonic", "A", 3, 5, 2);
  keyboard.init({ isFourWaysStick: true, isUsingStickKeysAsButton: true });
  sga.setActorClass(Actor);
  initGame();
}

function initGame() {
  sga.reset();
  _player = sga.spawn(player);
  sga.addUpdater(u => {
    for (let i = 0; i < 5; i++) {
      logSpawinings[i]--;
      if (logSpawinings[i] < 0) {
        sga.spawn(log, i);
        logSpawinings[i] = random.getInt(100, 150) * [1.5, 1.2, 1.8, 1, 1][i];
      }
      carSpawinings[i]--;
      if (carSpawinings[i] < 0) {
        sga.spawn(car, i);
        carSpawinings[i] = random.getInt(100, 150) * (i == 0 ? 1.5 : 1);
      }
    }
  });
  for (let i = 0; i < 200; i++) {
    sga.update();
  }
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

function log(a: Actor & { speed: number; way: number }, y: number) {
  a.str = ["yyy", "yy", "yyyy", "yyy", "yyy"][y];
  a.way = [1, -1, 1, 1, -1][y];
  a.pos.x = a.way > 0 ? -a.str.length : 16;
  a.pos.y = y + 2;
  a.speed = [35, 25, 12, 25, 20][y];
  a.addUpdater(() => {
    if (a.ticks % a.speed === 0) {
      if (
        _player.pos.y === a.pos.y &&
        a.pos.x <= _player.pos.x &&
        _player.pos.x < a.pos.x + a.str.length
      ) {
        _player.pos.x += a.way;
      }
      a.pos.x += a.way;
      if (a.pos.x <= -a.str.length || a.pos.x >= 16) {
        a.remove();
      }
    }
  });
}

function car(a: Actor & { speed: number }, y: number) {
  a.str = y == 0 ? "rr" : "r";
  a.pos.x = y % 2 == 1 ? -a.str.length : 16;
  a.pos.y = y + 8;
  a.speed = [40, 8, 25, 20, 30][y];
  a.addUpdater(() => {
    if (a.ticks % a.speed === 0) {
      a.pos.x += y % 2 == 1 ? 1 : -1;
      if (a.pos.x <= -a.str.length || a.pos.x >= 16) {
        a.remove();
      }
    }
  });
}

function update() {
  matrix.print(bgStr, 1, 0, -1);
  keyboard.update();
  sga.update();
  matrix.update();
}

const bgStr = `
gggggggggggggggg
g--g--g--g--g--g
bbbbbbbbbbbbbbbb
bbbbbbbbbbbbbbbb
bbbbbbbbbbbbbbbb
bbbbbbbbbbbbbbbb
bbbbbbbbbbbbbbbb
pppppppppppppppp
----------------
----------------
----------------
----------------
----------------
pppppppppppppppp
pppppppppppppppp
pppppppppppppppp
`;

view.init(init, update);
