import { FEATURES } from "./config"
import { t } from "./i18n"

// "Turn your phone sideways": the game is landscape (960×540), held upright it would be tiny.
// The message is plain HTML (#rotate in index.html) and shows only on touch screens in portrait,
// by a CSS media query — no code runs on rotation. A portrait game: set FEATURES.rotatePrompt = false.
export function installRotatePrompt() {
  const element = document.getElementById("rotate")
  if (!FEATURES.rotatePrompt || !element) return
  element.textContent = `⟳ ${t("rotate")}`
  element.classList.add("on")
}
