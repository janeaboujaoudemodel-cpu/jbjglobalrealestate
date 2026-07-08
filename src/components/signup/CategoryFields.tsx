import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Field from "./Field";
import PillGroup from "./PillGroup";
import {
  CrmCategory, DEVELOPER_POSITIONS, BROKER_POSITIONS, INVESTMENT_INTERESTS,
  INVESTMENT_TIMELINE, BUDGET_RANGES, DUBAI_COMMUNITIES, LANGUAGES,
  CONTACT_METHODS, CONTACT_TIMES, BUYING_FOR, BEDROOMS, READY_OFF_PLAN,
  CASH_MORTGAGE, PROPERTY_TYPES, SELLING_TIMELINE,
} from "./constants";

interface Props {
  category: CrmCategory;
  data: Record<string, any>;
  onChange: (patch: Record<string, any>) => void;
}

const S = ({ children }: { children: React.ReactNode }) => (
  <SelectContent className="bg-white z-50">{children}</SelectContent>
);

const opts = (list: string[]) =>
  list.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>);

export default function CategoryFields({ category, data, onChange }: Props) {
  const set = (k: string) => (v: any) => onChange({ [k]: v });

  const Yes = data.invested_before === "Yes";

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl text-[#0d3a2b]">Tell us more</h2>
        <p className="text-sm text-[#1A1A1A]/70 mt-1">Just what's relevant to your profile.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {category === "developer" && (
          <>
            <Field label="Developer name" required>
              <Input value={data.company_name || ""} onChange={(e) => set("company_name")(e.target.value)} placeholder="Emaar, Damac, Sobha…" />
            </Field>
            <Field label="Office location">
              <Input value={data.office_location || ""} onChange={(e) => set("office_location")(e.target.value)} />
            </Field>
            <Field label="Position" required>
              <Select value={data.position || ""} onValueChange={set("position")}>
                <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                <S>{opts(DEVELOPER_POSITIONS)}</S>
              </Select>
            </Field>
            <Field label="Years in real estate">
              <Input type="number" min={0} value={data.years_experience ?? ""} onChange={(e) => set("years_experience")(e.target.value)} />
            </Field>
            <Field label="Years with current developer">
              <Input type="number" min={0} value={data.years_current ?? ""} onChange={(e) => set("years_current")(e.target.value)} />
            </Field>
            <Field label="Previous developer">
              <Input value={data.previous_developer || ""} onChange={(e) => set("previous_developer")(e.target.value)} />
            </Field>
          </>
        )}

        {category === "broker" && (
          <>
            <Field label="Brokerage company" required>
              <Input value={data.company_name || ""} onChange={(e) => set("company_name")(e.target.value)} />
            </Field>
            <Field label="Office location">
              <Input value={data.office_location || ""} onChange={(e) => set("office_location")(e.target.value)} />
            </Field>
            <Field label="Position" required>
              <Select value={data.position || ""} onValueChange={set("position")}>
                <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                <S>{opts(BROKER_POSITIONS)}</S>
              </Select>
            </Field>
            <Field label="Years of experience">
              <Input type="number" min={0} value={data.years_experience ?? ""} onChange={(e) => set("years_experience")(e.target.value)} />
            </Field>
            <Field label="RERA number">
              <Input value={data.rera_number || ""} onChange={(e) => set("rera_number")(e.target.value)} />
            </Field>
            <Field label="Team size">
              <Input type="number" min={0} value={data.team_size ?? ""} onChange={(e) => set("team_size")(e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Areas of expertise / Communities covered">
                <PillGroup options={DUBAI_COMMUNITIES} value={data.communities || []} onChange={set("communities")} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Languages spoken">
                <PillGroup options={LANGUAGES} value={data.languages || []} onChange={set("languages")} />
              </Field>
            </div>
          </>
        )}

        {category === "investor" && (
          <>
            <Field label="Nationality" required>
              <Input value={data.nationality || ""} onChange={(e) => set("nationality")(e.target.value)} />
            </Field>
            <Field label="Country of residence" required>
              <Input value={data.country_of_residence || ""} onChange={(e) => set("country_of_residence")(e.target.value)} />
            </Field>
            <Field label="Invested in UAE before?" required>
              <Select value={data.invested_before || ""} onValueChange={set("invested_before")}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <S>{opts(["Yes","No"])}</S>
              </Select>
            </Field>
            {Yes && (
              <>
                <Field label="Number of investments">
                  <Input type="number" min={0} value={data.num_investments ?? ""} onChange={(e) => set("num_investments")(e.target.value)} />
                </Field>
                <Field label="Investment experience">
                  <Select value={data.investment_experience || ""} onValueChange={set("investment_experience")}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <S>{opts(["Beginner","Intermediate","Experienced","Institutional"])}</S>
                  </Select>
                </Field>
              </>
            )}
            <Field label="Budget">
              <Select value={data.budget || ""} onValueChange={set("budget")}>
                <SelectTrigger><SelectValue placeholder="Select budget" /></SelectTrigger>
                <S>{opts(BUDGET_RANGES)}</S>
              </Select>
            </Field>
            <Field label="Timeline">
              <Select value={data.timeline || ""} onValueChange={set("timeline")}>
                <SelectTrigger><SelectValue placeholder="Select timeline" /></SelectTrigger>
                <S>{opts(INVESTMENT_TIMELINE)}</S>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Investment interests">
                <PillGroup options={INVESTMENT_INTERESTS} value={data.interests || []} onChange={set("interests")} />
              </Field>
            </div>
          </>
        )}

        {category === "buyer" && (
          <>
            <Field label="Buying for" required>
              <Select value={data.buying_for || ""} onValueChange={set("buying_for")}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <S>{opts(BUYING_FOR)}</S>
              </Select>
            </Field>
            <Field label="Budget">
              <Select value={data.budget || ""} onValueChange={set("budget")}>
                <SelectTrigger><SelectValue placeholder="Select budget" /></SelectTrigger>
                <S>{opts(BUDGET_RANGES)}</S>
              </Select>
            </Field>
            <Field label="Bedrooms">
              <Select value={data.bedrooms || ""} onValueChange={set("bedrooms")}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <S>{opts(BEDROOMS)}</S>
              </Select>
            </Field>
            <Field label="Ready or Off-Plan">
              <Select value={data.ready_or_offplan || ""} onValueChange={set("ready_or_offplan")}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <S>{opts(READY_OFF_PLAN)}</S>
              </Select>
            </Field>
            <Field label="Cash or Mortgage">
              <Select value={data.cash_or_mortgage || ""} onValueChange={set("cash_or_mortgage")}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <S>{opts(CASH_MORTGAGE)}</S>
              </Select>
            </Field>
            <Field label="Purchase timeline">
              <Select value={data.timeline || ""} onValueChange={set("timeline")}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <S>{opts(INVESTMENT_TIMELINE)}</S>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Preferred communities">
                <PillGroup options={DUBAI_COMMUNITIES} value={data.communities || []} onChange={set("communities")} />
              </Field>
            </div>
          </>
        )}

        {category === "seller" && (
          <>
            <Field label="Property type" required>
              <Select value={data.property_type || ""} onValueChange={set("property_type")}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <S>{opts(PROPERTY_TYPES)}</S>
              </Select>
            </Field>
            <Field label="Community" required>
              <Input value={data.community || ""} onChange={(e) => set("community")(e.target.value)} />
            </Field>
            <Field label="Area (sqft)">
              <Input type="number" value={data.area_sqft ?? ""} onChange={(e) => set("area_sqft")(e.target.value)} />
            </Field>
            <Field label="Estimated value (AED)">
              <Input type="number" value={data.estimated_value ?? ""} onChange={(e) => set("estimated_value")(e.target.value)} />
            </Field>
            <Field label="Selling timeline">
              <Select value={data.timeline || ""} onValueChange={set("timeline")}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <S>{opts(SELLING_TIMELINE)}</S>
              </Select>
            </Field>
          </>
        )}

        {category === "landlord" && (
          <>
            <Field label="Number of properties owned">
              <Input type="number" min={0} value={data.num_properties ?? ""} onChange={(e) => set("num_properties")(e.target.value)} />
            </Field>
            <Field label="Primary community">
              <Input value={data.community || ""} onChange={(e) => set("community")(e.target.value)} />
            </Field>
            <Field label="Property management needs">
              <Select value={data.management || ""} onValueChange={set("management")}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <S>{opts(["Full Management","Leasing Only","Tenant Sourcing Only","None"])}</S>
              </Select>
            </Field>
          </>
        )}

        {category === "tenant" && (
          <>
            <Field label="Looking for" required>
              <Select value={data.property_type || ""} onValueChange={set("property_type")}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <S>{opts(PROPERTY_TYPES)}</S>
              </Select>
            </Field>
            <Field label="Bedrooms">
              <Select value={data.bedrooms || ""} onValueChange={set("bedrooms")}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <S>{opts(BEDROOMS)}</S>
              </Select>
            </Field>
            <Field label="Annual budget (AED)">
              <Input type="number" value={data.annual_budget ?? ""} onChange={(e) => set("annual_budget")(e.target.value)} />
            </Field>
            <Field label="Move-in timeline">
              <Select value={data.timeline || ""} onValueChange={set("timeline")}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <S>{opts(INVESTMENT_TIMELINE)}</S>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Preferred communities">
                <PillGroup options={DUBAI_COMMUNITIES} value={data.communities || []} onChange={set("communities")} />
              </Field>
            </div>
          </>
        )}

        {category === "partner" && (
          <>
            <Field label="Company / Organization" required>
              <Input value={data.company_name || ""} onChange={(e) => set("company_name")(e.target.value)} />
            </Field>
            <Field label="Partnership type" required>
              <Select value={data.partnership_type || ""} onValueChange={set("partnership_type")}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <S>{opts(["Channel Partner","Institutional","Referral","Marketing","Technology","Other"])}</S>
              </Select>
            </Field>
            <Field label="Position">
              <Input value={data.position || ""} onChange={(e) => set("position")(e.target.value)} />
            </Field>
            <Field label="Website">
              <Input value={data.website || ""} onChange={(e) => set("website")(e.target.value)} />
            </Field>
          </>
        )}

        {category === "service_provider" && (
          <>
            <Field label="Company name" required>
              <Input value={data.company_name || ""} onChange={(e) => set("company_name")(e.target.value)} />
            </Field>
            <Field label="Service category" required>
              <Select value={data.service_category || ""} onValueChange={set("service_category")}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <S>{opts(["Legal","Finance / Mortgage","Interior Design","Contracting","Moving","Insurance","Photography","Marketing","Technology","Other"])}</S>
              </Select>
            </Field>
            <Field label="Website">
              <Input value={data.website || ""} onChange={(e) => set("website")(e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Brief description of services">
                <Textarea value={data.service_description || ""} onChange={(e) => set("service_description")(e.target.value)} />
              </Field>
            </div>
          </>
        )}

        {category === "media" && (
          <>
            <Field label="Outlet / Publication" required>
              <Input value={data.company_name || ""} onChange={(e) => set("company_name")(e.target.value)} />
            </Field>
            <Field label="Role" required>
              <Input value={data.position || ""} onChange={(e) => set("position")(e.target.value)} placeholder="Journalist, Editor, Producer…" />
            </Field>
            <Field label="Coverage focus">
              <Input value={data.coverage_focus || ""} onChange={(e) => set("coverage_focus")(e.target.value)} placeholder="Luxury real estate, market data…" />
            </Field>
            <Field label="Website / Portfolio">
              <Input value={data.website || ""} onChange={(e) => set("website")(e.target.value)} />
            </Field>
          </>
        )}

        {category === "other" && (
          <div className="sm:col-span-2">
            <Field label="How can we help?" required>
              <Textarea rows={4} value={data.other_reason || ""} onChange={(e) => set("other_reason")(e.target.value)} />
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}
