import * as view from "./view";
import { Led, size } from "./led";

const leds: Led[][] = [];

function init() {
  for (let y = 0; y < 16; y++) {
    const l = [];
    for (let x = 0; x < 16; x++) {
      const led = new Led(0xe91e63, {
        x: (x + 1.2) * size,
        y: (y + 1.2) * size
      });
      l.push(led);
    }
    leds.push(l);
  }
}

let ticks = 0;

function update() {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      leds[y][x].setBrightness(
        Math.sin(ticks * 0.1 + x * 0.1 + y * 0.2) * 0.5 + 0.5
      );
      leds[y][x].update();
    }
  }
  ticks++;
}

view.init(init, update);
