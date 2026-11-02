import { redirect } from "next/navigation";

export default function LegacyWpApprovalAdminRedirect() {
  redirect("/dashboard/wp-approval-process/templates");
}
