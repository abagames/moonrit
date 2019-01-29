import * as view from "./view";

export const size = view.size / 17;

export class Led {
  color: { r: number; g: number; b: number };
  brightness = 0;

  constructor(_color: number, public pos = { x: 0, y: 0 }) {
    this.color = {
      r: (_color & 0xff0000) >> 16,
      g: (_color & 0xff00) >> 8,
      b: _color & 0xff
    };
  }

  setBrightness(v: number) {
    this.brightness = v;
  }

  update() {
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
