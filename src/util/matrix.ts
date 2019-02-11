import { Led, size as ledSize, colorChars } from "./led";
import * as sound from "./sound";
import { range } from "./math";
import { Vector } from "./vector";

export const count = 16;
export const leds: Led[][] = [];
export const offset = new Vector();
const markerLeds: Led[] = [];
let markerSounds: MarkerSound[];
let markerPos = count - 1;
let nextScheduledSecond = 0;
let options = {
  tempo: 300,
  isMarkerHorizontal: true
};

export function init(_options?: {
  tempo?: number;
  isMarkerHorizontal?: boolean;
}) {
  markerSounds = [];
  if (leds.length > 0) {
    return;
  }
  options = { ...options, ..._options };
  offset.set(ledSize * 1.2);
  for (let x = 0; x < count; x++) {
    const l = [];
    for (let y = 0; y < count; y++) {
      const led = new Led({
        x: x * ledSize + offset.x,
        y: y * ledSize + offset.y
      });
      l.push(led);
    }
    leds.push(l);
    let mx = (x + 1.2) * ledSize;
    let my = ledSize * 0.5;
    let ml: Led;
    if (options.isMarkerHorizontal) {
      ml = new Led({ x: mx, y: my });
      ml.height /= 2;
    } else {
      ml = new Led({ x: my, y: mx });
      ml.width /= 2;
    }
    ml.setColor(7);
    markerLeds.push(ml);
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

export function printChar(
  c: string,
  brightnessIndex: number,
  _x: number,
  _y: number
) {
  const x = Math.floor(_x);
  const y = Math.floor(_y);
  if (x < 0 || x >= count || y < 0 || y >= count) {
    return;
  }
  const ci = colorChars.indexOf(c);
  if (ci < 0) {
    return;
  }
  leds[x][y].setColor(ci);
  leds[x][y].setBrightness(brightnessIndex);
}

export function update() {
  stepMarker();
  for (let x = 0; x < count; x++) {
    for (let y = 0; y < count; y++) {
      leds[x][y].update();
    }
    markerLeds[x].update();
  }
}

export function getLed(_x: number, _y: number) {
  const x = Math.floor(_x);
  const y = Math.floor(_y);
  if (x < 0 || x >= count || y < 0 || y >= count) {
    return undefined;
  }
  return leds[x][y];
}

let scheduledSound: { instrumentName: string; note: string };

export function scheduleSound(instrumentName: string, note: string) {
  scheduledSound = { instrumentName, note };
}

export class MarkerSound {
  sounds: { instrumentName: string; note: string }[] = range(count).map(
    () => null
  );
  isPlayings = range(count).map(() => false);

  constructor(public filter: (l: Led, x: number, y: number) => boolean) {}

  add(
    pos: number,
    instrumentName: string,
    scale: string,
    baseNote: string,
    skipCount: number,
    count: number,
    isReversePos = false
  ) {
    sound.loadInstrument(instrumentName);
    const notes = sound.getNotes(scale, baseNote, skipCount, count);
    const step = isReversePos ? -1 : 1;
    notes.forEach((note, i) => {
      this.sounds[pos + i * step] = { instrumentName, note };
    });
  }

  play() {
    for (let i = 0; i < count; i++) {
      const x = options.isMarkerHorizontal ? markerPos : i;
      const y = options.isMarkerHorizontal ? i : markerPos;
      if (this.filter(leds[x][y], x, y)) {
        if (!this.isPlayings[i]) {
          const s = this.sounds[i];
          if (s != null) {
            sound.play(s.instrumentName, s.note, nextScheduledSecond);
          }
          this.isPlayings[i] = true;
        }
      } else {
        this.isPlayings[i] = false;
      }
    }
  }
}

export function addMarkerSound(
  filter: (l: Led, x: number, y: number) => boolean
) {
  const ms = new MarkerSound(filter);
  markerSounds.push(ms);
  return ms;
}

function stepMarker() {
  const ct = sound.audioContext.currentTime;
  if (ct === 0) {
    return;
  }
  if (ct > nextScheduledSecond) {
    nextScheduledSecond = ct + 0.1;
  }
  if (nextScheduledSecond - ct > 0.1) {
    return;
  }
  printMarker(0, markerPos);
  markerPos = (markerPos + 1) % count;
  playMarker();
  if (scheduledSound != null) {
    sound.play(
      scheduledSound.instrumentName,
      scheduledSound.note,
      nextScheduledSecond
    );
    scheduledSound = undefined;
  }
  printMarker(2, markerPos);
  nextScheduledSecond += 60 / options.tempo;
}

function printMarker(brightnessIndex: number, x: number) {
  markerLeds[x].setBrightness(brightnessIndex);
}

function playMarker() {
  markerSounds.forEach(ms => {
    ms.play();
  });
}
