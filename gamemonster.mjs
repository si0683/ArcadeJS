/*! GameMonsterJS 3.0.0 — ES module entry. MIT License. https://github.com/si0683/GameMonsterJS */
// The engine is a browser script that defines window.GameMonster; this file re-exports it.
// Sounds and sprites load from the CDN (or from config.assetsUrl).
import './gamemonster.js';

const GameMonster = typeof window !== 'undefined' ? window.GameMonster : undefined;
export default GameMonster;
export const create = (config) => GameMonster.create(config);
export const version = '3.0.0';
