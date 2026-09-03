"use client";

import { useEffect, useState } from "react";

/**
 * Field inspector: while ON, hover ANY field on the document — enabled, disabled,
 * native input, custom dropdown, footer total, grid cell — and a floating chip
 * shows its name. That name is the token to use as ":name" in an FMS query.
 *
 * Toggle: the toolbar "Inspect fields" button, or Alt+Shift+I, or Ctrl+Shift+F.
 * Esc turns it off. (Ctrl+Shift+I is the browser DevTools shortcut, not us.)
 */
export function FieldNameInspector() {
  const [active, setActive] = useState(false);
  const [tip, setTip] = useState<{ x: number; y: number; text: string; sub?: string } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const toggle =
        (e.altKey && e.shiftKey && (e.code === "KeyI" || e.key === "I" || e.key === "i")) ||
        (e.ctrlKey && e.shiftKey && (e.code === "KeyF" || e.key === "F" || e.key === "f"));
      if (toggle) {
        e.preventDefault();
        setActive((a) => !a);
        setTip(null);
      } else if (e.key === "Escape") {
        setActive(false);
        setTip(null);
      }
    };
    const onToggleEvent = () => {
      setActive((a) => !a);
      setTip(null);
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("fms:toggle-inspector", onToggleEvent as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("fms:toggle-inspector", onToggleEvent as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!active) return;

    const clean = (s: string | null | undefined) =>
      (s || "").replace(/\s+/g, " ").replace(/\*+$/, "").trim();

    // Visible label for a control: <label for>, wrapping <label>, or a label-ish
    // element sitting just before the control inside the same field wrapper.
    const findLabel = (el: HTMLElement): string => {
      const id = el.getAttribute("id");
      if (id) {
        try {
          const forLbl = document.querySelector(`label[for="${CSS.escape(id)}"]`);
          if (forLbl?.textContent) return clean(forLbl.textContent);
        } catch {
          /* invalid id for selector */
        }
      }
      const wrap = el.closest("label");
      if (wrap?.textContent) return clean(wrap.textContent);
      let node: HTMLElement | null = el;
      for (let i = 0; i < 4 && node; i++) {
        const prev = node.previousElementSibling as HTMLElement | null;
        if (prev) {
          const lbl = prev.matches("label,[data-slot='label'],.label")
            ? prev
            : prev.querySelector("label,[data-slot='label']");
          if (lbl?.textContent) return clean(lbl.textContent);
        }
        node = node.parentElement;
      }
      return "";
    };

    const resolve = (el: HTMLElement): { name: string; sub?: string } | null => {
      // 1. Explicit marker on element or ancestor.
      const marked = el.closest("[data-fms-field]") as HTMLElement | null;
      if (marked?.getAttribute("data-fms-field")) {
        return { name: marked.getAttribute("data-fms-field")!, sub: findLabel(el) || undefined };
      }

      // Nearest actual control (covers custom dropdowns / buttons too).
      const control = el.closest(
        "input,select,textarea,button,[role='combobox'],[contenteditable='true']"
      ) as HTMLElement | null;
      const c = control || el;

      const nm = c.getAttribute("name");
      if (nm) return { name: nm, sub: findLabel(c) || undefined };

      const id = c.getAttribute("id");
      if (id && !/^radix-|^:r|:r[0-9a-z]+:/i.test(id)) {
        return { name: id, sub: findLabel(c) || undefined };
      }

      // 2. Grid cell -> the column's <th data-fms-field> (real key), else header text.
      const cell = c.closest("td");
      const row = c.closest("tr");
      const table = c.closest("table");
      if (cell && row && table) {
        const idx = Array.prototype.indexOf.call(row.children, cell);
        const th = table.querySelectorAll("thead th")[idx] as HTMLElement | undefined;
        if (th) {
          const key = th.getAttribute("data-fms-field");
          return {
            name: key || clean(th.textContent) || "column",
            sub: key ? clean(th.textContent) : "column header",
          };
        }
      }

      // 3. aria.
      const aria = c.getAttribute("aria-label");
      if (aria) return { name: clean(aria), sub: "aria-label" };
      const labelledby = c.getAttribute("aria-labelledby");
      if (labelledby) {
        const lb = document.getElementById(labelledby.split(" ")[0]);
        if (lb?.textContent) return { name: clean(lb.textContent), sub: "label — use the matching field key" };
      }

      // 4. Associated label text.
      const lbl = findLabel(c);
      if (lbl) return { name: lbl, sub: "label — use the matching field key" };

      // 5. placeholder.
      const ph = c.getAttribute("placeholder");
      if (ph) return { name: clean(ph), sub: "placeholder" };

      return null;
    };

    const onMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) {
        setTip(null);
        return;
      }
      const r = resolve(target);
      if (!r || !r.name) {
        setTip(null);
        return;
      }
      setTip({ x: e.clientX + 14, y: e.clientY + 16, text: r.name, sub: r.sub });
    };

    document.addEventListener("mousemove", onMove, true);
    return () => document.removeEventListener("mousemove", onMove, true);
  }, [active]);

  if (!active) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2147483646,
          pointerEvents: "none",
          boxShadow: "inset 0 0 0 3px rgba(37,99,235,.55)",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 8,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2147483647,
          background: "#1e293b",
          color: "#fff",
          fontSize: 12,
          padding: "5px 12px",
          borderRadius: 6,
          boxShadow: "0 4px 16px rgba(0,0,0,.25)",
        }}
      >
        Field Inspector <b>ON</b> — hover any field · <b>Esc</b> / <b>Alt+Shift+I</b> to exit
      </div>
      {tip && (
        <div
          style={{
            position: "fixed",
            left: tip.x,
            top: tip.y,
            zIndex: 2147483647,
            background: "#2563eb",
            color: "#fff",
            fontSize: 12,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            padding: "4px 9px",
            borderRadius: 4,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            boxShadow: "0 2px 10px rgba(0,0,0,.3)",
            lineHeight: 1.3,
          }}
        >
          <span>:{tip.text}</span>
          {tip.sub && (
            <span style={{ display: "block", opacity: 0.7, fontSize: 10 }}>{tip.sub}</span>
          )}
        </div>
      )}
    </>
  );
}

export default FieldNameInspector;
