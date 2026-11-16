"use client";

import { useEffect, useState } from "react";
import { getActiveDimensions, SapDimension } from "@/api+/sap/master-data/distribution/distributionService";

let cachedDimensions: SapDimension[] | null = null;
let pendingLoad: Promise<SapDimension[]> | null = null;

async function loadDimensions(): Promise<SapDimension[]> {
  if (cachedDimensions) return cachedDimensions;
  if (!pendingLoad) {
    pendingLoad = getActiveDimensions()
      .then((dims) => {
        cachedDimensions = dims;
        return cachedDimensions;
      })
      .catch(() => {
        cachedDimensions = [{ DimensionCode: 1, DimensionName: "Dimension 1", IsActive: "tYES", DimensionDescription: "Distribution Rule" }];
        return cachedDimensions;
      });
  }
  return pendingLoad;
}

export function useActiveDimensions(): number[] {
  const [dims, setDims] = useState<number[]>(cachedDimensions?.map((d) => d.DimensionCode) || []);

  useEffect(() => {
    let mounted = true;
    loadDimensions().then((d) => {
      if (mounted) setDims(d.map((dim) => dim.DimensionCode));
    });
    return () => {
      mounted = false;
    };
  }, []);

  return dims;
}

// Code -> real SAP dimension description (e.g. 1 -> "Locations", 2 -> "Departments"),
// for labelling the CostingCode/CostingCode2/... columns and Field Access entries with
// the company's actual dimension names instead of the generic "Distribution Rule N".
export function useDimensionLabels(): Record<number, string> {
  const [labels, setLabels] = useState<Record<number, string>>(
    () => Object.fromEntries((cachedDimensions || []).map((d) => [d.DimensionCode, d.DimensionDescription]))
  );

  useEffect(() => {
    let mounted = true;
    loadDimensions().then((dims) => {
      if (mounted) {
        setLabels(Object.fromEntries(dims.map((d) => [d.DimensionCode, d.DimensionDescription])));
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return labels;
}

export function getDimensionLabelSync(dimensionCode: number): string | undefined {
  return cachedDimensions?.find((d) => d.DimensionCode === dimensionCode)?.DimensionDescription;
}
