import { useEffect } from 'react';
import { useContactGating } from '@/hooks/useContactGating';
import ContactGatingModal from '@/components/ContactGatingModal';

interface GlobalContactGatingProps {
  children: React.ReactNode;
}

const GlobalContactGating = ({ children }: GlobalContactGatingProps) => {
  const {
    showGatingModal,
    triggerSource,
    handleGatingComplete,
    closeGatingModal
  } = useContactGating();

  return (
    <>
      {children}
      <ContactGatingModal
        isOpen={showGatingModal}
        onClose={closeGatingModal}
        onComplete={handleGatingComplete}
        triggerSource={triggerSource}
      />
    </>
  );
};

export default GlobalContactGating;
