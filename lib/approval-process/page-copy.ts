/** User-facing copy for WP Approval Process admin (no SAP/UDT table names). */

export const WP_APPROVAL_SHELL_SUBTITLE =
  "Configure custom approval templates, stages, and matching rules for portal documents.";

export const WP_TEMPLATES_LIST_SUBTITLE =
  "Create and manage approval templates, priority, and when conditions apply.";

export const WP_TEMPLATE_EDITOR_SUBTITLE = (code: string, codeTooLong: boolean) =>
  `Template ${code} — set who can submit, approval stages, document types, and matching rules.${
    codeTooLong
      ? " This template code exceeds 20 characters; delete it and create a new template before saving related rows."
      : ""
  }`;

export const WP_TEMPLATE_ACTIVE_HELP =
  "Inactive templates are kept in the list and are not applied when a document is added or updated.";

export const WP_APPLY_ON_UPDATE_HELP =
  "";

export const WP_TAB_ORIGINATORS_HELP =
  "Users who can start approval using this template when they submit a document. Select several users, or upload an Excel file of user codes.";

export const WP_TAB_STAGES_HELP = "Approval stages and order for this template.";

export const WP_TAB_DOC_TYPES_HELP = "Document types this template applies to.";

export const WP_TAB_TERMS_HELP =
  "When Use conditions is Yes on General, this template applies if any numeric rule or any linked query matches. Each active template is evaluated on its own and starts its own approval request.";

export const WP_TAB_FMS_QUERIES_HELP =
  "Formatted-search queries from FMS setup. A query matches when it returns TRUE, YES, Y, or a number greater than 0. FALSE, NO, N, 0, or no row does not match. Use :FieldName or $[Table.FieldName]. Queries with codes longer than 20 characters are copied automatically when you save.";

export const WP_ORIGINATORS_PAGE_SUBTITLE =
  "View which users can trigger each template (edit details on the template).";

export const WP_DOC_TYPES_PAGE_SUBTITLE =
  "View document types linked to each template (edit on the template).";

export const WP_TERMS_PAGE_SUBTITLE =
  "View predefined conditions per template (edit on the template).";

export const WP_FMS_LINKS_PAGE_SUBTITLE =
  "View formatted-search conditions linked to each template (edit on the template FMS Queries tab).";

export const WP_STAGES_LIST_SUBTITLE =
  "Define approval stages and how many approvers or rejections are required.";

export const WP_STAGE_EDITOR_SUBTITLE = (code: string) =>
  `Stage ${code} — name the stage and assign approvers.`;
