import { requireSession } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { publishItem } from "../../actions";
import { Shell } from "../../Shell";

// Human approval step: everything the agent creates is hidden until someone publishes it here.
export default async function ReviewPage() {
  await requireSession();
  const { items, courses } = readDb();
  const hidden = items.filter((i) => i.visibility === "hidden").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const courseTitle = (code: string) => courses.find((c) => c.courseCode === code)?.title ?? code;
  const folderTitle = (id: string | null) => (id ? items.find((i) => i.id === id)?.title ?? "?" : "Course Content");

  return (
    <Shell active="review">
      <header className="page-head">
        <h1>Review &amp; publish</h1>
        <p className="muted">Items hidden from students. Check each one, then publish it to make it visible.</p>
      </header>
      {hidden.length === 0 ? (
        <p className="muted empty">Nothing waiting for review.</p>
      ) : (
        <table className="review">
          <thead>
            <tr><th>Course</th><th>Location</th><th>Item</th><th>Created</th><th /></tr>
          </thead>
          <tbody>
            {hidden.map((i) => (
              <tr key={i.id}>
                <td><strong>{i.courseCode}</strong><div className="muted">{courseTitle(i.courseCode)}</div></td>
                <td>{folderTitle(i.parentFolder)}</td>
                <td>
                  {i.type === "folder" ? "📁" : "📄"} {i.title}
                  {i.type === "document" && (
                    <details>
                      <summary>Preview</summary>
                      <div className="doc-body" dangerouslySetInnerHTML={{ __html: i.bodyHtml }} />
                    </details>
                  )}
                </td>
                <td className="muted">{new Date(i.createdAt).toLocaleString("en-GB")}</td>
                <td>
                  <form action={publishItem}>
                    <input type="hidden" name="id" value={i.id} />
                    <button className="primary">Publish</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Shell>
  );
}
