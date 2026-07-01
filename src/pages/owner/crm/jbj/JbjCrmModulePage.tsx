import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { JBJ_CRM_MODULES, type JbjCrmSection } from "./jbjCrmConfig";
import JbjCrmModuleList from "./JbjCrmModuleList";

// Zoho module + columns per JBJ CRM section
const MODULE_CONFIG: Partial<Record<JbjCrmSection, { zohoModule: string; columns: { key: string; label: string }[] }>> = {
  leads: {
    zohoModule: "Leads",
    columns: [
      { key: "Full_Name", label: "Name" },
      { key: "Company", label: "Company" },
      { key: "Email", label: "Email" },
      { key: "Phone", label: "Phone" },
      { key: "Lead_Status", label: "Status" },
      { key: "Lead_Source", label: "Source" },
    ],
  },
  contacts: {
    zohoModule: "Contacts",
    columns: [
      { key: "Full_Name", label: "Name" },
      { key: "Account_Name", label: "Account" },
      { key: "Email", label: "Email" },
      { key: "Phone", label: "Phone" },
      { key: "Title", label: "Title" },
    ],
  },
  accounts: {
    zohoModule: "Accounts",
    columns: [
      { key: "Account_Name", label: "Account" },
      { key: "Industry", label: "Industry" },
      { key: "Phone", label: "Phone" },
      { key: "Website", label: "Website" },
      { key: "Billing_City", label: "City" },
    ],
  },
  deals: {
    zohoModule: "Deals",
    columns: [
      { key: "Deal_Name", label: "Deal" },
      { key: "Account_Name", label: "Account" },
      { key: "Stage", label: "Stage" },
      { key: "Amount", label: "Amount" },
      { key: "Closing_Date", label: "Closing" },
    ],
  },
  tasks: {
    zohoModule: "Tasks",
    columns: [
      { key: "Subject", label: "Subject" },
      { key: "Status", label: "Status" },
      { key: "Priority", label: "Priority" },
      { key: "Due_Date", label: "Due" },
    ],
  },
  products: {
    zohoModule: "Products",
    columns: [
      { key: "Product_Name", label: "Product" },
      { key: "Product_Code", label: "Code" },
      { key: "Product_Category", label: "Category" },
      { key: "Unit_Price", label: "Unit Price" },
      { key: "Qty_in_Stock", label: "Stock" },
    ],
  },
  quotes: {
    zohoModule: "Quotes",
    columns: [
      { key: "Subject", label: "Subject" },
      { key: "Account_Name", label: "Account" },
      { key: "Quote_Stage", label: "Stage" },
      { key: "Grand_Total", label: "Total" },
      { key: "Valid_Till", label: "Valid Till" },
    ],
  },
  invoices: {
    zohoModule: "Invoices",
    columns: [
      { key: "Subject", label: "Subject" },
      { key: "Account_Name", label: "Account" },
      { key: "Status", label: "Status" },
      { key: "Grand_Total", label: "Total" },
      { key: "Due_Date", label: "Due" },
    ],
  },
  calls: {
    zohoModule: "Calls",
    columns: [
      { key: "Subject", label: "Subject" },
      { key: "Call_Type", label: "Type" },
      { key: "Call_Purpose", label: "Purpose" },
      { key: "Call_Start_Time", label: "Start" },
      { key: "Call_Duration", label: "Duration" },
    ],
  },
  meetings: {
    zohoModule: "Events",
    columns: [
      { key: "Event_Title", label: "Title" },
      { key: "Start_DateTime", label: "Start" },
      { key: "End_DateTime", label: "End" },
      { key: "Venue", label: "Venue" },
    ],
  },
  campaigns: {
    zohoModule: "Campaigns",
    columns: [
      { key: "Campaign_Name", label: "Campaign" },
      { key: "Type", label: "Type" },
      { key: "Status", label: "Status" },
      { key: "Start_Date", label: "Start" },
      { key: "End_Date", label: "End" },
      { key: "Expected_Revenue", label: "Expected" },
    ],
  },
  "price-books": {
    zohoModule: "Price_Books",
    columns: [
      { key: "Price_Book_Name", label: "Price Book" },
      { key: "Pricing_Model", label: "Model" },
      { key: "Active", label: "Active" },
    ],
  },
  "sales-orders": {
    zohoModule: "Sales_Orders",
    columns: [
      { key: "Subject", label: "Subject" },
      { key: "Account_Name", label: "Account" },
      { key: "Status", label: "Status" },
      { key: "Grand_Total", label: "Total" },
      { key: "Due_Date", label: "Due" },
    ],
  },
  "purchase-orders": {
    zohoModule: "Purchase_Orders",
    columns: [
      { key: "Subject", label: "Subject" },
      { key: "Vendor_Name", label: "Vendor" },
      { key: "Status", label: "Status" },
      { key: "Grand_Total", label: "Total" },
      { key: "Due_Date", label: "Due" },
    ],
  },
};


export default function JbjCrmModulePage() {
  const params = useParams();
  const activeSection = params.section as JbjCrmSection | undefined;
  const module = useMemo(
    () => JBJ_CRM_MODULES.find((m) => m.id === activeSection),
    [activeSection]
  );

  const config = activeSection ? MODULE_CONFIG[activeSection] : undefined;

  if (config) {
    return (
      <JbjCrmModuleList
        zohoModule={config.zohoModule}
        title={module?.label ?? config.zohoModule}
        columns={config.columns}
      />
    );
  }

  return (
    <section className="jbj-crm-stage" aria-label={module?.label ?? "Module"}>
      <div className="jbj-crm-stage-toolbar">
        <h1>{module?.label ?? "Module"}</h1>
      </div>
      <div className="jbj-crm-stage-canvas jbj-crm-stage-canvas--empty">
        <p>This module is scheduled for the next phase.</p>
      </div>
    </section>
  );
}
