import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Field from "./Field";
import PillGroup from "./PillGroup";
import { SERVICES, LANGUAGES, CONTACT_METHODS, CONTACT_TIMES } from "./constants";

interface Props {
  data: Record<string, any>;
  onChange: (patch: Record<string, any>) => void;
  services: string[];
  setServices: (v: string[]) => void;
}

export default function CommonStep({ data, onChange, services, setServices }: Props) {
  const set = (k: string) => (v: any) => onChange({ [k]: v });
  const S = ({ children }: any) => <SelectContent className="bg-white z-50">{children}</SelectContent>;

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl text-[#0d3a2b]">Your account</h2>
        <p className="text-sm text-[#1A1A1A]/70 mt-1">Create your credentials and preferences.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full name" required>
          <Input required value={data.full_name || ""} onChange={(e) => set("full_name")(e.target.value)} />
        </Field>
        <Field label="Email" required>
          <Input required type="email" value={data.email || ""} onChange={(e) => set("email")(e.target.value)} />
        </Field>
        <Field label="Password" required hint="Minimum 8 characters">
          <Input required type="password" minLength={8} value={data.password || ""} onChange={(e) => set("password")(e.target.value)} />
        </Field>
        <Field label="Mobile number" required>
          <Input required value={data.phone || ""} onChange={(e) => set("phone")(e.target.value)} placeholder="+971 …" />
        </Field>
        <Field label="WhatsApp number">
          <Input value={data.whatsapp || ""} onChange={(e) => set("whatsapp")(e.target.value)} placeholder="Same as mobile if blank" />
        </Field>
        <Field label="Country" required>
          <Input required value={data.country || ""} onChange={(e) => set("country")(e.target.value)} />
        </Field>
        <Field label="Nationality">
          <Input value={data.nationality || ""} onChange={(e) => set("nationality")(e.target.value)} />
        </Field>
        <Field label="Preferred language">
          <Select value={data.preferred_language || "English"} onValueChange={set("preferred_language")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <S>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</S>
          </Select>
        </Field>
        <Field label="Preferred contact method">
          <Select value={data.preferred_contact_method || ""} onValueChange={set("preferred_contact_method")}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <S>{CONTACT_METHODS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</S>
          </Select>
        </Field>
        <Field label="Preferred contact time">
          <Select value={data.preferred_contact_time || ""} onValueChange={set("preferred_contact_time")}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <S>{CONTACT_TIMES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</S>
          </Select>
        </Field>
      </div>

      <Field label="Services you're interested in">
        <PillGroup options={SERVICES} value={services} onChange={setServices} />
      </Field>

      <Field label="Additional notes">
        <Textarea rows={3} value={data.notes || ""} onChange={(e) => set("notes")(e.target.value)} />
      </Field>
    </div>
  );
}
