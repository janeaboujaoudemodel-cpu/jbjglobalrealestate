/**
 * Derive a per-candidate folder key + display name from Document Studio
 * field values. The folder is keyed by the candidate's full legal name
 * (lowercased, collapsed whitespace) so two saves for the same person
 * land in one folder.
 */
export function pickCandidateDisplayName(fields: Record<string, string>): string {
  const pick = (...keys: string[]) =>
    keys.map((k) => (fields[k] || "").trim()).find(Boolean) || "";
  return (
    pick(
      "employeeName",
      "employee_name",
      "candidateName",
      "candidate_name",
      "applicant_name",
      "recipientName",
      "full_name",
      "client_name",
      "name",
    ) || ""
  );
}

export function normaliseFolderKey(name: string): string {
  return (name || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function deriveCandidateFolder(fields: Record<string, string>): {
  folder: string | null;
  displayName: string | null;
} {
  const displayName = pickCandidateDisplayName(fields);
  const folder = normaliseFolderKey(displayName);
  if (!folder) return { folder: null, displayName: null };
  return { folder, displayName };
}
