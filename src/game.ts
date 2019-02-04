import * as view from "./view";
import * as matrix from "./matrix";
import * as led from "./led";
import * as sga from "./simpleGameActor";
import { Actor } from "./actor";
import * as keyboard from "./keyboard";
import * as pointer from "./pointer";
import * as sound from "./sound";
import { clamp } from "./math";
import { Vector } from "./vector";
import * as text from "./text";

type Scene = "title" | "game" | "gameOver";
export let scene: Scene;
export let _cursor;
export let bgStr = "";
let _pointer: pointer.Pointer;
let options = {
  matrixOptions: { tempo: 300, isMarkerHorizontal: false },
  title: "",
  onInitialize: () => {},
  onStartingTitle: () => {},
  onStartingGame: () => {},
  onStartingGameOver: () => {},
  onClickCursor: (pos: Vector) => {}
};
let score: number;
let scoreText;
let gameOverTicks: number;
let gameOverText;

export function init(_options?) {
  options = { ...options, ..._options };
  view.init(initFirst, update);
}

function initFirst() {
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
  matrix.init(options.matrixOptions);
  options.onInitialize();
  startTitle();
}

function update() {
  keyboard.update();
  _pointer.update();
  pointer.resetIsClicked();
  matrix.print(bgStr, 1, 0, 0);
  if (gameOverTicks >= 0) {
    updateGameOver();
  }
  sga.update();
  matrix.update();
}

export function setBgStr(str: string) {
  bgStr = str;
}

export function reset() {
  sga.reset();
  _cursor = sga.spawn(cursor);
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
  options.onStartingGame();
  keyboard.clearJustPressed();
  _pointer.clearJustPressed();
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
  _pointer.clearJustPressed();
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
  if (
    gameOverTicks > 30 &&
    (keyboard.isJustPressed || _pointer.isJustPressed)
  ) {
    startGame();
  }
}

function cursor(a: Actor & { onClick: Function }) {
  let flashTicks = 0;
  a.setPriority(0.5);
  a.onClick = (px, py) => {
    a.pos.set(px, py);
    flashTicks = 5;
    a.str = "w";
    a.brightness = 3;
    options.onClickCursor(a.pos);
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
