import { Led, size } from "./led";
import * as sound from "./sound";
import { range } from "./math";

export const count = 16;
export const leds: Led[][] = [];
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
  for (let x = 0; x < count; x++) {
    const l = [];
    for (let y = 0; y < count; y++) {
      const led = new Led({
        x: (x + 1.2) * size,
        y: (y + 1.2) * size
      });
      l.push(led);
    }
    leds.push(l);
    let mx = (x + 1.2) * size;
    let my = size * 0.5;
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
  x: number,
  y: number
) {
  if (x < 0 || x >= count || y < 0 || y >= count) {
    return;
  }
  const ci = "-rgybpcw".indexOf(c);
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

let scheduledSound: { instrumentName: string; note: string };

export function scheduleSound(instrumentName: string, note: string) {
  scheduledSound = { instrumentName, note };
}

export class MarkerSound {
  sounds: { instrumentName: string; note: string }[] = range(count).map(
    () => null
  );
  isPlayings = range(count).map(() => false);

  constructor(public filter: (l: Led) => boolean) {}

  add(
    pos: number,
    instrumentName: string,
    scale: string,
    baseNote: string,
    baseOctave: number,
    skipCount: number,
    count: number
  ) {
    sound.loadInstrument(instrumentName);
    const notes = sound.getNotes(scale, baseNote, baseOctave, skipCount, count);
    notes.forEach((note, i) => {
      this.sounds[pos + i] = { instrumentName, note };
    });
  }

  play() {
    for (let i = 0; i < count; i++) {
      let led = options.isMarkerHorizontal
        ? leds[markerPos][i]
        : leds[i][markerPos];
      if (this.filter(led)) {
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

export function addMarkerSound(filter: (l: Led) => boolean) {
  const ms = new MarkerSound(filter);
  markerSounds.push(ms);
  return ms;
}

function stepMarker() {
  const ct = sound.audioContext.currentTime;
  if (ct === 0 || ct > nextScheduledSecond) {
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
