import { createContext, useContext, useState, ReactNode } from 'react';

interface ActiveLead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  language: string | null;
}

interface ActiveLeadContextType {
  activeLead: ActiveLead | null;
  setActiveLead: (lead: ActiveLead | null) => void;
  clearActiveLead: () => void;
}

const ActiveLeadContext = createContext<ActiveLeadContextType | undefined>(undefined);

export const ActiveLeadProvider = ({ children }: { children: ReactNode }) => {
  const [activeLead, setActiveLead] = useState<ActiveLead | null>(() => {
    // Restore from sessionStorage if available
    const stored = sessionStorage.getItem('jbj_active_lead');
    return stored ? JSON.parse(stored) : null;
  });

  const handleSetActiveLead = (lead: ActiveLead | null) => {
    setActiveLead(lead);
    if (lead) {
      sessionStorage.setItem('jbj_active_lead', JSON.stringify(lead));
    } else {
      sessionStorage.removeItem('jbj_active_lead');
    }
  };

  const clearActiveLead = () => {
    setActiveLead(null);
    sessionStorage.removeItem('jbj_active_lead');
  };

  return (
    <ActiveLeadContext.Provider value={{ activeLead, setActiveLead: handleSetActiveLead, clearActiveLead }}>
      {children}
    </ActiveLeadContext.Provider>
  );
};

export const useActiveLead = () => {
  const context = useContext(ActiveLeadContext);
  if (context === undefined) {
    throw new Error('useActiveLead must be used within an ActiveLeadProvider');
  }
  return context;
};

export default ActiveLeadContext;
