import * as view from "./view";
import * as matrix from "./matrix";
import * as led from "./led";
import * as sga from "./simpleGameActor";
import { Actor } from "./actor";
import * as keyboard from "./keyboard";
import * as pointer from "./pointer";
import * as sound from "./sound";
import { range, clamp, wrap } from "./math";
import { Random } from "./random";
import { Vector } from "./vector";
import * as text from "./text";

let _pointer: pointer.Pointer;

function init() {
  keyboard.init({ isFourWaysStick: true, isUsingStickKeysAsButton: true });
  pointer.init(sound.resumeAudioContext);
  _pointer = new pointer.Pointer(
    view.canvas,
    new Vector(view.size),
    false,
    new Vector(0.5)
  );
  text.init();
  sga.setActorClass(Actor);
  matrix.init({ tempo: 300, isMarkerHorizontal: false });
  initMarkSounds();
  initTitle();
}

function initMarkSounds() {
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
  const wms = matrix.addMarkerSound(l => l.colorIndex === 6);
  wms.add(0, "pad_1_new_age", "major pentatonic", "A", 4, 1, 16);
}

type StageType = "log" | "car" | "bank";
let stage: [number, number, number, StageType, number][];
const stage1: [number, number, number, StageType, number][] = [
  [4, 1, 27, "log", 1.5],
  [3, -1, 22, "log", 1.1],
  [5, 1, 12, "log", 1],
  [4, 1, 30, "log", 1.4],
  [4, -1, 20, "log", 1.1],
  [0, 0, 0, "bank", 0],
  [2, -1, 40, "car", 1.5],
  [1, 1, 8, "car", 1],
  [1, -1, 25, "car", 1],
  [1, 1, 20, "car", 1],
  [1, -1, 30, "car", 1]
];
let spawnings: number[];
let _player;
let _fire;
let _cursor;
let random = new Random();
let bgStr: string;
let difficulty: number;
let isReached: boolean;
let reachedCount: number;
let fireAppTicks: number;
let stageCount: number;
let score: number;
let scoreText;
let leftPlayerCount: number;
let gameOverTicks: number;

function initGame() {
  stageCount = 1;
  score = 0;
  leftPlayerCount = 2;
  gameOverTicks = -1;
  initStage();
  keyboard.clearJustPressed();
  _pointer.clearJustPressed();
}

function initStage() {
  sga.reset();
  _cursor = sga.spawn(cursor);
  scoreText = sga.spawn(text.text);
  scoreText.pos.y = 10;
  if (stageCount === 1) {
    stage = stage1;
  } else {
    randomizeStage();
  }
  if (leftPlayerCount < 2) {
    leftPlayerCount++;
  }
  isReached = false;
  reachedCount = 0;
  difficulty = 1;
  bgStr = `gggggggggggggggg
ggg--gg--gg--ggg
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
  fireAppTicks = 9999;
  sga.addUpdater(u => {
    for (let i = 0; i < 11; i++) {
      const st = stage[i];
      if (st[3] === "bank") {
        continue;
      }
      spawnings[i] -= difficulty;
      if (spawnings[i] < 0) {
        sga.spawn(logOrCar, i + 2, st[0], st[1], st[2], st[3]);
        spawnings[i] += random.getInt(100, 150) * st[4];
      }
    }
    if (_fire == null && fireAppTicks < 0) {
      _fire = sga.spawn(fire);
    }
    fireAppTicks--;
  });
  spawnings = range(11).map(() => 0);
  for (let i = 0; i < 200; i++) {
    sga.update();
  }
  if (gameOverTicks < 0) {
    resetPlayer();
  }
}

function randomizeStage() {
  stage = [];
  let type: StageType = random.get() < 0.5 ? "car" : "log";
  let way = random.getPlusOrMinus();
  let wayChangingRatio = 0.8;
  for (let i = 0; i < 11; i++) {
    let w = 1;
    let sp = 0;
    let it = 1;
    switch (type) {
      case "car":
        w = random.get() < 0.2 ? 2 : 1;
        sp = random.getInt(8, 40);
        it *= (Math.sqrt(sp / 1.5) / 4) * Math.sqrt(w);
        break;
      case "log":
        w = random.getInt(3, 5);
        sp = random.get(12, 30);
        it *= (Math.sqrt(sp / 1.5) / 7) * Math.sqrt(w);
        break;
    }
    stage.push([w, way, sp, type, it]);
    if (type === "bank") {
      type = random.get() < 0.5 ? "car" : "log";
    } else if (random.get() < 0.1) {
      type = "bank";
    } else if (random.get() < 0.15) {
      type = type === "car" ? "log" : "car";
    }
    if (random.get() < wayChangingRatio) {
      way *= -1;
      wayChangingRatio = 0.8;
    } else {
      wayChangingRatio = 1;
    }
  }
}

function onPlayerReached() {
  isReached = true;
  reachedCount++;
  sga.spawn(water);
}

function nextPlayer() {
  resetPlayer();
  if (reachedCount >= 3) {
    stageCount++;
    initStage();
  } else {
    difficulty += 0.25 * Math.sqrt(stageCount);
  }
}

function resetPlayer() {
  if (_fire != null) {
    _fire.remove();
    _fire = undefined;
  }
  fireAppTicks = 100 / difficulty;
  isReached = false;
  _player = sga.spawn(player);
  for (let i = 0; i < leftPlayerCount; i++) {
    const lp = sga.spawn(leftPlayer);
    lp.pos.set(9 + i * 2, 13);
  }
}

function player(a: Actor & { onMove: Function }) {
  const instName = "pad_3_polysynth";
  sound.loadInstrument(instName);
  const notes = sound.getNotes("major pentatonic", "A", 3, 1, 16);
  a.setPriority(0.25);
  a.pos.set(7, 13);
  const pp = new Vector();
  a.onMove = (x, y) => {
    if (isReached) {
      return;
    }
    pp.set(a.pos);
    a.pos.x += x;
    a.pos.y += y;
    a.pos.clamp(0, 15, 1, 13);
    if (matrix.leds[a.pos.x][a.pos.y].colorIndex === 2) {
      a.pos.set(pp);
    }
    if (a.pos.y === 1) {
      const nextBgStr = `${bgStr.substr(0, 17 + a.pos.x - 1)}ggg${bgStr.substr(
        17 + a.pos.x + 2
      )}`;
      bgStr = nextBgStr;
      onPlayerReached();
    }
    matrix.scheduleSound(instName, notes[15 - a.pos.y]);
  };
  a.addUpdater(() => {
    if (keyboard.isJustPressed && keyboard.stick.length > 0) {
      _cursor.onClick(a.pos.x + keyboard.stick.x, a.pos.y + keyboard.stick.y);
    }
    const l = matrix.leds[a.pos.x][a.pos.y];
    if (
      (_fire != null && a.pos.y >= _fire.pos.y) ||
      l.colorIndex === 1 ||
      l.colorIndex === 4
    ) {
      sga.spawn(playerOut);
      a.remove();
      _player = undefined;
    }
  });
}

function leftPlayer(a: Actor) {
  a.addUpdater(() => {
    if (a.ticks > 120) {
      a.remove();
    }
  });
}

function playerOut(a: Actor) {
  const instName = "lead_6_voice";
  sound.loadInstrument(instName);
  const notes = sound.getNotes("minor pentatonic", "A", 2, 1, 16);
  a.setPriority(0.25);
  a.str = "w w\n w\nw w";
  a.pos.set(_player.pos.x - 1, _player.pos.y - 1);
  a.addUpdater(() => {
    a.brightness = 3 - Math.floor(a.ticks / 8);
    if (a.ticks % 3 === 0) {
      matrix.scheduleSound(instName, notes[15 - a.ticks / 3]);
    }
    if (a.brightness < 0) {
      a.remove();
      sga.pool.get(leftPlayer).forEach(lp => {
        lp.remove();
      });
      leftPlayerCount--;
      if (leftPlayerCount < 0) {
        initGameOver();
      } else {
        resetPlayer();
      }
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
    if (a.ticks >= speed / difficulty) {
      a.ticks -= speed / difficulty;
      if (
        _player != null &&
        type === "log" &&
        _player.pos.y === a.pos.y &&
        a.pos.x <= _player.pos.x &&
        _player.pos.x < a.pos.x + a.str.length
      ) {
        _player.pos.x = clamp(_player.pos.x + way, 0, 15);
      }
      a.pos.x += way;
      if (a.pos.x <= -a.str.length || a.pos.x >= 16) {
        a.remove();
      }
    }
    if (gameOverTicks >= 0) {
      a.brightness = 1;
    }
  });
}

function fire(a: Actor) {
  a.setPriority(0.2);
  a.str = range(16)
    .map(() => (random.get() < 0.2 ? "y" : "r"))
    .join("");
  a.pos.y = 15;
  a.addUpdater(() => {
    if (!isReached && a.ticks >= 100 / difficulty) {
      a.ticks -= 100 / difficulty;
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

function water(a: Actor) {
  a.setPriority(0.1);
  a.str = range(16)
    .map(() => (random.get() < 0.2 ? "c" : "b"))
    .join("");
  a.pos.y = _fire == null ? 15 : _fire.pos.y - 1;
  let my = -1;
  const addScoreText = sga.spawn(text.text);
  addScoreText.pos.y = 1;
  let addingScore = 0;
  a.addUpdater(() => {
    if (a.ticks >= 4 / difficulty) {
      a.ticks -= 4 / difficulty;
      a.pos.y += my;
      if (my < 0) {
        a.str +=
          "\n" +
          range(16)
            .map(() => (random.get() < 0.2 ? "c" : "b"))
            .join("");
        if (a.pos.y === 0) {
          my = 1;
          if (reachedCount >= 3) {
            bgStr = range(16)
              .map(() =>
                range(16)
                  .map(() => "-")
                  .join("")
              )
              .join("\n");
            sga.pool.get(logOrCar).forEach(lc => {
              lc.remove();
            });
            spawnings = range(11).map(() => 9999);
          }
          _player.remove();
          _player = undefined;
        }
        addingScore += reachedCount;
        score += reachedCount;
        addScoreText.setText(`+${addingScore}`);
        drawScore();
      } else {
        if (_fire != null) {
          _fire.pos.y++;
        }
        if (a.pos.y > 15) {
          nextPlayer();
          a.remove();
          addScoreText.remove();
          hideScore();
        }
      }
    }
  });
}

function cursor(a: Actor & { onClick: Function }) {
  let flashTicks = 0;
  a.setPriority(0.5);
  a.onClick = (px, py) => {
    a.pos.set(px, py);
    flashTicks = 5;
    a.str = "w";
    a.brightness = 3;
    if (_player != null && _player.pos.distanceTo(a.pos)) {
      const oa = _player.pos.getAngle(a.pos);
      const stickAngle = wrap(Math.round(oa / (Math.PI / 2)), 0, 4);
      _player.onMove([1, 0, -1, 0][stickAngle], [0, 1, 0, -1][stickAngle]);
    }
  };
  a.addUpdater(() => {
    if (_pointer.isJustPressed) {
      const px = clamp(
        Math.floor((_pointer.pos.x - matrix.offset.x) / led.size + 0.5),
        0,
        15
      );
      const py = clamp(
        Math.floor((_pointer.pos.y - matrix.offset.y) / led.size + 0.5),
        0,
        15
      );
      a.onClick(px, py);
    }
    flashTicks--;
    if (flashTicks < 0) {
      a.str = "";
      a.brightness = 0;
    }
  });
}

function drawScore() {
  scoreText.setText(`${score}`);
}

function hideScore() {
  scoreText.setText("");
}

let gameOverText;

function initGameOver() {
  drawScore();
  if (_fire != null) {
    _fire.remove();
    _fire = undefined;
  }
  initGameOverOrTitle();
  gameOverTicks = 0;
}

function initTitle() {
  stageCount = 1;
  gameOverTicks = -1;
  initStage();
  initGameOverOrTitle();
  gameOverTicks = 240;
}

function initGameOverOrTitle() {
  gameOverText = sga.spawn(text.text);
  gameOverText.pos.y = 1;
  fireAppTicks = 9999999;
  keyboard.clearJustPressed();
  _pointer.clearJustPressed();
}

function handleGameOver() {
  if (gameOverTicks >= 240) {
    if (gameOverTicks === 240) {
      gameOverText.setText("XRO");
    }
  } else if (gameOverTicks % 60 === 0) {
    gameOverText.setText((gameOverTicks / 60) % 2 === 0 ? "GAME" : "OVER");
  }
  gameOverTicks++;
  if (
    gameOverTicks > 30 &&
    (keyboard.isJustPressed || _pointer.isJustPressed)
  ) {
    initGame();
  }
}

function update() {
  keyboard.update();
  _pointer.update();
  pointer.resetIsClicked();
  matrix.print(bgStr, 1, 0, 0);
  if (gameOverTicks >= 0) {
    handleGameOver();
  }
  sga.update();
  matrix.update();
}

view.init(init, update);
