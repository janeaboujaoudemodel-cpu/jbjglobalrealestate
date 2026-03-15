/**
 * Downloads the official JBJ Global Real Estate Company Profile PDF.
 * This is the single source of truth — the static PDF uploaded by the owner.
 * No dynamic generation; the file is served as-is.
 */
export async function generateCompanyProfilePDF(_includeFounder?: boolean): Promise<void> {
  const url = "/documents/JBJ-Global-Real-Estate-Company-Profile.pdf";
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch Company Profile PDF");
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = "JBJ_Global_Real_Estate_Company_Profile.pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}
