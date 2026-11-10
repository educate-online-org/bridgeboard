import type { System } from "../browser";
import { editorText, focusEditor } from "./dom";

/**
 * Fill a form field found by natural-language description. observe() returns the element's selector
 * at run time (nothing hardcoded), and the value is typed locally, so secrets never reach the model.
 */
export async function fillField(s: System, description: string, value: string) {
  const { data } = await s.stagehand.observe(`find the ${description}`);
  const target = data[0];
  if (!target) throw new Error(`Could not find the ${description}`);
  await s.page.locator(target.selector).fill(value);
}

/**
 * Type formatted text into the rich text editor, one line at a time, so Quill's own shortcuts do the
 * formatting ("- " starts a bullet, Enter ends the list). No HTML is pasted.
 * An empty line is a paragraph break.
 */
export async function typeIntoEditor(s: System, lines: string[]) {
  await focusEditor(s);
  for (const line of lines) {
    if (line) await typeLine(s, line);
    await s.page.keyPress("Enter");
  }
}

/**
 * Type one line and make sure all of it arrived *before* pressing Enter. Keyboard injection can
 * return slightly before the page has applied the last characters — a live probe caught a learning
 * outcome stored as "…affect consistency and pe", so the tail of the line is re-typed if needed.
 */
async function typeLine(s: System, line: string) {
  await s.page.type(line, { delay: 4 });
  for (let attempt = 1; attempt <= 3; attempt++) {
    const text = await editorText(s);
    const start = text.lastIndexOf(line.slice(0, Math.min(12, line.length)));
    const typed = start >= 0 ? text.slice(start) : "";
    if (typed === line) return;
    if (!line.startsWith(typed)) throw new Error(`Typed text diverged: “${typed.slice(0, 40)}”`);
    await s.page.type(line.slice(typed.length), { delay: 4 }); // type only what is missing
  }
  throw new Error(`Could not type the whole line: “${line.slice(0, 40)}…”`);
}
