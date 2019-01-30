import { Led, size } from "./led";
import * as sound from "./sound";
import { range } from "./math";

export const count = 16;
export const leds: Led[][] = [];
const markerLeds: Led[] = [];
let markerPos = count - 1;
let markerSounds: { instrumentName: string; note: string }[];
let nextScheduledSecond = 0;
let isMakerPlayings: boolean[] = [];
const tempo = 300;
const isMarkerHorizontal = false;

export function init() {
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
    if (isMarkerHorizontal) {
      ml = new Led({ x: mx, y: my });
      ml.height /= 2;
    } else {
      ml = new Led({ x: my, y: mx });
      ml.width /= 2;
    }
    ml.setColor(7);
    markerLeds.push(ml);
  }
  initMarkerSound();
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

const colorChars = " rgybpcw";

export function printChar(
  c: string,
  brightnessIndex: number,
  x: number,
  y: number
) {
  if (x < 0 || x >= count || y < 0 || y >= count) {
    return;
  }
  leds[x][y].setColor(colorChars.indexOf(c));
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

function initMarkerSound() {
  markerSounds = range(count).map(() => null);
  isMakerPlayings = range(count).map(() => false);
  addMarkerSounds(0, "synth_drum", "major pentatonic", "A", 2, 5, 3);
  addMarkerSounds(3, "melodic_tom", "major pentatonic", "A", 3, 5, 2);
  addMarkerSounds(5, "kalimba", "major pentatonic", "A", 3, 5, 2);
  addMarkerSounds(7, "synth_bass_2", "major pentatonic", "A", 2, 1, 9);
}

function addMarkerSounds(
  pos: number,
  instrumentName: string,
  scale: string,
  baseNote: string,
  octaveFrom: number,
  skipCount: number,
  count: number
) {
  sound.loadInstrument(instrumentName);
  const notes = sound
    .getNotes(scale, baseNote, octaveFrom, 8, skipCount)
    .slice(0, count);
  notes.forEach((note, i) => {
    markerSounds[pos + i] = { instrumentName, note };
  });
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
  printMarker(2, markerPos);
  nextScheduledSecond += 60 / tempo;
}

function printMarker(brightnessIndex: number, x: number) {
  markerLeds[x].setBrightness(brightnessIndex);
}

function playMarker() {
  for (let i = 0; i < count; i++) {
    let led = isMarkerHorizontal ? leds[markerPos][i] : leds[i][markerPos];
    if (!isMakerPlayings[i] && led.brightnessIndex >= 2) {
      const ms = markerSounds[i];
      if (ms != null) {
        sound.play(ms.instrumentName, ms.note, nextScheduledSecond);
      }
      isMakerPlayings[i] = true;
    } else {
      isMakerPlayings[i] = false;
    }
  }
}
