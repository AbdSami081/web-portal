"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useFormContext } from "react-hook-form";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useFmsContext } from "@/hooks/useFMS";

type Anchor = { field: string; top: number; left: number };

function fieldName(el: HTMLElement): string {
  return (
    el.getAttribute("data-fms-field") ||
    el.getAttribute("name") ||
    el.getAttribute("id") ||
    ""
  );
}

/**
 * Makes FMS work from any field: focus a field and press Shift+F2, or click
 * the magnifier that sits on a field which has a saved formatted search.
 */
export function FmsKeyboardBridge() {
  const { hasFMS, runFmsForTarget, fmsConfigs } = useFmsContext();
  const { setValue } = useFormContext();
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [busyField, setBusyField] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.shiftKey && (e.key === "F2" || e.code === "F2"))) return;

      const el = document.activeElement as HTMLElement | null;
      if (!el) return;
      const name = fieldName(el);
      if (!name) return;

      e.preventDefault();
      if (!hasFMS(name)) {
        toast.info(`No formatted search is attached to "${name}".`);
        return;
      }
      void runFmsForTarget(name, undefined, (v) =>
        setValue(name, v, { shouldDirty: true })
      );
    };

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [hasFMS, runFmsForTarget, setValue, fmsConfigs]);

  useEffect(() => {
    const fields = new Set(
      fmsConfigs.map((c) => c.targetField).filter((name) => !!name)
    );
    if (fields.size === 0) {
      setAnchors([]);
      return;
    }

    let frame = 0;
    const place = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const seen = new Set<string>();
        const next: Anchor[] = [];
        const nodes = document.querySelectorAll<HTMLElement>(
          "input[name], textarea[name], select[name], [data-fms-field]"
        );
        nodes.forEach((el) => {
          const name = fieldName(el);
          if (!name || !fields.has(name) || seen.has(name)) return;
          if (el.closest("[data-fms-icon]")) return;
          const rect = el.getBoundingClientRect();
          if (rect.width < 24 || rect.height < 16) return;
          if (rect.bottom < 0 || rect.top > window.innerHeight) return;
          seen.add(name);
          next.push({
            field: name,
            top: rect.top + Math.max(0, (rect.height - 22) / 2),
            left: rect.right - 26,
          });
        });
        setAnchors(next);
      });
    };

    place();
    const observer = new MutationObserver(place);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [fmsConfigs]);

  const run = async (field: string) => {
    if (busyField) return;
    setBusyField(field);
    try {
      await runFmsForTarget(field, undefined, (v) =>
        setValue(field, v, { shouldDirty: true })
      );
    } finally {
      setBusyField(null);
    }
  };

  if (typeof document === "undefined" || anchors.length === 0) return null;

  return createPortal(
    <>
      {anchors.map((anchor) => (
        <button
          key={anchor.field}
          type="button"
          data-fms-icon="1"
          title="Formatted search (Shift+F2)"
          aria-label={`Run formatted search for ${anchor.field}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => void run(anchor.field)}
          style={{ top: anchor.top, left: anchor.left }}
          className="fixed z-30 inline-flex h-[22px] w-[22px] items-center justify-center rounded border border-slate-300 bg-white text-slate-600 shadow-sm hover:border-slate-400 hover:text-slate-900"
        >
          <Search className={`h-3.5 w-3.5 ${busyField === anchor.field ? "animate-pulse" : ""}`} />
        </button>
      ))}
    </>,
    document.body
  );
}

export default FmsKeyboardBridge;
