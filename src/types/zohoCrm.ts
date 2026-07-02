/**
 * Zoho CRM v6 record shapes — trimmed to the fields the JBJ CRM shell
 * needs for list views. Extend per-module as UI wires them up.
 */

export type ZohoModuleName =
  | "Leads"
  | "Contacts"
  | "Accounts"
  | "Deals"
  | "Tasks"
  | "Calls"
  | "Meetings"
  | "Products"
  | "Quotes"
  | "Invoices"
  | "Cases";

export interface ZohoRecordBase {
  id: string;
  Created_Time?: string;
  Modified_Time?: string;
  Owner?: { id: string; name: string; email?: string };
}

export interface ZohoLead extends ZohoRecordBase {
  First_Name?: string | null;
  Last_Name?: string;
  Full_Name?: string;
  Company?: string | null;
  Email?: string | null;
  Phone?: string | null;
  Mobile?: string | null;
  Lead_Source?: string | null;
  Lead_Status?: string | null;
  Industry?: string | null;
  Rating?: string | null;
}

export interface ZohoContact extends ZohoRecordBase {
  First_Name?: string | null;
  Last_Name?: string;
  Full_Name?: string;
  Account_Name?: { id: string; name: string } | null;
  Email?: string | null;
  Phone?: string | null;
  Mobile?: string | null;
  Title?: string | null;
}

export interface ZohoAccount extends ZohoRecordBase {
  Account_Name?: string;
  Phone?: string | null;
  Website?: string | null;
  Industry?: string | null;
  Account_Type?: string | null;
}

export interface ZohoDeal extends ZohoRecordBase {
  Deal_Name?: string;
  Amount?: number | null;
  Stage?: string | null;
  Closing_Date?: string | null;
  Account_Name?: { id: string; name: string } | null;
  Contact_Name?: { id: string; name: string } | null;
  Pipeline?: string | null;
  Probability?: number | null;
}

export interface ZohoTask extends ZohoRecordBase {
  Subject?: string;
  Status?: string | null;
  Priority?: string | null;
  Due_Date?: string | null;
  Who_Id?: { id: string; name: string } | null;
  What_Id?: { id: string; name: string } | null;
}

export interface ZohoListResponse<T> {
  data: T[];
  info?: {
    per_page: number;
    count: number;
    page: number;
    more_records: boolean;
  };
}

export const ZOHO_DEFAULT_FIELDS: Record<ZohoModuleName, string[]> = {
  Leads: ["id", "Full_Name", "Company", "Email", "Phone", "Lead_Source", "Lead_Status", "Owner", "Created_Time"],
  Contacts: ["id", "Full_Name", "Account_Name", "Email", "Phone", "Title", "Owner", "Created_Time"],
  Accounts: ["id", "Account_Name", "Phone", "Website", "Industry", "Owner", "Created_Time"],
  Deals: ["id", "Deal_Name", "Amount", "Stage", "Closing_Date", "Account_Name", "Owner", "Created_Time"],
  Tasks: ["id", "Subject", "Status", "Priority", "Due_Date", "Who_Id", "Owner"],
  Calls: ["id", "Subject", "Call_Type", "Call_Start_Time", "Call_Duration", "Owner"],
  Meetings: ["id", "Event_Title", "Start_DateTime", "End_DateTime", "Venue", "Owner"],
  Products: ["id", "Product_Name", "Product_Code", "Unit_Price", "Product_Active"],
  Quotes: ["id", "Subject", "Quote_Stage", "Grand_Total", "Valid_Till", "Account_Name"],
  Invoices: ["id", "Subject", "Status", "Grand_Total", "Invoice_Date", "Account_Name"],
  Cases: ["id", "Subject", "Status", "Priority", "Case_Origin", "Account_Name"],
};
