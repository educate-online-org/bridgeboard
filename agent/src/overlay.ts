// Demo affordance: draws a ring, a pointer and a caption over the page so a screen recording shows
// what the agent is doing. The agent never moves the real mouse (it dispatches events), so without
// this the recording looks like nothing is happening.
//
// Everything drawn is aria-hidden, so it stays out of the accessibility tree that goes to the model.
// That is the one thing to keep true: an overlay the model can see would change its behaviour.
import type { System } from "./browser";

/** Injected on demand. Guarded, so calling it twice is harmless. */
export const OVERLAY_SCRIPT = `(() => {
  if (window.__bbOverlay) return;
  const root = document.createElement("div");
  root.id = "bb-overlay";
  root.setAttribute("aria-hidden", "true");
  root.setAttribute("role", "presentation");
  root.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483647";

  const ring = document.createElement("div");
  ring.style.cssText = "position:absolute;border:3px solid #7c3aed;border-radius:10px;box-shadow:0 0 0 4px rgba(124,58,237,.22),0 0 24px rgba(124,58,237,.45);opacity:0;transition:opacity .12s ease";

  const pointer = document.createElement("div");
  pointer.textContent = "▲";
  pointer.style.cssText = "position:absolute;color:#7c3aed;font-size:14px;text-shadow:0 0 6px #fff,0 0 3px #fff;opacity:0;transition:opacity .12s ease";

  const label = document.createElement("div");
  label.style.cssText = "position:absolute;background:#4c1d95;color:#fff;font:600 12px/1.4 'Segoe UI',system-ui,sans-serif;padding:4px 8px;border-radius:6px;white-space:nowrap;opacity:0;transition:opacity .12s ease;box-shadow:0 4px 14px rgba(0,0,0,.3)";

  const caption = document.createElement("div");
  caption.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:20px;background:rgba(17,17,20,.92);color:#fff;font:500 14px/1.45 'Segoe UI',system-ui,sans-serif;padding:10px 16px;border-radius:10px;max-width:80vw;text-align:center;opacity:0;transition:opacity .15s ease;box-shadow:0 8px 30px rgba(0,0,0,.35)";

  root.append(ring, pointer, label, caption);
  document.documentElement.append(root);

  let pulseTimer;
  window.__bbOverlay = {
    target(rect, text) {
      const pad = 6;
      ring.style.left = (rect.x - pad) + "px";
      ring.style.top = (rect.y - pad) + "px";
      ring.style.width = (rect.width + pad * 2) + "px";
      ring.style.height = (rect.height + pad * 2) + "px";
      pointer.style.left = (rect.x + rect.width / 2 - 7) + "px";
      pointer.style.top = (rect.y + rect.height + 4) + "px";
      label.style.left = (rect.x + rect.width / 2 - 40) + "px";
      label.style.top = (rect.y + rect.height + 22) + "px";
      label.textContent = text || "";
      ring.style.opacity = "1"; pointer.style.opacity = "1"; label.style.opacity = "1";
      clearTimeout(pulseTimer);
      const move = () => {
        ring.style.opacity = "0"; pointer.style.opacity = "0"; label.style.opacity = "0";
      };
      pulseTimer = setTimeout(move, 1400);
    },
    caption(text) {
      caption.textContent = text || "";
      caption.style.opacity = text ? "1" : "0";
    },
  };
})();`;

/** Put the overlay on the current page (after a navigation, it is gone again). */
export function ensureOverlay(s: System): Promise<unknown> {
  return s.page.evaluate(OVERLAY_SCRIPT).catch(() => undefined);
}

/** Show a description of the current step, bottom centre, over the page. */
export function caption(s: System, text: string): Promise<unknown> {
  return s.page
    .evaluate(`${OVERLAY_SCRIPT}\n window.__bbOverlay && window.__bbOverlay.caption(${JSON.stringify(text)});`)
    .catch(() => undefined);
}
