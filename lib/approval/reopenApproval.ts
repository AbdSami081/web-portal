import { toast } from "sonner";
import { reopenApprovalRequest } from "@/api+/sap/Templates/approvalTemplate";

export async function runReopenApproval(approvalRequestCode: number): Promise<boolean> {
  const code = Number(approvalRequestCode) || 0;
  if (code <= 0) {
    toast.warning("Draft updated, but the approval request could not be identified.");
    return false;
  }

  try {
    const resp = await reopenApprovalRequest(code);
    const reOpened = resp?.ReOpened ?? resp?.reOpened;
    if (reOpened === false) {
      toast.warning(resp?.Message || "Draft updated, but the approval could not be re-opened.");
      return false;
    }
    toast.success("Draft updated and sent back for approval.");
    return true;
  } catch (err: any) {
    toast.warning(
      err?.response?.data?.Message || "Draft updated, but the approval could not be re-opened."
    );
    return false;
  }
}
