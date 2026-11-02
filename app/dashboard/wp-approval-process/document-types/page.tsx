import { redirect } from "next/navigation";

/** Document types are configured on each template (Document Types tab). */
export default function WpDocumentTypesRedirectPage() {
  redirect("/dashboard/wp-approval-process/templates");
}
