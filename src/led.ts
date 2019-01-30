import * as view from "./view";

export const size = view.size / 17;
const colors = [
  0x000000,
  0xe91e63,
  0x4caf50,
  0xffeb3b,
  0x3f51b5,
  0x9c27b0,
  0x03a9f4,
  0xeeeeee
];
const brightnesss = [0, 0.33, 0.66, 1];

export class Led {
  color = { r: 0, g: 0, b: 0 };
  brightness = 0;
  targetBrightness = 0;

  constructor(public pos = { x: 0, y: 0 }) {}

  setColor(colorIndex: number) {
    const c = colors[colorIndex];
    this.color = {
      r: (c & 0xff0000) >> 16,
      g: (c & 0xff00) >> 8,
      b: c & 0xff
    };
  }

  setBrightness(brightNessIndex: number) {
    this.targetBrightness = brightnesss[brightNessIndex];
  }

  update() {
    this.brightness += (this.targetBrightness - this.brightness) * 0.3;
    if (this.color === 0 || this.brightness < 0.1) {
      return;
    }
    view.fillRect(
      this.pos.x,
      this.pos.y,
      size * 0.5,
      size * 0.5,
      this.color,
      this.brightness
    );
  }
}
