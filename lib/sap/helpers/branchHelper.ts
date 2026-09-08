import { Warehouse } from "@/types/warehouse.type";
import { Branch } from "@/api+/sap/branch";

export const resolveBranchForWarehouse = (
  warehouseCode?: string | null,
  warehouses?: Warehouse[] | any[]
): number | undefined => {
  if (!warehouseCode || !warehouses?.length) return undefined;
  const match = warehouses.find((w: any) => (w.WarehouseCode || w.WhsCode) === warehouseCode);
  return match?.BPLid ?? match?.BPLID;
};

export const resolveBranchName = (
  branchId?: number | null,
  branches?: Branch[]
): string => {
  if (branchId === undefined || branchId === null || !branches?.length) return "";
  const match = branches.find((b) => b.BPLID === branchId);
  return match?.BPLName ?? String(branchId);
};
