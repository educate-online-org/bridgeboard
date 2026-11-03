import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { Shell } from "../../Shell";
import { CourseContent } from "./CourseContent";

export default async function CoursePage({ params }: { params: Promise<{ code: string }> }) {
  await requireSession();
  const { code } = await params;
  const db = readDb();
  const course = db.courses.find((c) => c.courseCode === code);
  if (!course) notFound();
  const items = db.items
    .filter((i) => i.courseCode === code)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return (
    <Shell active="courses">
      <CourseContent course={course} items={items} layout={db.layout} />
    </Shell>
  );
}
