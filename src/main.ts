import * as view from "./view";
import * as matrix from "./matrix";

function init() {
  matrix.init();
}

let ticks = 0;

function update() {
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      matrix.leds[x][y].setBrightness(
        Math.sin(ticks * 0.1 + x * 0.1 + y * 0.2) * 0.5 + 0.5
      );
    }
  }
  matrix.update();
  ticks++;
}

view.init(init, update);
