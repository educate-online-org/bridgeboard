import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { Chrome } from "../Chrome";

export default async function ModulesPage() {
  await requireSession();
  const { layout, modules } = readDb();

  if (layout === "v2") {
    return (
      <Chrome crumb="Curriculum › Modules">
        <h1>Modules ({modules.length})</h1>
        <div className="cards">
          {modules.map((m) => (
            <div className="card" key={m.code}>
              <div className="card-title">
                <Link href={`/modules/${m.code}`}>{m.title}</Link>
              </div>
              <div>Convenor: {m.leader}</div>
              <div>Delivery period: {m.term}</div>
              <div className="muted">Ref: {m.code}</div>
            </div>
          ))}
        </div>
      </Chrome>
    );
  }

  return (
    <Chrome crumb="Home › Module Catalogue">
      <h1>Module Catalogue</h1>
      <table className="grid">
        <thead>
          <tr><th>Module Code</th><th>Module Title</th><th>Term</th><th>Module Leader</th></tr>
        </thead>
        <tbody>
          {modules.map((m) => (
            <tr key={m.code}>
              <td><Link href={`/modules/${m.code}`}>{m.code}</Link></td>
              <td>{m.title}</td>
              <td>{m.term}</td>
              <td>{m.leader}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">{modules.length} record(s) found.</p>
    </Chrome>
  );
}
