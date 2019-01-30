import { Led, size } from "./led";
import { linkSync } from "fs";

export const leds: Led[][] = [];
export const count = 16;

export function init() {
  for (let x = 0; x < count; x++) {
    const l = [];
    for (let y = 0; y < count; y++) {
      const led = new Led({
        x: (x + 1.2) * size,
        y: (y + 1.2) * size
      });
      l.push(led);
    }
    leds.push(l);
  }
}

export function update() {
  for (let x = 0; x < count; x++) {
    for (let y = 0; y < count; y++) {
      leds[x][y].update();
    }
  }
}

export function print(
  str: string,
  brightnessIndex: number,
  x: number,
  y: number
) {
  const lines = str.split("\n");
  lines.forEach((l, iy) => {
    for (let ix = 0; ix < l.length; ix++) {
      printChar(l.charAt(ix), brightnessIndex, ix + x, iy + y);
    }
  });
}

const colorChars = " rgybpcw";

export function printChar(
  c: string,
  brightnessIndex: number,
  x: number,
  y: number
) {
  if (x < 0 || x >= count || y < 0 || y >= count) {
    return;
  }
  leds[x][y].setColor(colorChars.indexOf(c));
  leds[x][y].setBrightness(brightnessIndex);
}
