import * as view from "./view";
import * as matrix from "./matrix";

function init() {
  matrix.init();
}

let ticks = 0;

function update() {
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      const led = matrix.leds[x][y];
      led.setColor((y + Math.floor(ticks / 30)) % 8);
      led.setBrightness((x + y * 2 + Math.floor(ticks / 20)) % 4);
    }
  }
  matrix.update();
  ticks++;
}

view.init(init, update);
