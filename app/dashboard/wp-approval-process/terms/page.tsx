import { redirect } from "next/navigation";

/** Terms and FMS queries are configured on each template (Terms & queries tab). */
export default function WpTermsRedirectPage() {
  redirect("/dashboard/wp-approval-process/templates");
}
