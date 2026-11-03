import type { Session } from "../browser";

/**
 * Fill a form field found by natural-language description. observe() returns the element's selector
 * at run time (nothing hardcoded), and the value is typed locally, so secrets never reach the model.
 */
export async function fillField(s: Session, description: string, value: string) {
  const { data } = await s.stagehand.observe(`find the ${description}`);
  const target = data[0];
  if (!target) throw new Error(`Could not find the ${description}`);
  await s.page.locator(target.selector).fill(value);
}
