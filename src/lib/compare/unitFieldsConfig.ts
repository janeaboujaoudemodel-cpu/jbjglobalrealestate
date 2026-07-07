export type UnitFieldId =
  // Unit
  | "label" | "bedrooms" | "propertyType" | "size" | "price" | "pricePerSqft" | "view" | "floor" | "unitNumber" | "cityNumber" | "layout" | "unitDescription"
  // Location & Project
  | "projectName" | "developer" | "location" | "community" | "handover"
  // Payment Plan
  | "downPaymentPct" | "monthlyInstallment" | "installmentsCount"
  | "duringConstructionAED" | "postHandoverAED" | "firstPaymentDate" | "lastPaymentDate"
  // Developer
  | "developerFounded" | "developerFounder" | "developerDelivered" | "developerActive"
  // Investor
  | "estimatedROI" | "estimatedYield" | "serviceCharges" | "dldFee";

export interface UnitFieldDef {
  id: UnitFieldId;
  label: string;
  group: "Unit" | "Project" | "Payment plan" | "Developer" | "Investor metrics";
  defaultVisible: boolean;
}

export const UNIT_FIELDS: UnitFieldDef[] = [
  // Unit
  { id: "label", label: "Label", group: "Unit", defaultVisible: true },
  { id: "bedrooms", label: "Bedrooms", group: "Unit", defaultVisible: true },
  { id: "propertyType", label: "Property type", group: "Unit", defaultVisible: true },
  { id: "size", label: "Size (sqft)", group: "Unit", defaultVisible: true },
  { id: "price", label: "Price (AED)", group: "Unit", defaultVisible: true },
  { id: "pricePerSqft", label: "Price / sqft", group: "Unit", defaultVisible: true },
  { id: "view", label: "View", group: "Unit", defaultVisible: true },
  { id: "floor", label: "Floor", group: "Unit", defaultVisible: false },
  { id: "unitNumber", label: "Unit #", group: "Unit", defaultVisible: false },
  { id: "cityNumber", label: "City number", group: "Unit", defaultVisible: false },
  { id: "layout", label: "Layout", group: "Unit", defaultVisible: true },
  { id: "unitDescription", label: "Description", group: "Unit", defaultVisible: false },
  // Project
  { id: "projectName", label: "Project name", group: "Project", defaultVisible: true },
  { id: "developer", label: "Developer", group: "Project", defaultVisible: true },
  { id: "location", label: "Location / Area", group: "Project", defaultVisible: true },
  { id: "community", label: "Community", group: "Project", defaultVisible: false },
  { id: "handover", label: "Handover", group: "Project", defaultVisible: true },
  // Payment
  { id: "downPaymentPct", label: "Down payment %", group: "Payment plan", defaultVisible: true },
  { id: "monthlyInstallment", label: "Monthly installment", group: "Payment plan", defaultVisible: true },
  { id: "installmentsCount", label: "# Installments", group: "Payment plan", defaultVisible: true },
  { id: "duringConstructionAED", label: "During construction", group: "Payment plan", defaultVisible: true },
  { id: "postHandoverAED", label: "Post-handover total", group: "Payment plan", defaultVisible: true },
  { id: "firstPaymentDate", label: "First payment", group: "Payment plan", defaultVisible: false },
  { id: "lastPaymentDate", label: "Last payment", group: "Payment plan", defaultVisible: false },
  // Developer
  { id: "developerFounded", label: "Founded year", group: "Developer", defaultVisible: false },
  { id: "developerFounder", label: "Founder / CEO", group: "Developer", defaultVisible: false },
  { id: "developerDelivered", label: "Projects delivered", group: "Developer", defaultVisible: false },
  { id: "developerActive", label: "Active projects", group: "Developer", defaultVisible: false },
  // Investor
  { id: "estimatedROI", label: "Investor profile", group: "Investor metrics", defaultVisible: true },
  { id: "estimatedYield", label: "Rental demand", group: "Investor metrics", defaultVisible: true },
  { id: "serviceCharges", label: "Service charges", group: "Investor metrics", defaultVisible: true },
  { id: "dldFee", label: "DLD fee", group: "Investor metrics", defaultVisible: true },
];

export const DEFAULT_VISIBLE: UnitFieldId[] = UNIT_FIELDS.filter(f => f.defaultVisible).map(f => f.id);
