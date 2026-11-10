// Demo affordance: shows what the agent is doing, on screen, in human words.
//
// Two things are drawn over the page:
//  - a status card, centred near the top: "Thinking…", "Looking at the page…", or what the agent is
//    doing ("Creating the folder 'Module Information'"), with a pulsing dot while a model call runs;
//  - a ring, pointer and label around the element about to be used, so the recording shows the target.
//
// Everything drawn is aria-hidden, so it stays out of the accessibility tree sent to the model.
// That is the one property to preserve: an overlay the model could see would change its behaviour.
import type { System } from "./browser";

/** Injected on demand (see ensureOverlay). Guarded, so calling it twice is harmless. */
export const OVERLAY_SCRIPT = `(() => {
  if (window.__bbOverlay) return;

  const style = document.createElement("style");
  style.textContent = "@keyframes bbPulse{0%{opacity:.25}50%{opacity:1}100%{opacity:.25}}" +
    "@keyframes bbSpin{to{transform:rotate(360deg)}}";

  const root = document.createElement("div");
  root.id = "bb-overlay";
  root.setAttribute("aria-hidden", "true");
  root.setAttribute("role", "presentation");
  root.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483647";

  // status card: centred horizontally, near the top so it never covers the element being used
  const card = document.createElement("div");
  card.style.cssText = "position:fixed;left:50%;top:16%;transform:translateX(-50%);background:rgba(17,17,20,.94);color:#fff;" +
    "font:600 18px/1.4 'Segoe UI',system-ui,sans-serif;padding:14px 22px;border-radius:14px;max-width:70vw;text-align:center;" +
    "box-shadow:0 14px 44px rgba(0,0,0,.45);display:flex;align-items:center;gap:12px;opacity:0;transition:opacity .15s ease";

  const dot = document.createElement("div");
  dot.style.cssText = "width:12px;height:12px;border-radius:50%;background:#a78bfa;flex:0 0 auto;animation:bbPulse 1s ease-in-out infinite;display:none";

  const text = document.createElement("div");
  const title = document.createElement("div");
  const detail = document.createElement("div");
  detail.style.cssText = "font:400 13px/1.4 'Segoe UI',system-ui,sans-serif;opacity:.75;margin-top:2px";
  text.append(title, detail);
  card.append(dot, text);

  const ring = document.createElement("div");
  ring.style.cssText = "position:absolute;border:3px solid #7c3aed;border-radius:10px;box-shadow:0 0 0 4px rgba(124,58,237,.22),0 0 24px rgba(124,58,237,.45);opacity:0;transition:opacity .12s ease";

  const pointer = document.createElement("div");
  pointer.textContent = "▲";
  pointer.style.cssText = "position:absolute;color:#7c3aed;font-size:14px;text-shadow:0 0 6px #fff,0 0 3px #fff;opacity:0;transition:opacity .12s ease";

  const label = document.createElement("div");
  label.style.cssText = "position:absolute;background:#4c1d95;color:#fff;font:600 12px/1.4 'Segoe UI',system-ui,sans-serif;padding:4px 8px;border-radius:6px;white-space:nowrap;opacity:0;transition:opacity .12s ease;box-shadow:0 4px 14px rgba(0,0,0,.3)";

  root.append(style, card, ring, pointer, label);
  document.documentElement.append(root);

  let targetTimer;
  window.__bbOverlay = {
    target(rect, what) {
      const pad = 6;
      ring.style.left = (rect.x - pad) + "px";
      ring.style.top = (rect.y - pad) + "px";
      ring.style.width = (rect.width + pad * 2) + "px";
      ring.style.height = (rect.height + pad * 2) + "px";
      pointer.style.left = (rect.x + rect.width / 2 - 7) + "px";
      pointer.style.top = (rect.y + rect.height + 4) + "px";
      label.style.left = (rect.x + rect.width / 2 - 40) + "px";
      label.style.top = (rect.y + rect.height + 22) + "px";
      label.textContent = what || "";
      ring.style.opacity = "1"; pointer.style.opacity = "1"; label.style.opacity = "1";
      clearTimeout(targetTimer);
      targetTimer = setTimeout(() => {
        ring.style.opacity = "0"; pointer.style.opacity = "0"; label.style.opacity = "0";
      }, 1400);
    },
    status(what, sub, busy) {
      title.textContent = what || "";
      detail.textContent = sub || "";
      detail.style.display = sub ? "block" : "none";
      dot.style.display = busy ? "block" : "none";
      card.style.opacity = what ? "1" : "0";
    },
  };
})();`;

export function ensureOverlay(s: System): Promise<unknown> {
  return s.page.evaluate(OVERLAY_SCRIPT).catch(() => undefined);
}

/** What the agent is doing, in words, on screen. `busy` shows the pulsing "working" dot. */
export function status(s: System, what: string, sub?: string, busy?: boolean): Promise<unknown> {
  return s.page
    .evaluate(`${OVERLAY_SCRIPT}\n window.__bbOverlay && window.__bbOverlay.status(${JSON.stringify(what)}, ${JSON.stringify(sub ?? "")}, ${busy ? "true" : "false"});`)
    .catch(() => undefined);
}
