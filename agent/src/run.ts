// pnpm agent:run [--module CODE]
// Read every module from SITS, validate it, then set up the matching BB course. Nothing is created
// for a module that fails validation, and a failure part-way through leaves what was created behind
// (hidden) and marks the module failed.
// SITS and Blackboard run side by side in two windows, so the demo never loses sight of either.
import { validateModule, type Module, type RawModule } from "@bridgeboard/shared";
import { openSession } from "./browser";
import { config } from "./config";
import { loginBb, openCourse, setUpCourse } from "./connectors/bb";
import { listModuleCodes, loginSits, readModule } from "./connectors/sits";
import { RunLog, isFatal, message } from "./log";

const args = process.argv.slice(2);
const only = args.includes("--module") ? args[args.indexOf("--module") + 1] : undefined;

const log = new RunLog({ model: config.modelName, sitsUrl: config.sitsUrl, bbUrl: config.bbUrl, module: only ?? "all" });
const session = await openSession();
const { sits, bb } = session;

/** A module that passed validation, with the extraction metadata the log wants. */
interface Ready {
  module: Module;
  extracted: RawModule;
  extractedWith: "page" | "page+screenshot";
}

try {
  log.info(`SITS → BB transfer (model ${config.modelName}${only ? `, module ${only}` : ""})\n`);

  // 1. Read and validate everything first: a bad module must never leave half a course behind.
  await Promise.all([loginSits(sits, log), loginBb(bb, log)]);
  const codes = only ? [only] : await listModuleCodes(sits, log);
  log.info(`\nModules to process: ${codes.join(", ")}\n`);

  const ready: Ready[] = [];
  for (const code of codes) {
    try {
      const { raw, method } = await readModule(sits, log, code);
      const result = validateModule(raw);
      if (result.ok) {
        ready.push({ module: result.module, extracted: raw, extractedWith: method });
        log.setModule(code, { status: "valid", flags: [], extracted: raw, extractedWith: method });
      } else {
        log.flag(code, result.flags, { extracted: raw, extractedWith: method });
      }
    } catch (err) {
      if (isFatal(err)) throw err; // account problem: stop the run, don't fail every module
      log.setModule(code, { status: "failed", flags: [], error: message(err) });
    }
  }

  // 2. Write to Blackboard, one course at a time.
  if (ready.length > 0) log.info(`\nSetting up ${ready.length} course(s) in Blackboard\n`);
  for (const { module } of ready) {
    const code = module.code;
    try {
      await openCourse(bb, log, code);
      const outcome = await setUpCourse(bb, log, module);
      const previous = log.modules[code] ?? { status: "valid" as const, flags: [] };
      log.setModule(code, { ...previous, status: outcome === "skipped" ? "skipped" : "created" });
    } catch (err) {
      if (isFatal(err)) throw err;
      // Content created so far stays (it is hidden); the module is reported as failed.
      const previous = log.modules[code] ?? { status: "valid" as const, flags: [] };
      log.setModule(code, { ...previous, status: "failed", error: message(err) });
    }
  }
} catch (err) {
  log.info(`\nRun aborted: ${message(err)}`);
  process.exitCode = 1;
} finally {
  log.summary();
  console.log(`\nRun log: ${log.save(config.runsDir)}`);
  await session.close();
}
