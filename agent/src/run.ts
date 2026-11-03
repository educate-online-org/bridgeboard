// pnpm agent:run [--module CODE]
// Milestone 4: log into SITS, read every module, validate. BB writing comes in milestone 5.
import { validateModule } from "@bridgeboard/shared";
import { openSession } from "./browser";
import { config } from "./config";
import { listModuleCodes, loginSits, readModule } from "./connectors/sits";
import { RunLog, message } from "./log";

const args = process.argv.slice(2);
const only = args.includes("--module") ? args[args.indexOf("--module") + 1] : undefined;

const log = new RunLog({ model: config.modelName, sitsUrl: config.sitsUrl, bbUrl: config.bbUrl, module: only ?? "all" });
const session = await openSession();

try {
  log.info(`SITS → BB transfer (model ${config.modelName}${only ? `, module ${only}` : ""})\n`);
  await loginSits(session, log);
  const codes = only ? [only] : await listModuleCodes(session, log);
  log.info(`\nModules to process: ${codes.join(", ")}\n`);

  for (const code of codes) {
    try {
      const { raw, method } = await readModule(session, log, code);
      const result = validateModule(raw);
      if (result.ok) log.setModule(code, { status: "valid", flags: [], extracted: raw, extractedWith: method });
      else log.flag(code, result.flags, { extracted: raw, extractedWith: method });
    } catch (err) {
      log.setModule(code, { status: "failed", flags: [], error: message(err) });
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
