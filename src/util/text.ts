import * as letterPattern from "./letterPattern";
import { Actor } from "./actor";
import * as view from "./view";
import * as led from "./led";
import { range } from "./math";

export function init() {
  letterPattern.init();
}

export function text(a: Actor & { setText: Function }) {
  a.setPriority(0);
  a.str = "";
  a.setText = (str: string) => {
    if (str.length === 0) {
      a.str = "";
      return;
    }
    str = str.substr(0, 4);
    const lw = str.length === 4 ? 4 : 5;
    a.pos.x = [11, 6, 1, 0][str.length - 1];
    const chars = range(5).map(() => range(str.length * lw).map(() => " "));
    for (let i = 0; i < str.length; i++) {
      const c = letterPattern.charToIndex[str.charCodeAt(i)];
      if (c < 0) {
        continue;
      }
      letterPattern.dotPatterns[c].forEach(d => {
        chars[d.y][d.x + i * lw] = "w";
      });
    }
    a.str = chars.map(l => l.join("")).join("\n");
  };
}

export function drawDescription(str: string) {
  const cvs = view.descriptionCanvas;
  const ctx = view.descriptionContext;
  ctx.clearRect(0, 0, cvs.width, cvs.height);
  const c = led.colors[7];
  ctx.fillStyle = `rgb(${(c & 0xff0000) >> 16},
  ${(c & 0xff00) >> 8},
  ${c & 0xff})`;
  let y = 0;
  str.split("\n").forEach(l => {
    for (let i = 0; i < l.length; i++) {
      const c = letterPattern.charToIndex[l.charCodeAt(i)];
      if (c < 0) {
        continue;
      }
      letterPattern.dotPatterns[c].forEach(d => {
        ctx.fillRect(d.x + i * 5, d.y + y, 1, 1);
      });
    }
    y += 6;
  });
}
