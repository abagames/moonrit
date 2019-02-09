import * as game from "../util/game";
import * as matrix from "../util/matrix";
import * as text from "../util/text";
import { spawn, addUpdater } from "../util/simpleGameActor";
import { Actor } from "../util/actor";
import * as keyboard from "../util/keyboard";
import * as sound from "../util/sound";
import { range, clamp, wrap } from "../util/math";
import { Random } from "../util/random";
import { Vector } from "../util/vector";

let _player;

function onInitialize() {
  initMarkSounds();
}

function player(a: Actor & { move: Function }) {
  a.pos.set(7, 7);
  a.move = x => {
    a.pos.x += x;
  };
  a.addUpdater(() => {
    if (keyboard.isStickPressed[0]) {
      game.cursor.onPressed(a.pos.x + 1, a.pos.y);
    }
    if (keyboard.isStickPressed[2]) {
      game.cursor.onPressed(a.pos.x - 1, a.pos.y);
    }
  });
}

function initMarkSounds() {}

function onStartingGame() {
  _player = spawn(player);
}

function onStartingGameOver() {}

function onStartingTitle() {}

function onJustPressedCursor(pos) {}

function onPressedCursor(pos) {
  if (_player != null && _player.pos.x != pos.x) {
    _player.move(pos.x > _player.pos.x ? 1 : -1);
  }
}

game.init({
  title: "JEX",
  description: "",
  onInitialize,
  onStartingGame,
  onStartingGameOver,
  onStartingTitle,
  onJustPressedCursor,
  onPressedCursor,
  isDebugMode: true
});
