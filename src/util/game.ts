import * as view from "./view";
import * as matrix from "./matrix";
import * as led from "./led";
import * as text from "./text";
import * as sga from "./simpleGameActor";
import { Actor } from "./actor";
import * as keyboard from "./keyboard";
import { Pointer, init as initPointer, resetIsClicked } from "./pointer";
import * as sound from "./sound";
import { clamp, range, wrap } from "./math";
import { Vector } from "./vector";

type Scene = "title" | "game" | "gameOver";
export let scene: Scene;
export let cursor: Actor & { onJustPressed: Function; onPressed: Function };
export let scoreText;
export let background = range(16)
  .map(() =>
    range(16)
      .map(() => "-")
      .join("")
  )
  .join("\n");
let pointer: Pointer;
let options = {
  title: "",
  description: "",
  onInitialize: () => {},
  onStartingTitle: () => {},
  onStartingGame: () => {},
  onStartingGameOver: () => {},
  onJustPressedCursor: (pos: Vector) => {},
  onPressedCursor: (pos: Vector) => {},
  matrixOptions: { tempo: 300, isMarkerHorizontal: false },
  keyboardOptions: { isFourWaysStick: false, isUsingStickKeysAsButton: true },
  isDebugMode: false,
  isCapturing: false
};
let score: number;
let gameOverTicks: number;
let gameOverText;
let descriptionTicks: number;

export function init(_options?) {
  options = { ...options, ..._options };
  view.init(initFirst, update, options.isCapturing);
}

function initFirst() {
  keyboard.init(options.keyboardOptions);
  initPointer(sound.resumeAudioContext);
  pointer = new Pointer(
    view.canvas,
    new Vector(view.size),
    false,
    new Vector(0.5)
  );
  pointer.isDebugMode = options.isDebugMode;
  text.init();
  sga.setActorClass(Actor);
  matrix.init(options.matrixOptions);
  options.onInitialize();
  (options.isDebugMode ? startGame : startTitle)();
  descriptionTicks = 300;
  text.drawDescription(options.description);
}

function update() {
  keyboard.update();
  pointer.update();
  resetIsClicked();
  matrix.print(background, 1, 0, 0);
  if (gameOverTicks >= 0) {
    updateGameOver();
  }
  if (scene === "game" && descriptionTicks > 0) {
    descriptionTicks--;
    if (descriptionTicks === 0) {
      text.drawDescription("");
    }
  }
  sga.update();
  matrix.update();
}

export function setBackground(str: string) {
  background = str;
}

export function scrollBackground(
  ox: number,
  oy: number,
  isLooping = false,
  _str: string = undefined
) {
  const str = (_str == null ? background : _str).split("\n");
  const nextStr = range(16)
    .map(i => {
      let y = i - oy;
      if (isLooping) {
        y = wrap(y, 0, 16);
      } else {
        if (y < 0 || y >= 16) {
          return;
        }
      }
      const l = str[y];
      if (isLooping) {
        return ox < 0
          ? l.substr(-ox, 16 + ox) + l.substr(0, 16 - ox)
          : l.substr(16 - ox, ox) + l.substr(16 + ox, -ox);
      } else {
        const pd = range(Math.abs(ox))
          .map(() => " ")
          .join("");
        return ox < 0 ? l.substr(-ox, 16 + ox) + pd : pd + l.substr(0, 16 - ox);
      }
    })
    .join("\n");
  if (_str == null) {
    background = nextStr;
  }
  return nextStr;
}

export function reset() {
  sga.reset();
  cursor = sga.spawn(cursorActor);
  scoreText = sga.spawn(text.text);
  scoreText.pos.y = 10;
}

export function startGameOver() {
  scene = "gameOver";
  gameOverTicks = 0;
  showScore();
  options.onStartingGameOver();
  startGameOverOrTitle();
}

export function addScore(v: number) {
  score += v;
}

export function showScore() {
  scoreText.setText(`${score}`);
}

export function hideScore() {
  scoreText.setText("");
}

function startGame() {
  scene = "game";
  score = 0;
  gameOverTicks = -1;
  reset();
  options.onStartingGame();
  keyboard.clearJustPressed();
  pointer.clearJustPressed();
}

function startTitle() {
  scene = "title";
  gameOverTicks = 240;
  options.onStartingTitle();
  startGameOverOrTitle();
}

function startGameOverOrTitle() {
  gameOverText = sga.spawn(text.text);
  gameOverText.pos.y = 1;
  keyboard.clearJustPressed();
  pointer.clearJustPressed();
}

function updateGameOver() {
  if (gameOverTicks >= 240) {
    if (gameOverTicks === 240) {
      gameOverText.setText(options.title);
    }
  } else if (gameOverTicks % 60 === 0) {
    gameOverText.setText((gameOverTicks / 60) % 2 === 0 ? "GAME" : "OVER");
  }
  gameOverTicks++;
  if (gameOverTicks > 30 && (keyboard.isJustPressed || pointer.isJustPressed)) {
    startGame();
  }
}

function cursorActor(
  a: Actor & { onJustPressed: Function; onPressed: Function }
) {
  let flashTicks = 0;
  let isFlashing = false;
  a.setPriority(0.5);
  function show(px, py) {
    a.pos.set(px, py);
    a.str = "w";
    a.brightness = 3;
  }
  a.onJustPressed = (px, py) => {
    show(px, py);
    flashTicks = 5;
    options.onJustPressedCursor(a.pos);
  };
  a.onPressed = (px, py) => {
    show(px, py);
    isFlashing = true;
    options.onPressedCursor(a.pos);
  };
  a.addUpdater(() => {
    isFlashing = false;
    if (pointer.isJustPressed || pointer.isPressed) {
      const px = clamp(
        Math.floor((pointer.pos.x - matrix.offset.x) / led.size + 0.5),
        0,
        15
      );
      const py = clamp(
        Math.floor((pointer.pos.y - matrix.offset.y) / led.size + 0.5),
        0,
        15
      );
      if (pointer.isJustPressed) {
        a.onJustPressed(px, py);
      }
      a.onPressed(px, py);
    }
    flashTicks--;
    if (flashTicks < 0 && !isFlashing) {
      a.str = "";
      a.brightness = 0;
    }
  });
}
