import type { System } from "../browser";
import { focusEditor } from "./dom";

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
    if (line) await s.page.type(line, { delay: 4 });
    await s.page.keyPress("Enter");
  }
}
