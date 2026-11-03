# verify

Compares the fake SITS DB (ground truth) directly against the fake BB DB, never the agent's extracted data.

Per module: folder + both documents exist, all fields correct, all outcomes/assessments present, visibility Hidden.
Output: console table (✅/❌ per check), summary (e.g. "3/3 modules matched, 1 flagged and skipped"), and an HTML report for the demo.
