import { ScannedContact } from "@/utils/businessCardEncryption";

const phoneDigits = (value?: string) => (value || "").replace(/\D/g, "");

export const isContactSaveable = (contact: Partial<ScannedContact>) => {
  const email = contact.email || "";
  const website = contact.website || "";
  const phone =
    phoneDigits(contact.mobile) ||
    phoneDigits(contact.phone) ||
    phoneDigits(contact.whatsapp) ||
    phoneDigits(contact.landline);
  const name = (contact.name || "").trim();
  const company = (contact.company || contact.company_name || "").trim();
  const title = (contact.title || contact.jobTitle || "").trim();

  return Boolean(
    /\S+@\S+\.\S+/.test(email) ||
      phone.length >= 7 ||
      /^https?:\/\//i.test(website) ||
      /\.[a-z]{2,}$/i.test(website) ||
      Boolean(contact.linkedin || contact.instagram) ||
      (name.length >= 2 && (company.length >= 2 || title.length >= 2)),
  );
};

export const invalidBusinessCardMessage =
  "No business-card contact details were detected. The image was not added to scanned contacts or CRM.";