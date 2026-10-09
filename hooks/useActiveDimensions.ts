"use client";

import { useEffect, useState } from "react";
import { getActiveDimensions } from "@/api+/sap/master-data/distribution/distributionService";

let cachedActiveDimensions: number[] | null = null;
let pendingLoad: Promise<number[]> | null = null;

async function loadActiveDimensions(): Promise<number[]> {
  if (cachedActiveDimensions) return cachedActiveDimensions;
  if (!pendingLoad) {
    pendingLoad = getActiveDimensions()
      .then((dims) => {
        cachedActiveDimensions = dims.map((d) => d.DimensionCode);
        return cachedActiveDimensions;
      })
      .catch(() => {
        cachedActiveDimensions = [1];
        return cachedActiveDimensions;
      });
  }
  return pendingLoad;
}

export function useActiveDimensions(): number[] {
  const [dims, setDims] = useState<number[]>(cachedActiveDimensions || []);

  useEffect(() => {
    let mounted = true;
    loadActiveDimensions().then((d) => {
      if (mounted) setDims(d);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return dims;
}
