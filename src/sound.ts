import { transpose, scale } from "tonal";
import * as Soundfont from "soundfont-player";
import { range } from "./math";

const win: any = window;
const AudioContext = win.AudioContext || win.webkitAudioContext;
export const audioContext = new AudioContext();
let instruments: { [s: string]: any } = {};
let isEnabled = true;

export function loadInstrument(name: string) {
  if (!isEnabled) {
    return;
  }
  if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
    isEnabled = false;
    return;
  }
  if (instruments[name] != null) {
    return;
  }
  (Soundfont.instrument as any)(audioContext, name, {
    soundfont: "FluidR3_GM"
  }).then((inst: any) => {
    instruments[name] = inst;
  });
}

export function getNotes(
  _scale: string,
  baseNote: string,
  baseOctave: number,
  skipCount: number,
  count: number
) {
  const s = scale(_scale);
  const oc = Math.ceil((count * skipCount) / s.length);
  return Array.prototype.concat
    .apply(
      [],
      range(oc).map(oi =>
        s.map((transpose as any)(`${baseNote}${baseOctave + oi}`))
      )
    )
    .filter((_: any, i: number) => i % skipCount === 0)
    .splice(0, count);
}

export function play(
  instrumentName: string,
  note: string,
  when: number,
  duration = 0.2,
  gain = 1
) {
  if (audioContext == null || audioContext.state !== "running" || !isEnabled) {
    return;
  }
  const inst = instruments[instrumentName];
  if (inst == null) {
    return;
  }
  inst.play(note, when, { duration, gain });
}

export function resumeAudioContext() {
  if (audioContext == null || audioContext.state !== "suspended") {
    return;
  }
  audioContext.resume();
}
