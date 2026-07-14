import "react-phone-number-input/style.css";
import PhoneInputBase, { type Value } from "react-phone-number-input";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  id?: string;
  autoComplete?: string;
  placeholder?: string;
}

/**
 * International phone input rendered as TWO visually distinct fields
 * inside a single row: [ 🇦🇪 +971 ▾ ]  [  Phone number  ]
 *
 * Backed by react-phone-number-input (one E.164 value) but styled so the
 * country/dial-code selector and the number input read as separate pills.
 */
export default function PhoneField({ value, onChange, id, autoComplete = "tel", placeholder }: Props) {
  return (
    <PhoneInputBase
      id={id}
      international
      defaultCountry="AE"
      countryCallingCodeEditable={false}
      autoComplete={autoComplete}
      placeholder={placeholder ?? "50 123 4567"}
      value={(value || undefined) as Value}
      onChange={(v) => onChange((v ?? "") as string)}
      className={cn(
        // Container: flex row with a real gap so the two children look separate
        "phone-input-jbj flex items-stretch gap-2 w-full",
        // Country selector = its own pill
        "[&_.PhoneInputCountry]:flex [&_.PhoneInputCountry]:items-center [&_.PhoneInputCountry]:gap-1.5",
        "[&_.PhoneInputCountry]:h-11 [&_.PhoneInputCountry]:px-3 [&_.PhoneInputCountry]:rounded-md",
        "[&_.PhoneInputCountry]:bg-white [&_.PhoneInputCountry]:border [&_.PhoneInputCountry]:border-[#B89555]/45",
        "[&_.PhoneInputCountry]:min-w-[92px] [&_.PhoneInputCountry]:cursor-pointer",
        "[&_.PhoneInputCountry:focus-within]:border-[#064E3B] [&_.PhoneInputCountry:focus-within]:ring-2 [&_.PhoneInputCountry:focus-within]:ring-[#064E3B]/20",
        "[&_.PhoneInputCountrySelect]:cursor-pointer [&_.PhoneInputCountrySelect]:outline-none",
        "[&_.PhoneInputCountryIcon]:w-6 [&_.PhoneInputCountryIcon]:h-4 [&_.PhoneInputCountryIcon]:rounded-[3px] [&_.PhoneInputCountryIcon]:overflow-hidden [&_.PhoneInputCountryIcon]:shadow-sm",
        "[&_.PhoneInputCountrySelectArrow]:opacity-70 [&_.PhoneInputCountrySelectArrow]:ml-1 [&_.PhoneInputCountrySelectArrow]:border-[#0d3a2b]",
        // Number input = its own pill
        "[&_input]:flex-1 [&_input]:min-w-0 [&_input]:h-11 [&_input]:rounded-md",
        "[&_input]:bg-white [&_input]:border [&_input]:border-[#B89555]/45 [&_input]:px-3",
        "[&_input]:text-[#1A1A1A] [&_input]:text-sm [&_input]:outline-none",
        "[&_input:focus]:border-[#064E3B] [&_input:focus]:ring-2 [&_input:focus]:ring-[#064E3B]/20",
        "[&_input::placeholder]:text-[#1A1A1A]/40"
      )}
    />
  );
}
