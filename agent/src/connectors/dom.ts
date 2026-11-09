// Finding things the way a person does: by what is written on the page. No CSS class selectors,
// no coordinates, no knowledge of which layout is live — only text, labels and roles.
import type { Session } from "../browser";

/** Every element, whether it is visible, what it says, and whether a person can click it. */
const PRELUDE = `
  const els = [...document.body.getElementsByTagName("*")];
  const visible = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
  const says = (e) => ((e.innerText || "") + " " + (e.getAttribute("aria-label") || "") + " " + (e.getAttribute("placeholder") || "")).replace(/\\s+/g, " ").trim();
  const clickable = (e) => ["BUTTON", "A", "INPUT", "TEXTAREA"].includes(e.tagName) || ["button", "link", "menuitem"].includes(e.getAttribute("role") || "");
  const inMenu = (e) => e.getAttribute("role") === "menuitem";
`;

const q = (v: string) => JSON.stringify(v);

/** Click the first clickable thing whose text or label contains `want`. */
export async function clickText(s: Session, want: string): Promise<void> {
  const clicked = await s.page.evaluate(`(() => {${PRELUDE}
    const want = ${q(want)}.toLowerCase();
    const hit = els.find((e) => clickable(e) && visible(e) && says(e).toLowerCase().includes(want));
    if (!hit) return false;
    hit.click();
    return true;
  })()`);
  if (!clicked) throw new Error(`Nothing on the page says “${want}”`);
}

/**
 * Click an entry in the open pop-up menu. With no `want`, clicks the first entry — which is the
 * "Create / Add content" root item in both layouts, so the caller doesn't have to know its label.
 */
export async function clickMenuItem(s: Session, want?: string): Promise<void> {
  const clicked = await s.page.evaluate(`(() => {${PRELUDE}
    const items = els.filter((e) => inMenu(e) && visible(e));
    const hit = ${want === undefined ? "items[0]" : `items.find((e) => says(e).toLowerCase().includes(${q(want)}.toLowerCase()))`};
    if (!hit) return false;
    hit.click();
    return true;
  })()`);
  if (!clicked) throw new Error(`No menu entry${want === undefined ? "" : ` says “${want}”`}`);
}

/** Is this text anywhere on the page (as a person would read it)? */
export function hasText(s: Session, want: string): Promise<boolean> {
  return s.page.evaluate(`document.body.innerText.includes(${q(want)})`);
}

/**
 * Wait for a content row to show up: an element whose text *starts* with the title. Unlike a plain
 * "is this text on the page" check, a toast saying «Folder created: "X"» does not satisfy it, so we
 * wait for the list itself to be re-rendered.
 */
export function waitForRowText(s: Session, want: string, timeout = 20_000): Promise<unknown> {
  return s.page.waitForFunction(
    `(() => {${PRELUDE}
      const want = ${q(want)}.toLowerCase();
      return els.some((e) => visible(e) && (e.innerText || "").trim().toLowerCase().startsWith(want));
    })()`,
    undefined,
    { timeout },
  );
}

export function waitForText(s: Session, want: string, timeout = 20_000): Promise<unknown> {
  return s.page.waitForFunction(`document.body.innerText.includes(${q(want)})`, undefined, { timeout });
}

/** The `aria-expanded` state of the toggle whose label contains `want`; null if there is no such toggle. */
export function isExpanded(s: Session, want: string): Promise<boolean | null> {
  return s.page.evaluate(`(() => {${PRELUDE}
    const hit = els.find((e) => visible(e) && e.getAttribute("aria-expanded") !== null && says(e).toLowerCase().includes(${q(want)}.toLowerCase()));
    return hit ? hit.getAttribute("aria-expanded") === "true" : null;
  })()`);
}

/** Wait until an element with this role is on screen (a side panel or a modal). */
export function waitForRole(s: Session, role: string, timeout = 20_000): Promise<unknown> {
  return s.page.waitForFunction(
    `(() => {${PRELUDE}
      return els.some((e) => e.getAttribute("role") === ${q(role)} && visible(e));
    })()`,
    undefined,
    { timeout },
  );
}

/** Wait until nothing with this role is left on screen. */
export function waitForNoRole(s: Session, role: string, timeout = 20_000): Promise<unknown> {
  return s.page.waitForFunction(
    `(() => {${PRELUDE}
      return !els.some((e) => e.getAttribute("role") === ${q(role)} && visible(e));
    })()`,
    undefined,
    { timeout },
  );
}

/** Put the cursor in the rich text editor (the editable area), ready for typing. */
export async function focusEditor(s: Session, timeout = 20_000): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const ok = await s.page.evaluate(`(() => {${PRELUDE}
      const ed = els.find((e) => visible(e) && e.getAttribute("contenteditable") === "true");
      if (!ed) return false;
      ed.focus();
      ed.click();
      return true;
    })()`);
    if (ok) return;
    await new Promise((r) => setTimeout(r, 250)); // the editor loads after the panel does
  }
  throw new Error("No editable text area appeared");
}
