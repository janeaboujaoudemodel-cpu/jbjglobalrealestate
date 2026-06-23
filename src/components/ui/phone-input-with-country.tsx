import React from 'react';
import { PhoneInput } from '@/components/ui/phone-input';

interface PhoneInputWithCountryProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const PhoneInputWithCountry: React.FC<PhoneInputWithCountryProps> = ({
  value,
  onChange,
  placeholder = 'Phone number',
  className = ''
}) => {
  return (
    <PhoneInput
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      variant="light"
    />
  );
};

export default PhoneInputWithCountry;
