import { transpose, scale } from "tonal";
import * as Soundfont from "soundfont-player";
import { range } from "./math";

const win: any = window;
const AudioContext = win.AudioContext || win.webkitAudioContext;
export const audioContext = new AudioContext();
let instruments: { [s: string]: any } = {};

export function loadInstrument(name: string) {
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
  octaveFrom: number,
  octaveTo: number,
  skipCount: number
) {
  return Array.prototype.concat.apply(
    [],
    range(octaveTo - octaveFrom + 1).map(oi =>
      scale(_scale)
        .map((transpose as any)(`${baseNote}${octaveFrom + oi}`))
        .filter((_: any, i: number) => i % skipCount === 0)
    )
  );
}

export function play(
  instrumentName: string,
  note: string,
  when: number,
  duration = 0.2,
  gain = 1
) {
  if (audioContext == null || audioContext.state !== "running") {
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
