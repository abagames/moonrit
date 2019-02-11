import * as view from "./view";

export const size = view.size / 17;
export const colors = [
  0x000000,
  0xe91e63,
  0x4caf50,
  0xffeb3b,
  0x3f51b5,
  0x9c27b0,
  0x03a9f4,
  0xeeeeee
];
export const colorChars = "-rgybpcw";
const brightnesss = [0, 0.4, 0.7, 1];
const response = 0.36;

export class Led {
  colorIndex = 0;
  colorChar: string;
  brightnessIndex = 0;
  color = { r: 0, g: 0, b: 0 };
  targetColor = { r: 0, g: 0, b: 0 };
  brightness = 0;
  targetBrightness = 0;
  width = size;
  height = size;

  constructor(public pos = { x: 0, y: 0 }) {}

  setColor(colorIndex: number) {
    this.colorIndex = colorIndex;
    this.colorChar = colorChars[colorIndex];
    const c = colors[colorIndex];
    this.targetColor = {
      r: (c & 0xff0000) >> 16,
      g: (c & 0xff00) >> 8,
      b: c & 0xff
    };
  }

  setBrightness(brightnessIndex: number) {
    this.brightnessIndex = brightnessIndex;
    this.targetBrightness = brightnesss[brightnessIndex];
  }

  update() {
    this.color.r += (this.targetColor.r - this.color.r) * response;
    this.color.g += (this.targetColor.g - this.color.g) * response;
    this.color.b += (this.targetColor.b - this.color.b) * response;
    this.brightness += (this.targetBrightness - this.brightness) * response;
    if (
      this.color.r + this.color.g + this.color.b < 64 ||
      this.brightness < 0.1
    ) {
      return;
    }
    view.fillRect(
      this.pos.x,
      this.pos.y,
      this.width * 0.5,
      this.height * 0.5,
      this.color,
      this.brightness
    );
  }
}
