// Game rules as plain functions: no Phaser inside, so they are covered by unit tests (src/*.test.ts).
// Scenes call them; keep new rules here too.

import { STOMP_MARGIN } from "./config"

/** The player lands on an enemy from above (falling and higher than its top) — the enemy is squashed */
export function isStomp(playerFallSpeed: number, playerY: number, enemyY: number): boolean {
  return playerFallSpeed > 0 && playerY < enemyY - STOMP_MARGIN
}

/** A new best score: more points than before */
export function isRecord(score: number, best: number): boolean {
  return score > best
}

/** Lives left after a hit; the game is over at 0 */
export function loseLife(lives: number): { lives: number; gameOver: boolean } {
  const left = Math.max(0, lives - 1)
  return { lives: left, gameOver: left === 0 }
}
