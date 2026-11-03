import type { RawModule } from "./schema";

export type Layout = "v1" | "v2";
export const LAYOUTS: readonly Layout[] = ["v1", "v2"];

/** Fake SITS storage (data/sits.json). Records are RawModule because SITS data can be incomplete. */
export interface SitsDb {
  layout: Layout;
  modules: RawModule[];
}

export type Visibility = "hidden" | "visible";

export interface BbCourse {
  courseCode: string;
  title: string;
}

export interface BbItem {
  id: string;
  courseCode: string;
  /** id of the parent folder, or null for top level of the course */
  parentFolder: string | null;
  type: "folder" | "document";
  title: string;
  bodyHtml: string;
  visibility: Visibility;
  createdAt: string;
}

/** Fake Blackboard storage (data/bb.json). */
export interface BbDb {
  layout: Layout;
  courses: BbCourse[];
  items: BbItem[];
}

/** Names the agent creates and verify checks. */
export const BB_STRUCTURE = {
  folder: "Module Information",
  overview: "Module Overview",
  assessments: "Assessment Information",
} as const;
