import { redirect } from "next/navigation";

/** Originators are configured on each template (Originators tab). */
export default function WpOriginatorsRedirectPage() {
  redirect("/dashboard/wp-approval-process/templates");
}
