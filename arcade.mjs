/*! ArcadeJS 2.0.0 — ES module entry. MIT License. https://github.com/si0683/ArcadeJS */
// The engine is a browser script that defines window.Arcade; this file re-exports it.
// Sounds and sprites load from the CDN (or from config.assetsUrl).
import './arcade.js';

const Arcade = typeof window !== 'undefined' ? window.Arcade : undefined;
export default Arcade;
export const create = (config) => Arcade.create(config);
export const version = '2.0.0';
