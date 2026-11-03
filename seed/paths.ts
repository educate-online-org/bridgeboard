import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
export const SITS_DB = join(DATA_DIR, "sits.json");
export const BB_DB = join(DATA_DIR, "bb.json");
