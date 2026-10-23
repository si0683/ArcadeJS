// WAV reading and writing in plain JS for the build scripts (no ffmpeg): PCM 8/16/24/32-bit and float,
// any sample rate and channel count, WAVE_FORMAT_EXTENSIBLE included.

/** WAV bytes → { rate, channels: Float32Array[] } with samples in −1…1 */
export function readWav(buffer) {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  const text = (at, n) => String.fromCharCode(...buffer.subarray(at, at + n))
  if (text(0, 4) !== "RIFF" || text(8, 4) !== "WAVE") throw new Error("not a WAV file")
  let format
  let data
  for (let at = 12; at + 8 <= buffer.length;) {
    const id = text(at, 4)
    const size = view.getUint32(at + 4, true)
    if (id === "fmt ") {
      format = {
        tag: view.getUint16(at + 8, true),
        channels: view.getUint16(at + 10, true),
        rate: view.getUint32(at + 12, true),
        bits: view.getUint16(at + 22, true),
      }
      // Extensible: the real format is in the sub-format GUID (1 — PCM, 3 — float)
      if (format.tag === 0xfffe) format.tag = view.getUint16(at + 32, true)
    } else if (id === "data") data = { at: at + 8, size: Math.min(size, buffer.length - at - 8) }
    at += 8 + size + (size & 1)
  }
  if (!format || !data) throw new Error("WAV without fmt or data")
  const { tag, channels, bits } = format
  const bytes = bits / 8
  const frames = Math.floor(data.size / (bytes * channels))
  const out = Array.from({ length: channels }, () => new Float32Array(frames))
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < channels; c++) {
      const at = data.at + (i * channels + c) * bytes
      let v
      if (tag === 3 && bits === 32) v = view.getFloat32(at, true)
      else if (bits === 8) v = (view.getUint8(at) - 128) / 128
      else if (bits === 16) v = view.getInt16(at, true) / 32768
      else if (bits === 24)
        v = (view.getUint8(at) | (view.getUint8(at + 1) << 8) | (view.getInt8(at + 2) << 16)) / 8388608
      else if (bits === 32) v = view.getInt32(at, true) / 2147483648
      else throw new Error(`unsupported WAV: ${bits}-bit format ${tag}`)
      out[c][i] = v
    }
  }
  return { rate: format.rate, channels: out }
}

/** Mono/stereo mix to `channels` and linear resampling to `rate` */
export function convert(sound, rate, channels) {
  const source = sound.channels
  const ratio = sound.rate / rate
  const length = Math.round(source[0].length / ratio)
  return Array.from({ length: channels }, (_, c) => {
    const from = source[Math.min(c, source.length - 1)]
    const out = new Float32Array(length)
    for (let i = 0; i < length; i++) {
      const x = i * ratio
      const i0 = Math.floor(x)
      const t = x - i0
      out[i] = (from[i0] ?? 0) * (1 - t) + (from[i0 + 1] ?? from[i0] ?? 0) * t
    }
    return out
  })
}

/** { rate, channels } → 16-bit PCM WAV bytes */
export function writeWav({ rate, channels }) {
  const frames = channels[0].length
  const size = frames * channels.length * 2
  const buffer = Buffer.alloc(44 + size)
  buffer.write("RIFF", 0, "ascii")
  buffer.writeUInt32LE(36 + size, 4)
  buffer.write("WAVEfmt ", 8, "ascii")
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(channels.length, 22)
  buffer.writeUInt32LE(rate, 24)
  buffer.writeUInt32LE(rate * channels.length * 2, 28)
  buffer.writeUInt16LE(channels.length * 2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write("data", 36, "ascii")
  buffer.writeUInt32LE(size, 40)
  let at = 44
  for (let i = 0; i < frames; i++) {
    for (const channel of channels) {
      buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, channel[i])) * 32767), at)
      at += 2
    }
  }
  return buffer
}

/**
 * Sounds one after another with silence between them → one sound + the Phaser audio sprite map
 * ({ name: { start, end } } in seconds)
 */
export function joinSounds(sounds, { rate = 44100, gap = 0.2 } = {}) {
  const channels = Math.max(...sounds.map((s) => s.sound.channels.length))
  const parts = sounds.map((s) => ({ name: s.name, data: convert(s.sound, rate, channels) }))
  const silence = Math.round(gap * rate)
  const total = parts.reduce((n, p) => n + p.data[0].length + silence, 0)
  const out = Array.from({ length: channels }, () => new Float32Array(total))
  const spritemap = {}
  let at = 0
  for (const part of parts) {
    part.data.forEach((samples, c) => out[c].set(samples, at))
    const length = part.data[0].length
    spritemap[part.name] = { start: round(at / rate), end: round((at + length) / rate), loop: false }
    at += length + silence
  }
  return { sound: { rate, channels: out }, spritemap }
}

const round = (s) => Math.round(s * 1000) / 1000
