import { Vector } from "./vector";
import { range, wrap } from "./math";

export let isPressed = false;
export let isJustPressed = false;
export let stick = new Vector();
export let stickAngle: number;
let isUsingStickKeysAsButton = false;
let isFourWaysStick = false;
let isInitialized = false;

const isKeyPressing = range(256).map(() => false);
const isKeyPressed = range(256).map(() => false);
const stickKeys = [
  [39, 68, 102],
  [40, 83, 101, 98],
  [37, 65, 100],
  [38, 87, 104]
];
const stickXys = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const buttonKeys = [
  90,
  88,
  67,
  86,
  66,
  78,
  77,
  188,
  190,
  191,
  17,
  16,
  18,
  32,
  13
];

export function init(options?: {
  isUsingStickKeysAsButton?: boolean;
  isFourWaysStick?: boolean;
}) {
  if (isInitialized) {
    return;
  }
  if (options != null) {
    if (options.isUsingStickKeysAsButton != null) {
      isUsingStickKeysAsButton = options.isUsingStickKeysAsButton;
    }
    if (options.isFourWaysStick != null) {
      isFourWaysStick = options.isFourWaysStick;
    }
  }
  document.addEventListener("keydown", e => {
    isKeyPressing[e.keyCode] = isKeyPressed[e.keyCode] = true;
  });
  document.addEventListener("keyup", e => {
    isKeyPressing[e.keyCode] = false;
  });
  isInitialized = true;
}

export function update() {
  if (!isInitialized) {
    return;
  }
  const pp = isPressed;
  isPressed = isJustPressed = false;
  stick.set(0);
  stickKeys.forEach((ks, i) => {
    ks.forEach(k => {
      if (isKeyPressing[k] || isKeyPressed[k]) {
        stick.x += stickXys[i][0];
        stick.y += stickXys[i][1];
        if (isUsingStickKeysAsButton) {
          isPressed = true;
        }
        if (isKeyPressed[k]) {
          isKeyPressed[k] = false;
          if (isUsingStickKeysAsButton && !pp) {
            isJustPressed = true;
          }
        }
      }
    });
  });
  stickAngle = 0;
  if (stick.length > 0) {
    setStickAngle(stick.getAngle());
  }
  buttonKeys.forEach(k => {
    if (isKeyPressing[k]) {
      isPressed = true;
    }
    if (isKeyPressed[k]) {
      isKeyPressed[k] = false;
      if (!pp) {
        isPressed = isJustPressed = true;
      }
    }
  });
}

const angleOffsets = [1, 0, 1, 1, 0, 1, -1, 1, -1, 0, -1, -1, 0, -1, 1, -1];
function setStickAngle(a: number) {
  const wayAngle = isFourWaysStick ? Math.PI / 2 : Math.PI / 4;
  const angleStep = isFourWaysStick ? 2 : 1;
  stickAngle = wrap(Math.round(a / wayAngle) * angleStep, 0, 8);
  stick.set(angleOffsets[stickAngle * 2], angleOffsets[stickAngle * 2 + 1]);
  stickAngle++;
}

export function clearJustPressed() {
  isJustPressed = false;
  isPressed = true;
}
