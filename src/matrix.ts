import { Led, size } from "./led";

export const leds: Led[][] = [];
export const count = 16;

export function init() {
  for (let x = 0; x < count; x++) {
    const l = [];
    for (let y = 0; y < count; y++) {
      const led = new Led(0xe91e63, {
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
