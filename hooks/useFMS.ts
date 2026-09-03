import {
  useEffect,
  useRef,
  useCallback,
  createContext,
  createElement,
  useContext,
  ReactNode,
} from "react";
import { useWatch, UseFormSetValue, Control } from "react-hook-form";
import {
  FmsConfigDto,
  FmsExecuteResult,
  getFmsConfigs,
  executeFmsQuery,
} from "@/api+/sap/fms/fmsService";
import { useFmsStore } from "@/stores/useFmsStore";

interface UseFMSOptions {
  docType: number;
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  getValues: () => Record<string, any>;
  /**
   * Optional: the document's current lines. Used as a fallback line context when
   * a header/UDF-scoped rule references line params (:LineTotal, :Quantity, …) —
   * the FIRST line's values are supplied. Line-triggered rules always override
   * this with their own row.
   */
  getLines?: () => Record<string, any>[];
  onMultipleResults?: (
    rows: Record<string, unknown>[],
    columns: string[],
    targetField: string,
    onSelect: (value: string) => void
  ) => void;
}

export function useFMS({
  docType,
  control,
  setValue,
  getValues,
  getLines,
  onMultipleResults,
}: UseFMSOptions) {
  const { configs, setConfigs } = useFmsStore();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    getFmsConfigs(docType)
      .then((data) => setConfigs(docType, data))
      .catch(() => {});
  }, [docType, setConfigs]);

  const docConfigs: FmsConfigDto[] = configs[docType] ?? [];

  const autoConfigs = docConfigs.filter((c) => c.triggerType === "Auto" && c.triggerField);
  const triggerFieldNames = [...new Set(autoConfigs.map((c) => c.triggerField!))];

  const watchedValues = useWatch({ control, name: triggerFieldNames as any });

  const prevWatchedRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!autoConfigs.length || !triggerFieldNames.length) return;

    const current: Record<string, any> = {};
    triggerFieldNames.forEach((name, i) => {
      current[name] = Array.isArray(watchedValues) ? watchedValues[i] : watchedValues;
    });

    // Find which trigger fields actually changed
    const changedFields = triggerFieldNames.filter(
      (name) => current[name] !== prevWatchedRef.current[name] && current[name] !== undefined
    );

    if (!changedFields.length) return;
    prevWatchedRef.current = current;

    const relevantConfigs = autoConfigs.filter((c) => changedFields.includes(c.triggerField!));
    if (!relevantConfigs.length) return;

    const formContext = flattenFormContext(getValues());

    relevantConfigs.forEach(async (config) => {
      await runQuery(config, formContext, setValue, onMultipleResults);
    });
  }, [watchedValues]); 

  /**
   * Run the FMS rule for `targetField`.
   * - `extraContext` is merged on top of the header form values (use it to pass a line row).
   * - `apply` overrides where the result goes; default writes to the RHF field.
   */
  const runFmsForTarget = useCallback(
    async (
      targetField: string,
      extraContext?: Record<string, string>,
      apply?: (value: string) => void
    ) => {
      const config = docConfigs.find((c) => c.targetField === targetField);
      if (!config) return;

      // Base = first line (so header/UDF rules can still read :LineTotal, :Quantity…),
      // then header form values, then the explicit row context from a line trigger.
      const firstLine = getLines?.()[0];
      const formContext = {
        ...(firstLine ? flattenFormContext(firstLine) : {}),
        ...flattenFormContext(getValues()),
        ...(extraContext ?? {}),
      };

      const setter =
        apply ?? ((v: string) => setValue(targetField, v, { shouldDirty: true }));

      try {
        const result: FmsExecuteResult = await executeFmsQuery({
          docType: config.docType,
          code: config.code,
          targetField,
          formContext,
        });
        if (!result.success) return;

        if (result.value !== undefined && result.value !== null) {
          setter(result.value);
        } else if (result.rows && result.rows.length > 0 && onMultipleResults) {
          onMultipleResults(result.rows, result.columns ?? [], targetField, (selected) =>
            setter(selected)
          );
        }
      } catch {
        // silent
      }
    },
    [docConfigs, getValues, getLines, setValue, onMultipleResults]
  );

  const triggerFMS = useCallback(
    (targetField: string) => runFmsForTarget(targetField),
    [runFmsForTarget]
  );

  return {
    fmsConfigs: docConfigs,
    hasFMS: (fieldName: string) => docConfigs.some((c) => c.targetField === fieldName),
    triggerFMS,
    runFmsForTarget,
  };
}

// ─── Context: expose hasFMS / triggerFMS to nested field components ────────────

export interface FmsContextValue {
  fmsConfigs: FmsConfigDto[];
  hasFMS: (fieldName: string) => boolean;
  triggerFMS: (targetField: string) => Promise<void>;
  runFmsForTarget: (
    targetField: string,
    extraContext?: Record<string, string>,
    apply?: (value: string) => void
  ) => Promise<void>;
}

const FmsContext = createContext<FmsContextValue | null>(null);

export function FmsProvider({
  value,
  children,
}: {
  value: FmsContextValue;
  children: ReactNode;
}) {
  return createElement(FmsContext.Provider, { value }, children);
}

const NOOP_FMS: FmsContextValue = {
  fmsConfigs: [],
  hasFMS: () => false,
  triggerFMS: async () => {},
  runFmsForTarget: async () => {},
};

export function useFmsContext(): FmsContextValue {
  return useContext(FmsContext) ?? NOOP_FMS;
}

function flattenFormContext(values: Record<string, any>): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const [key, val] of Object.entries(values)) {
    if (val !== null && val !== undefined && typeof val !== "object") {
      flat[key] = String(val);
    }
  }
  return flat;
}

async function runQuery(
  config: FmsConfigDto,
  formContext: Record<string, string>,
  setValue: UseFormSetValue<any>,
  onMultipleResults?: UseFMSOptions["onMultipleResults"]
) {
  try {
    const result: FmsExecuteResult = await executeFmsQuery({
      docType: config.docType,
      code: config.code,
      targetField: config.targetField,
      formContext,
    });

    if (!result.success) return;

    if (result.value !== undefined && result.value !== null) {
      setValue(config.targetField, result.value, { shouldDirty: true });
    } else if (result.rows && result.rows.length > 0 && onMultipleResults) {
      onMultipleResults(result.rows, result.columns ?? [], config.targetField, (selected) => {
        setValue(config.targetField, selected, { shouldDirty: true });
      });
    }
  } catch {
    // Silent fail for auto-refresh
  }
}
