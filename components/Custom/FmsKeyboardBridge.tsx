"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { useFmsContext } from "@/hooks/useFMS";

/**
 * Makes FMS work from ANY field, with zero per-field wiring:
 * focus a field and press Shift+F2. The focused element's `name` / `id` /
 * `data-fms-field` is looked up against the configured FMS rules; if one matches
 * its query runs and the result is written back to that form field.
 *
 * Mount once inside each document layout (within FmsProvider + FormProvider).
 */
export function FmsKeyboardBridge() {
  const { hasFMS, runFmsForTarget, fmsConfigs } = useFmsContext();
  const { setValue } = useFormContext();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.shiftKey && (e.key === "F2" || e.code === "F2"))) return;

      const el = document.activeElement as HTMLElement | null;
      if (!el) return;
      const name =
        el.getAttribute("data-fms-field") ||
        el.getAttribute("name") ||
        el.getAttribute("id") ||
        "";
      if (!name) return;

      e.preventDefault();
      if (!hasFMS(name)) {
        toast.info(`No FMS rule is attached to "${name}".`);
        return;
      }
      void runFmsForTarget(name, undefined, (v) =>
        setValue(name, v, { shouldDirty: true })
      );
    };

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [hasFMS, runFmsForTarget, setValue, fmsConfigs]);

  return null;
}

export default FmsKeyboardBridge;
