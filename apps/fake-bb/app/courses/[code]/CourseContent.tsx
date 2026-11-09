"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { BbCourse, BbItem, Layout, Visibility } from "@bridgeboard/shared";
import { createItem, setVisibility } from "../../actions";
import { QuillEditor } from "./QuillEditor";

type ItemType = BbItem["type"];
type Panel = { mode: "create"; type: ItemType; parent: BbItem | null } | { mode: "view"; item: BbItem };

// All wording that differs between layouts lives here.
const TEXT = {
  v1: {
    menuRoot: "Create", plusLabel: "Create content", folderPlusLabel: "Create content in folder",
    newTitle: (t: ItemType) => (t === "document" ? "New Document" : "New Folder"),
    titleLabel: "Title", bodyLabel: "Content", visLabel: "Visibility",
    save: "Save", cancel: "Cancel",
    confirmTitle: "Save changes?", confirmYes: "Confirm", confirmNo: "Cancel",
    toast: (t: ItemType) => (t === "document" ? "Document created" : "Folder created"),
  },
  v2: {
    menuRoot: "Add content", plusLabel: "Add content", folderPlusLabel: "Add content to this folder",
    newTitle: (t: ItemType) => (t === "document" ? "Add a document" : "Add a folder"),
    titleLabel: "Name", bodyLabel: "Document text", visLabel: "Student access",
    save: "Done", cancel: "Discard",
    confirmTitle: "Ready to add this content?", confirmYes: "Yes, add it", confirmNo: "Go back",
    toast: () => "Content added",
  },
} as const;

const VIS_TEXT: Record<Visibility, string> = { hidden: "Hidden from students", visible: "Visible to students" };
const VIS_OPTIONS: Visibility[] = ["visible", "hidden"];

// Real Ultra shows a one-line summary under the title; ours comes from the document body.
const summary = (item: BbItem) =>
  item.bodyHtml
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 110);

const delay = () => new Promise((r) => setTimeout(r, 300 + Math.random() * 500));

export function CourseContent({ course, items, layout }: { course: BbCourse; items: BbItem[]; layout: Layout }) {
  const t = TEXT[layout];
  const router = useRouter();
  const [menuFor, setMenuFor] = useState<{ parent: BbItem | null; step: 1 | 2 } | null>(null);
  const [visFor, setVisFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  async function changeVisibility(id: string, visibility: Visibility) {
    setVisFor(null);
    const res = await setVisibility({ id, visibility });
    if (res.ok) router.refresh();
    else setToast(res.error);
  }

  async function openPanel(next: Panel) {
    setMenuFor(null);
    setPanel(null);
    setLoading(true);
    await delay(); // realistic friction: panels take a moment to load
    setLoading(false);
    setPanel(next);
  }

  const toggle = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const children = (parent: string | null) => items.filter((i) => i.parentFolder === parent);

  const addMenu = (parent: BbItem | null) =>
    menuFor && menuFor.parent?.id === parent?.id ? (
      <div className="menu" role="menu">
        {menuFor.step === 1 ? (
          <button role="menuitem" onClick={() => setMenuFor({ parent, step: 2 })}>
            {t.menuRoot} ›
          </button>
        ) : (
          <>
            <div className="menu-head">{t.menuRoot}</div>
            <button role="menuitem" onClick={() => openPanel({ mode: "create", type: "document", parent })}>Document</button>
            <button role="menuitem" onClick={() => openPanel({ mode: "create", type: "folder", parent })}>Folder</button>
          </>
        )}
      </div>
    ) : null;

  const plusButton = (parent: BbItem | null, label: string) => (
    <span className="plus-wrap">
      <button
        className="plus"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        onClick={() => setMenuFor(menuFor && menuFor.parent?.id === parent?.id ? null : { parent, step: 1 })}
      >
        +
      </button>
      {addMenu(parent)}
    </span>
  );

  // A render function (not a component) so rows aren't remounted on every state change.
  const renderRow = (item: BbItem) => {
    const isOpen = expanded.has(item.id);
    return (
      <li className="row" key={item.id}>
        <div className="row-main">
          <span className="grip" aria-hidden>⋮⋮</span>
          <span className={`icon ${item.type}`} aria-hidden>{item.type === "folder" ? "📁" : "📄"}</span>
          <div className="row-text">
            {item.type === "folder" ? (
              <button className="row-title" aria-expanded={isOpen} onClick={() => toggle(item.id)}>
                {item.title} <span className="chev">{isOpen ? "▾" : "▸"}</span>
              </button>
            ) : (
              <button className="row-title" onClick={() => openPanel({ mode: "view", item })}>{item.title}</button>
            )}
            {summary(item) && <div className="row-sub muted">{summary(item)}</div>}
          </div>
          {/* Visibility is set on the row, like Ultra, not only in the create panel. */}
          <span className="vis-wrap">
            <button
              className={`badge badge-btn ${item.visibility}`}
              aria-haspopup="menu"
              aria-expanded={visFor === item.id}
              title={t.visLabel}
              onClick={() => setVisFor(visFor === item.id ? null : item.id)}
            >
              {VIS_TEXT[item.visibility]} <span aria-hidden>▾</span>
            </button>
            {visFor === item.id && (
              <div className="vis-menu" role="menu">
                <div className="menu-head">{t.visLabel}</div>
                {VIS_OPTIONS.map((v) => (
                  <button
                    key={v}
                    role="menuitemradio"
                    aria-checked={item.visibility === v}
                    disabled={item.visibility === v}
                    onClick={() => changeVisibility(item.id, v)}
                  >
                    {VIS_TEXT[v]}
                  </button>
                ))}
              </div>
            )}
          </span>
          {layout === "v2" && item.type === "folder" && plusButton(item, t.folderPlusLabel)}
        </div>
        {item.type === "folder" && isOpen && (
          <div className="folder-body">
            {layout === "v1" && <div className="plus-line">{plusButton(item, t.folderPlusLabel)}</div>}
            <ul>
              {children(item.id).map(renderRow)}
            </ul>
            {children(item.id).length === 0 && <p className="muted empty">This folder is empty.</p>}
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="course">
      <header className="course-head">
        <div>
          <div className="course-code">{course.courseCode}</div>
          <h1>{course.title}</h1>
        </div>
        <div className="head-actions">
          {/* Chrome only: nothing behind these, they are here to look like Ultra. */}
          <span className="chrome-link">👁 Student Preview</span>
          <span className="chrome-link">⚙ Course Settings</span>
          {layout === "v2" && plusButton(null, t.plusLabel)}
        </div>
      </header>
      <nav className="tabs">
        <span className="on">Content</span>
        <span>Calendar</span>
        <span>Announcements</span>
        <span>Discussions</span>
        <span>Gradebook</span>
        <span>Messages</span>
        <span>Analytics</span>
        <span>Groups</span>
      </nav>

      <section className="content">
        <h2 className="content-head">Course Content</h2>
        {layout === "v1" && <div className="plus-line">{plusButton(null, t.plusLabel)}</div>}
        <ul>
          {children(null).map(renderRow)}
        </ul>
        {items.length === 0 && <p className="muted empty">No course content yet.</p>}
      </section>

      {loading && (
        <div className="spinner-overlay" role="status" aria-label="Loading">
          <div className="spinner" />
        </div>
      )}

      {panel?.mode === "create" && (
        <CreatePanel
          key={`${panel.type}-${panel.parent?.id ?? "root"}`}
          layout={layout}
          type={panel.type}
          parent={panel.parent}
          courseCode={course.courseCode}
          onClose={() => setPanel(null)}
          onCreated={(title) => {
            setPanel(null);
            setToast(`${t.toast(panel.type)}: “${title}”`);
            router.refresh();
          }}
        />
      )}

      {panel?.mode === "view" && (
        <aside className="panel" aria-label={panel.item.title}>
          <header className="panel-head">
            <h2>{panel.item.title}</h2>
            <button className="close" aria-label="Close" onClick={() => setPanel(null)}>×</button>
          </header>
          <div className="panel-body">
            <span className={`badge ${panel.item.visibility}`}>{VIS_TEXT[panel.item.visibility]}</span>
            <div className="doc-body" dangerouslySetInnerHTML={{ __html: panel.item.bodyHtml }} />
          </div>
        </aside>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function CreatePanel(props: {
  layout: Layout;
  type: ItemType;
  parent: BbItem | null;
  courseCode: string;
  onClose: () => void;
  onCreated: (title: string) => void;
}) {
  const { layout, type, parent, courseCode } = props;
  const t = TEXT[layout];
  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("hidden");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const where = parent ? `the folder “${parent.title}”` : "Course Content";

  async function save() {
    setSaving(true);
    const res = await createItem({ courseCode, parentFolder: parent?.id ?? null, type, title, bodyHtml: html, visibility });
    setSaving(false);
    setConfirming(false);
    if (res.ok) props.onCreated(title.trim());
    else setError(res.error);
  }

  const fields = {
    title: (
      <label className="field" key="title">
        {t.titleLabel}
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
    ),
    body:
      type === "document" ? (
        <div className="field" key="body">
          <span>{t.bodyLabel}</span>
          <QuillEditor label={t.bodyLabel} onChange={setHtml} />
        </div>
      ) : null,
    visibility: (
      <label className="field" key="vis">
        {t.visLabel}
        <select value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility)}>
          <option value="hidden">{VIS_TEXT.hidden}</option>
          <option value="visible">{VIS_TEXT.visible}</option>
        </select>
      </label>
    ),
  };
  const order = layout === "v1" ? [fields.title, fields.body, fields.visibility] : [fields.visibility, fields.title, fields.body];

  const saveBtn = (
    <button
      key="save"
      className="primary"
      onClick={() => {
        if (!title.trim()) return setError(`${t.titleLabel} is required.`);
        setError(null);
        setConfirming(true);
      }}
    >
      {t.save}
    </button>
  );
  const cancelBtn = <button key="cancel" onClick={props.onClose}>{t.cancel}</button>;

  return (
    <aside className="panel" aria-label={t.newTitle(type)}>
      <header className="panel-head">
        <h2>{t.newTitle(type)}</h2>
        <button className="close" aria-label="Close" onClick={props.onClose}>×</button>
      </header>
      <div className="panel-body">
        <p className="muted">Location: {where}</p>
        {order}
        {error && <p className="error">{error}</p>}
      </div>
      <footer className="panel-foot">{layout === "v1" ? [cancelBtn, saveBtn] : [saveBtn, cancelBtn]}</footer>

      {confirming && (
        <div className="modal-backdrop">
          <div className="modal" role="dialog" aria-modal="true" aria-label={t.confirmTitle}>
            <h3>{t.confirmTitle}</h3>
            <p>
              “{title.trim()}” will be added to {where}. Visibility: <strong>{VIS_TEXT[visibility]}</strong>.
            </p>
            <div className="modal-actions">
              <button onClick={() => setConfirming(false)} disabled={saving}>{t.confirmNo}</button>
              <button className="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : t.confirmYes}</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
