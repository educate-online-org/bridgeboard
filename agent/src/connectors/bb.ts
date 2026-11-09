// Blackboard writer. It never learns which layout is live: text and roles for the stable parts of the
// page, and one natural-language instruction wherever the wording itself changes between layouts
// (the add-content menu, the save button, the confirmation dialog).
import { BB_STRUCTURE, assessmentLines, overviewLines, type Module } from "@bridgeboard/shared";
import { ensure, waitForUrl, type Session } from "../browser";
import { config } from "../config";
import type { RunLog } from "../log";
import { fillField, typeIntoEditor } from "./common";
import { clickMenuItem, clickText, hasText, isExpanded, waitForNoRole, waitForRole, waitForRowText, waitForText } from "./dom";

export type SetUpOutcome = "created" | "skipped";

export async function loginBb(s: Session, log: RunLog) {
  await log.step("Open Blackboard", async () => {
    await s.page.goto(config.bbUrl);
  });
  await log.step("Log in to Blackboard", async () => {
    await fillField(s, "username input on the login form", config.bb.username);
    await fillField(s, "password input on the login form", config.bb.password);
    await clickText(s, "sign in");
    await waitForUrl(s.page, (u) => !u.includes("/login"));
  });
}

export async function openCourse(s: Session, log: RunLog, code: string) {
  await log.step(
    "Open the course in Blackboard",
    async () => {
      await clickText(s, "courses");
      await waitForText(s, code); // the course list has to be on screen before we look for the code
      await clickText(s, code);
      await waitForUrl(s.page, (u) => u.includes(`/courses/${code}`));
    },
    { module: code },
  );
}

/**
 * Create the module's folder and both documents. Idempotent: if "Module Information" is already
 * there the course is skipped, and a document that already exists is not created twice.
 */
export async function setUpCourse(s: Session, log: RunLog, m: Module): Promise<SetUpOutcome> {
  const code = m.code;
  if (await hasText(s, BB_STRUCTURE.folder)) {
    log.info(`  ↷ ${code}: “${BB_STRUCTURE.folder}” already exists, leaving the course alone.`);
    return "skipped";
  }

  await log.step(
    `Create the “${BB_STRUCTURE.folder}” folder`,
    async () => {
      await addContent(s, "at the top level of the course", "Folder");
      await expectPanel(s);
      await fillField(s, "title field of the new content panel", BB_STRUCTURE.folder);
      await save(s);
      await waitForRowText(s, BB_STRUCTURE.folder);
    },
    { module: code, onRetry: () => openCourse(s, log, code) },
  );

  await createDocument(s, log, code, BB_STRUCTURE.overview, overviewLines(m));
  await createDocument(s, log, code, BB_STRUCTURE.assessments, assessmentLines(m));
  return "created";
}

async function createDocument(s: Session, log: RunLog, code: string, title: string, lines: string[]) {
  await log.step(
    `Create the “${title}” document`,
    async () => {
      if (await hasText(s, title)) {
        log.info(`  ↷ “${title}” already exists, not created again.`);
        return;
      }
      await openFolder(s, BB_STRUCTURE.folder);
      await addContent(s, `inside the folder “${BB_STRUCTURE.folder}”`, "Document");
      await expectPanel(s);
      await fillField(s, "title field of the new content panel", title);
      await typeIntoEditor(s, lines);
      await save(s);
      await waitForRowText(s, title);
    },
    { module: code, onRetry: () => openCourse(s, log, code) },
  );
}

// --- steps where the wording changes with the layout: described, not hardcoded --------------------

/**
 * Open the add-content menu and pick a type. The page can still be refreshing after the previous
 * save, in which case the "+" is there but the menu never opens — so check, and ask again once
 * rather than failing the whole step (a step-level retry costs four model calls, this costs one).
 */
async function addContent(s: Session, where: string, type: "Folder" | "Document") {
  for (let attempt = 1; attempt <= 2; attempt++) {
    await openAddMenu(s, where);
    const opened = await waitForRole(s, "menu", 3000).then(() => true, () => false);
    if (opened) {
      await clickMenuItem(s); // the "Create / Add content" root entry, whatever it is called
      await clickMenuItem(s, type);
      return;
    }
  }
  throw new Error(`The add-content menu did not open ${where}`);
}

async function openAddMenu(s: Session, where: string) {
  ensure(await s.stagehand.act(`open the menu for adding new content ${where}`), "open the add-content menu");
}

async function save(s: Session) {
  ensure(await s.stagehand.act("click the button that saves the new content in the panel"), "save");
  ensure(await s.stagehand.act("confirm the dialog to finish adding the content"), "confirm");
  await waitForNoRole(s, "dialog"); // panel and confirmation are both gone: the row is on the page
}

// --- helpers -------------------------------------------------------------------------------------

async function expectPanel(s: Session) {
  await waitForRole(s, "dialog");
}

/** Expand a folder in the content tree, if it isn't open already (aria-expanded says which). */
async function openFolder(s: Session, title: string) {
  const open = await isExpanded(s, title);
  if (open === null) throw new Error(`The folder “${title}” is not in the content list`);
  if (!open) await clickText(s, title);
}
