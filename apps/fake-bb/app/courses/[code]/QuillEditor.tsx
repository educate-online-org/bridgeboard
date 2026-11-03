"use client";

import { useEffect, useRef } from "react";
import "quill/dist/quill.snow.css";

/**
 * Quill rich text editor. Typing shortcuts available to the agent:
 *  - "- " or "* " at line start  → bullet list (Quill built-in)
 *  - "1. " at line start         → numbered list (Quill built-in)
 *  - "# ", "## ", "### "          → heading 1/2/3 (added here)
 *  - Ctrl/Cmd+B                  → bold (Quill built-in)
 *  - Enter on an empty list item or after a heading returns to normal text (Quill built-in)
 */
export function QuillEditor({ label, onChange }: { label: string; onChange: (html: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const changeRef = useRef(onChange);
  changeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;
    const el = host.current!;
    import("quill").then(({ default: Quill }) => {
      if (cancelled) return;
      el.innerHTML = "";
      const mount = document.createElement("div");
      el.appendChild(mount);
      const quill = new Quill(mount, {
        theme: "snow",
        placeholder: "Start typing…",
        modules: {
          toolbar: [[{ header: [1, 2, 3, false] }], ["bold", "italic"], [{ list: "bullet" }, { list: "ordered" }]],
          keyboard: {
            bindings: {
              markdownHeader: {
                key: " ",
                collapsed: true,
                prefix: /^#{1,3}$/,
                handler(this: { quill: InstanceType<typeof Quill> }, range: { index: number }, context: { prefix: string }) {
                  const level = context.prefix.length;
                  const start = range.index - level;
                  this.quill.deleteText(start, level, "user");
                  this.quill.formatLine(start, 1, "header", level, "user");
                  return false;
                },
              },
            },
          },
        },
      });
      quill.root.setAttribute("aria-label", label);
      quill.root.setAttribute("role", "textbox");
      quill.root.setAttribute("aria-multiline", "true");
      quill.on("text-change", () => {
        changeRef.current(quill.getText().trim() ? quill.getSemanticHTML().replace(/&nbsp;/g, " ") : "");
      });
    });
    return () => {
      cancelled = true;
      el.innerHTML = "";
    };
  }, [label]);

  return <div className="editor" ref={host} />;
}
