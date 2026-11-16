import { redirect } from "next/navigation";

/** Formatted-search links are configured on each template (Terms & queries tab). */
export default function WpFmsLinksRedirectPage() {
  redirect("/dashboard/wp-approval-process/templates");
}
