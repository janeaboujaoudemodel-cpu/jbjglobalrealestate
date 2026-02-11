import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TProps {
  children: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

/**
 * Auto-translating text component
 * 
 * Usage:
 * <T>Hello World</T>
 * <T as="span" className="font-bold">Click here</T>
 * 
 * The text will be automatically translated to the current language
 * using the global translation system with AI fallback.
 */
export const T = React.forwardRef<HTMLSpanElement, TProps>(
  ({ children, as: Tag = 'span', className }, ref) => {
    const { translateText } = useLanguage();

    if (!children || typeof children !== 'string') {
      return null;
    }

    const translated = translateText(children);

    if (Tag === 'span') {
      return <span ref={ref} className={className}>{translated}</span>;
    }

    return <Tag className={className}>{translated}</Tag>;
  }
);

T.displayName = 'T';

export default T;
