import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { Shell } from "../Shell";

export default async function CoursesPage() {
  await requireSession();
  const { courses, items } = readDb();
  return (
    <Shell active="courses">
      <header className="page-head"><h1>Courses</h1></header>
      <div className="course-grid">
        {courses.map((c) => {
          const count = items.filter((i) => i.courseCode === c.courseCode).length;
          return (
            <Link key={c.courseCode} href={`/courses/${c.courseCode}`} className="course-card">
              <div className="course-banner" />
              <div className="course-body">
                <div className="course-code">{c.courseCode}</div>
                <div className="course-title">{c.title}</div>
                <div className="muted">{count === 0 ? "No content yet" : `${count} item(s)`}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </Shell>
  );
}
