import { notFound } from "next/navigation";
import type { RawModule } from "@bridgeboard/shared";
import { requireSession } from "@/lib/auth";
import { getLayout, getModule } from "@/lib/db";
import { dateV1, dateV2 } from "@/lib/format";
import { Chrome } from "../../Chrome";

export default async function ModulePage({ params }: { params: Promise<{ code: string }> }) {
  await requireSession();
  const { code } = await params;
  const m = getModule(code);
  if (!m) notFound();
  return getLayout() === "v2" ? <DetailV2 m={m} /> : <DetailV1 m={m} />;
}

// Missing values are shown as blanks, the way a records system would: nothing is filled in.
const show = (v: string | number | null) => (v === null ? "" : String(v));

function DetailV1({ m }: { m: RawModule }) {
  return (
    <Chrome crumb={`Home › Module Catalogue › ${m.code}`}>
      <h1>Module Details: {m.code}</h1>
      <table className="form">
        <tbody>
          <tr><th>Module Code</th><td>{show(m.code)}</td><th>Level</th><td>{show(m.level)}</td></tr>
          <tr><th>Module Title</th><td>{show(m.title)}</td><th>Credits</th><td>{show(m.credits)}</td></tr>
          <tr><th>Term</th><td>{show(m.term)}</td><th>Module Leader</th><td>{show(m.leader)}</td></tr>
          <tr><th>Description</th><td colSpan={3}>{show(m.description)}</td></tr>
        </tbody>
      </table>

      <h2>Learning Outcomes</h2>
      {m.learningOutcomes.length === 0 ? (
        <p className="muted">No records found.</p>
      ) : (
        <table className="grid">
          <thead><tr><th>No.</th><th>Outcome</th></tr></thead>
          <tbody>
            {m.learningOutcomes.map((o, i) => (
              <tr key={i}><td>LO{i + 1}</td><td>{o}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Assessment</h2>
      <table className="grid">
        <thead><tr><th>Seq</th><th>Assessment Name</th><th>Type</th><th>Weighting</th><th>Due Date</th></tr></thead>
        <tbody>
          {m.assessments.map((a, i) => (
            <tr key={i}>
              <td>{String(i + 1).padStart(3, "0")}</td>
              <td>{show(a.name)}</td>
              <td>{show(a.type)}</td>
              <td>{a.weightPercent === null ? "" : `${a.weightPercent}%`}</td>
              <td>{dateV1(a.dueDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Chrome>
  );
}

function DetailV2({ m }: { m: RawModule }) {
  return (
    <Chrome crumb={`Curriculum › Modules › ${m.title}`}>
      <h1>{m.title}</h1>
      <p className="muted">Module ref {m.code}</p>

      <section className="panel">
        <h2>Synopsis</h2>
        <p>{show(m.description)}</p>
      </section>

      <section className="panel facts">
        <div><span className="label">Convenor</span>{show(m.leader)}</div>
        <div><span className="label">Delivery Period</span>{show(m.term)}</div>
        <div><span className="label">Credit Value</span>{show(m.credits)}</div>
        <div><span className="label">FHEQ Level</span>{show(m.level)}</div>
      </section>

      <section className="panel">
        <h2>Assessment Components</h2>
        <div className="cards">
          {m.assessments.map((a, i) => (
            <div className="card" key={i}>
              <div className="card-title">{show(a.name)}</div>
              <div><span className="label">% of Module</span>{show(a.weightPercent)}</div>
              <div><span className="label">Submission</span>{dateV2(a.dueDate)}</div>
              <div><span className="label">Method</span>{show(a.type)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Intended Learning Outcomes</h2>
        {m.learningOutcomes.length === 0 ? (
          <p className="muted">None recorded.</p>
        ) : (
          <ol>
            {m.learningOutcomes.map((o, i) => <li key={i}>{o}</li>)}
          </ol>
        )}
      </section>
    </Chrome>
  );
}
