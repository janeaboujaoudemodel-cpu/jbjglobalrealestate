/**
 * AddPersonDialog — canonical single source of truth for adding a person
 * (broker or employee) anywhere in the app.
 *
 * mode="broker"   → wraps AddBrokerSheet (writes to crm_brokers, fires branded
 *                   invitation, supports RERA, brokerage, photo, social URLs,
 *                   access scope, expiry, onboarding link).
 * mode="employee" → wraps NewJoinerApplicationForm (writes to
 *                   new_joiner_applications + opens an IT account-creation task).
 *
 * Wired entry points (do not duplicate add-person UI elsewhere):
 *   - UnifiedCRM           (Add Broker button)
 *   - BrokersRegistry      (Add broker button)
 *   - CRMListSidebar       (sidebar add)
 *   - IndividualBrokersTab (Add broker button)
 *   - EmployeeManagementHub / ITDepartment (new joiner)
 *
 * Note: BrokerageAgentsEditor's "Add Broker / Add Admin / …" buttons add a
 * draft row to the parent brokerage form's local array; they do NOT create a
 * crm_brokers record by themselves and are intentionally not routed through
 * this dialog.
 */
import { AddBrokerSheet } from "@/pages/owner/crm/BrokersRegistry";
import NewJoinerApplicationForm from "@/components/it-department/NewJoinerApplicationForm";

export type AddPersonMode = "broker" | "employee";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: AddPersonMode;
  onAdded?: () => void;
}

export function AddPersonDialog({ open, onOpenChange, mode = "broker", onAdded }: Props) {
  if (mode === "employee") {
    return (
      <NewJoinerApplicationForm
        isOpen={open}
        onClose={() => onOpenChange(false)}
        onSuccess={() => {
          onAdded?.();
          onOpenChange(false);
        }}
      />
    );
  }
  return (
    <AddBrokerSheet
      open={open}
      onOpenChange={onOpenChange}
      onAdded={() => onAdded?.()}
    />
  );
}

export default AddPersonDialog;
