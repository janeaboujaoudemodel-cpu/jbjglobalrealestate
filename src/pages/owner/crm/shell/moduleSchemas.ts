/**
 * JBJ CRM — Module field schemas.
 * Data-agnostic definitions used by Create Record and Record Detail templates.
 */

export type FieldType = "text" | "email" | "phone" | "number" | "date" | "select" | "textarea" | "url";

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
};

export type Section = {
  title: string;
  fields: Field[];
};

export type ModuleSchema = {
  label: string;
  singular: string;
  sections: Section[];
  relatedLists: string[];
};

const OWNER: Field = { key: "owner", label: "Owner", type: "text" };

export const MODULE_SCHEMAS: Record<string, ModuleSchema> = {
  leads: {
    label: "Leads",
    singular: "Lead",
    sections: [
      {
        title: "Lead Information",
        fields: [
          OWNER,
          { key: "salutation", label: "Salutation", type: "select", options: ["Mr.", "Ms.", "Mrs.", "Dr."] },
          { key: "firstName", label: "First Name", type: "text" },
          { key: "lastName", label: "Last Name", type: "text", required: true },
          { key: "company", label: "Company", type: "text", required: true },
          { key: "title", label: "Title", type: "text" },
          { key: "email", label: "Email", type: "email" },
          { key: "phone", label: "Phone", type: "phone" },
          { key: "mobile", label: "Mobile", type: "phone" },
          { key: "fax", label: "Fax", type: "phone" },
          { key: "website", label: "Website", type: "url" },
          { key: "leadSource", label: "Lead Source", type: "select", options: ["Advertisement", "Cold Call", "Referral", "Website", "Social Media"] },
          { key: "leadStatus", label: "Lead Status", type: "select", options: ["New", "Contacted", "Qualified", "Unqualified"] },
          { key: "industry", label: "Industry", type: "text" },
          { key: "noEmployees", label: "No. of Employees", type: "number" },
          { key: "annualRevenue", label: "Annual Revenue", type: "number" },
          { key: "rating", label: "Rating", type: "select", options: ["Hot", "Warm", "Cold"] },
        ],
      },
      {
        title: "Address Information",
        fields: [
          { key: "street", label: "Street", type: "text" },
          { key: "city", label: "City", type: "text" },
          { key: "state", label: "State", type: "text" },
          { key: "zip", label: "Zip Code", type: "text" },
          { key: "country", label: "Country", type: "text" },
        ],
      },
      {
        title: "Description Information",
        fields: [{ key: "description", label: "Description", type: "textarea" }],
      },
    ],
    relatedLists: ["Open Activities", "Closed Activities", "Notes", "Attachments", "Emails", "Campaigns", "Social"],
  },
  contacts: {
    label: "Contacts",
    singular: "Contact",
    sections: [
      {
        title: "Contact Information",
        fields: [
          OWNER,
          { key: "salutation", label: "Salutation", type: "select", options: ["Mr.", "Ms.", "Mrs.", "Dr."] },
          { key: "firstName", label: "First Name", type: "text" },
          { key: "lastName", label: "Last Name", type: "text", required: true },
          { key: "account", label: "Account Name", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "email", label: "Email", type: "email" },
          { key: "phone", label: "Phone", type: "phone" },
          { key: "mobile", label: "Mobile", type: "phone" },
          { key: "department", label: "Department", type: "text" },
          { key: "leadSource", label: "Lead Source", type: "select", options: ["Advertisement", "Cold Call", "Referral", "Website"] },
        ],
      },
      {
        title: "Address Information",
        fields: [
          { key: "mailingStreet", label: "Mailing Street", type: "text" },
          { key: "mailingCity", label: "Mailing City", type: "text" },
          { key: "mailingState", label: "Mailing State", type: "text" },
          { key: "mailingZip", label: "Mailing Zip", type: "text" },
          { key: "mailingCountry", label: "Mailing Country", type: "text" },
        ],
      },
      { title: "Description Information", fields: [{ key: "description", label: "Description", type: "textarea" }] },
    ],
    relatedLists: ["Open Activities", "Closed Activities", "Notes", "Attachments", "Deals", "Emails"],
  },
  accounts: {
    label: "Accounts",
    singular: "Account",
    sections: [
      {
        title: "Account Information",
        fields: [
          OWNER,
          { key: "name", label: "Account Name", type: "text", required: true },
          { key: "website", label: "Website", type: "url" },
          { key: "phone", label: "Phone", type: "phone" },
          { key: "fax", label: "Fax", type: "phone" },
          { key: "type", label: "Account Type", type: "select", options: ["Prospect", "Customer", "Partner", "Vendor"] },
          { key: "industry", label: "Industry", type: "text" },
          { key: "annualRevenue", label: "Annual Revenue", type: "number" },
          { key: "employees", label: "Employees", type: "number" },
          { key: "rating", label: "Rating", type: "select", options: ["Acquired", "Active", "Market Failed"] },
        ],
      },
      {
        title: "Address Information",
        fields: [
          { key: "billingStreet", label: "Billing Street", type: "text" },
          { key: "billingCity", label: "Billing City", type: "text" },
          { key: "billingCountry", label: "Billing Country", type: "text" },
          { key: "shippingStreet", label: "Shipping Street", type: "text" },
          { key: "shippingCity", label: "Shipping City", type: "text" },
          { key: "shippingCountry", label: "Shipping Country", type: "text" },
        ],
      },
      { title: "Description Information", fields: [{ key: "description", label: "Description", type: "textarea" }] },
    ],
    relatedLists: ["Contacts", "Deals", "Cases", "Notes", "Attachments", "Open Activities", "Emails"],
  },
  deals: {
    label: "Deals",
    singular: "Deal",
    sections: [
      {
        title: "Deal Information",
        fields: [
          OWNER,
          { key: "name", label: "Deal Name", type: "text", required: true },
          { key: "account", label: "Account Name", type: "text" },
          { key: "amount", label: "Amount", type: "number" },
          { key: "closingDate", label: "Closing Date", type: "date", required: true },
          { key: "stage", label: "Stage", type: "select", options: ["Qualification", "Needs Analysis", "Proposal", "Negotiation", "Closed Won", "Closed Lost"] },
          { key: "probability", label: "Probability (%)", type: "number" },
          { key: "expectedRevenue", label: "Expected Revenue", type: "number" },
          { key: "type", label: "Type", type: "select", options: ["New Business", "Existing Business"] },
          { key: "nextStep", label: "Next Step", type: "text" },
          { key: "leadSource", label: "Lead Source", type: "select", options: ["Advertisement", "Cold Call", "Referral", "Website"] },
        ],
      },
      { title: "Description Information", fields: [{ key: "description", label: "Description", type: "textarea" }] },
    ],
    relatedLists: ["Contact Roles", "Products", "Open Activities", "Closed Activities", "Notes", "Attachments", "Emails", "Quotes"],
  },
  tasks: {
    label: "Tasks",
    singular: "Task",
    sections: [
      {
        title: "Task Information",
        fields: [
          OWNER,
          { key: "subject", label: "Subject", type: "text", required: true },
          { key: "dueDate", label: "Due Date", type: "date" },
          { key: "status", label: "Status", type: "select", options: ["Not Started", "In Progress", "Completed", "Waiting on someone else", "Deferred"] },
          { key: "priority", label: "Priority", type: "select", options: ["Low", "Normal", "High"] },
          { key: "reminder", label: "Reminder", type: "date" },
        ],
      },
      { title: "Description Information", fields: [{ key: "description", label: "Description", type: "textarea" }] },
    ],
    relatedLists: ["Notes", "Attachments"],
  },
  meetings: {
    label: "Meetings",
    singular: "Meeting",
    sections: [
      {
        title: "Meeting Information",
        fields: [
          OWNER,
          { key: "title", label: "Title", type: "text", required: true },
          { key: "from", label: "From", type: "date" },
          { key: "to", label: "To", type: "date" },
          { key: "location", label: "Location", type: "text" },
          { key: "host", label: "Host", type: "text" },
          { key: "participants", label: "Participants", type: "text" },
        ],
      },
      { title: "Description Information", fields: [{ key: "description", label: "Description", type: "textarea" }] },
    ],
    relatedLists: ["Notes", "Attachments"],
  },
  calls: {
    label: "Calls",
    singular: "Call",
    sections: [
      {
        title: "Call Information",
        fields: [
          OWNER,
          { key: "subject", label: "Subject", type: "text", required: true },
          { key: "callType", label: "Call Type", type: "select", options: ["Inbound", "Outbound", "Missed"] },
          { key: "callStart", label: "Call Start Time", type: "date" },
          { key: "callDuration", label: "Call Duration", type: "text" },
          { key: "outcome", label: "Outcome", type: "select", options: ["Interested", "Not Interested", "Call Back", "No Answer"] },
        ],
      },
      { title: "Description Information", fields: [{ key: "description", label: "Description", type: "textarea" }] },
    ],
    relatedLists: ["Notes", "Attachments"],
  },
};

export const DEFAULT_SCHEMA = (label: string, singular: string): ModuleSchema => ({
  label,
  singular,
  sections: [
    {
      title: `${singular} Information`,
      fields: [
        OWNER,
        { key: "name", label: "Name", type: "text", required: true },
        { key: "email", label: "Email", type: "email" },
        { key: "phone", label: "Phone", type: "phone" },
      ],
    },
    { title: "Description Information", fields: [{ key: "description", label: "Description", type: "textarea" }] },
  ],
  relatedLists: ["Notes", "Attachments"],
});

export function schemaFor(slug: string, fallbackLabel = "Record"): ModuleSchema {
  return (
    MODULE_SCHEMAS[slug] ??
    DEFAULT_SCHEMA(fallbackLabel, fallbackLabel.replace(/s$/, "") || fallbackLabel)
  );
}
