// This file is not used by Deno but documents the function's purpose
export const config = {
  name: "scheduled-extraction",
  description: "Scheduled job to extract property data from Al Nair/Dubai REST APIs",
  schedule: "0 6 * * *", // Daily at 6 AM UAE time
  features: [
    "Smart Matching - Matches external data with existing listings by project name/number",
    "Safe Update Logic - Only ADDS new info, never overwrites existing data",
    "Admin Approval Queue - Changes are queued for admin review before going live",
  ],
};
