import { transpose, scale } from "tonal";
import * as Soundfont from "soundfont-player";
import { range } from "./math";

const win: any = window;
const AudioContext = win.AudioContext || win.webkitAudioContext;
export const audioContext = new AudioContext();
let instruments: { [s: string]: any } = {};
let loadingInstruments: { [s: string]: boolean } = {};
let isEnabled = true;

export function loadInstrument(name: string) {
  if (!isEnabled) {
    return;
  }
  if (loadingInstruments[name] != null) {
    return;
  }
  loadingInstruments[name] = true;
  (Soundfont.instrument as any)(audioContext, name, {
    soundfont: "FluidR3_GM"
  }).then((inst: any) => {
    instruments[name] = inst;
  });
}

export function getNotes(
  _scale: string,
  baseNote: string,
  skipCount: number,
  count: number
) {
  const s = scale(_scale);
  const oc = Math.ceil((count * skipCount) / s.length);
  const note = baseNote.substr(0, baseNote.length - 1);
  const octave = parseInt(baseNote.charAt(baseNote.length - 1));
  return Array.prototype.concat
    .apply(
      [],
      range(oc).map(oi => s.map((transpose as any)(`${note}${octave + oi}`)))
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
