// Random numbers for gameplay that can be repeated: the same seed gives the same sequence on every
// device. Use `rng` (not Math.random) for anything that changes the game — enemy choices, loot, level
// generation — and replays, golden runs (npm run test:golden) and server checks stay exact.
// GameScene seeds it with the level number at the start, so a level plays out the same for the same input.
// Cosmetics (sound pitch, particles) may keep Math.random.

/** mulberry32: tiny, fast and good enough for games */
export function createRandom(seed = 1) {
  let state = seed >>> 0
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    seed(value: number) {
      state = value >>> 0
    },
    /** 0 ≤ x < 1 */
    next,
    /** min ≤ x ≤ max, whole */
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    /** min ≤ x < max */
    float: (min: number, max: number) => min + next() * (max - min),
    pick: <T>(list: readonly T[]): T => list[Math.floor(next() * list.length)],
    chance: (probability: number) => next() < probability,
  }
}

export const rng = createRandom()
