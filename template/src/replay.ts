// Input recording and replay: "it fell through the floor on level 2" becomes a file you can watch.
// In `npm run dev`: F7 starts recording from the level start, F7 again stops and downloads replay.json;
// F8 opens a replay file and plays it back (src/debug/). The game reads input from the recording
// instead of the keyboard.
//
// Input changes are stored with the game time since the level start — the clock the physics runs on —
// so a replay matches the run even when the frame rate differs or the browser stalls (to about
// one frame of input timing).

/** Actions in a fixed order: they are stored as bits */
export const REPLAY_ACTIONS = ["left", "right", "up", "down", "jump", "pause", "confirm"] as const
export type ReplayAction = (typeof REPLAY_ACTIONS)[number]

/** [ms since the level start, action bits, horizontal axis × 100] — written when the input changes */
export type ReplayEvent = [number, number, number]

export interface Replay {
  version: 2
  level: number
  /** Length of the recording, ms */
  duration: number
  events: ReplayEvent[]
}

export function encodeInput(down: Iterable<string>, axisX: number): [number, number] {
  let bits = 0
  for (const action of down) {
    const i = REPLAY_ACTIONS.indexOf(action as ReplayAction)
    if (i >= 0) bits |= 1 << i
  }
  return [bits, Math.round(axisX * 100)]
}

export function decodeInput(bits: number, axis: number): { down: Set<ReplayAction>; axisX: number } {
  return { down: new Set(REPLAY_ACTIONS.filter((_a, i) => bits & (1 << i))), axisX: axis / 100 }
}

/** Replay file text → Replay, or undefined if it is not one */
export function parseReplay(text: string): Replay | undefined {
  try {
    const data = JSON.parse(text) as Replay
    const ok =
      data.version === 2 &&
      Number.isInteger(data.level) &&
      Number.isFinite(data.duration) &&
      Array.isArray(data.events) &&
      data.events.every((e) => Array.isArray(e) && e.length === 3 && e.every(Number.isFinite))
    return ok ? data : undefined
  } catch {
    return undefined
  }
}

let recording: { replay: Replay; start: number; last: number } | undefined
let playback: { replay: Replay; start: number; next: number; bits: number; axis: number } | undefined

export const replay = {
  get isRecording() {
    return !!recording
  },
  get isPlaying() {
    return !!playback
  },
  startRecording(level: number) {
    playback = undefined
    recording = { replay: { version: 2, level, duration: 0, events: [] }, start: -1, last: 0 }
  },
  stopRecording(): Replay | undefined {
    if (!recording) return undefined
    const done = recording.replay
    done.duration = Math.round(recording.last)
    recording = undefined
    return done
  },
  startPlayback(data: Replay) {
    recording = undefined
    playback = { replay: data, start: -1, next: 0, bits: 0, axis: 0 }
  },
  stopPlayback() {
    playback = undefined
  },
  /**
   * Called by Controls every frame with the game time (ms: the sum of frame times the physics used);
   * the clock starts on the first call — the level's first frame
   */
  record(down: Iterable<string>, axisX: number, time: number) {
    if (!recording) return
    if (recording.start < 0) recording.start = time
    recording.last = time - recording.start
    const [bits, axis] = encodeInput(down, axisX)
    const last = recording.replay.events.at(-1)
    if (!last || last[1] !== bits || last[2] !== axis) {
      recording.replay.events.push([Math.round(recording.last), bits, axis])
    }
  },
  /** The recorded input at this game time; undefined when nothing plays (or the recording has ended) */
  next(time: number): ReturnType<typeof decodeInput> | undefined {
    if (!playback) return undefined
    if (playback.start < 0) playback.start = time
    const elapsed = time - playback.start
    const { events, duration } = playback.replay
    while (playback.next < events.length && events[playback.next][0] <= elapsed) {
      ;[, playback.bits, playback.axis] = events[playback.next]
      playback.next++
    }
    if (elapsed > duration && playback.next >= events.length) {
      playback = undefined
      return undefined
    }
    return decodeInput(playback.bits, playback.axis)
  },
}
