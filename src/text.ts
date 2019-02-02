import * as letterPattern from "./letterPattern";
import { Actor } from "./actor";
import { range, clamp } from "./math";

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
