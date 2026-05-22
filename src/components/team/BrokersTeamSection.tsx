import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTeamVisibility, brokerKey } from '@/hooks/useTeamVisibility';
import VisibilityToggleButton from './VisibilityToggleButton';

interface BrokerRow {
  id: string;
  full_name: string | null;
  nationality: string | null;
  languages: string[] | null;
  role_title: string | null;
  position_title: string | null;
  current_company: string | null;
}

interface Props {
  isOwner: boolean;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const BrokersTeamSection: React.FC<Props> = ({ isOwner }) => {
  const [brokers, setBrokers] = useState<BrokerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { isMemberVisible, loaded: visLoaded } = useTeamVisibility();

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data, error } = await supabase
        .from('crm_brokers')
        .select('id, full_name, nationality, languages, role_title, position_title, current_company')
        .eq('invitation_status', 'activated')
        .order('full_name', { ascending: true });
      if (!cancel) {
        if (!error && data) setBrokers(data as BrokerRow[]);
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  if (loading || !visLoaded) return null;

  const visibleBrokers = isOwner
    ? brokers
    : brokers.filter((b) => isMemberVisible(brokerKey(b.id)));

  if (visibleBrokers.length === 0) return null;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={stagger}
      className="mb-8"
    >
      <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-[#B89555]/30 rounded-2xl p-4 sm:p-6">
        <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-[#FDFBF7] to-[#EFE6D6] border border-[#B89555]/40 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#1A1A1A]" />
          </div>
          <div>
            <h2 className="text-[#1A1A1A] text-2xl font-semibold">Brokers</h2>
            <p className="text-[#1A1A1A]/70 text-sm">
              {visibleBrokers.length} active broker{visibleBrokers.length === 1 ? '' : 's'}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {visibleBrokers.map((b) => {
            const hidden = isOwner && !isMemberVisible(brokerKey(b.id));
            return (
              <motion.div key={b.id} variants={fadeInUp}>
                <Card
                  className={`relative bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555] shadow-[0_0_20px_rgba(200,167,102,0.2)] overflow-hidden h-full ${hidden ? 'opacity-50' : ''}`}
                >
                  {isOwner && (
                    <VisibilityToggleButton
                      memberId={brokerKey(b.id)}
                      label={b.full_name || 'Broker'}
                    />
                  )}
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-[#1A1A1A]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[#1A1A1A] font-semibold text-base truncate">
                          {b.full_name || 'Unnamed Broker'}
                        </h3>
                        <p className="text-sm text-[#1A1A1A] truncate">
                          {b.role_title || b.position_title || 'Real Estate Broker'}
                        </p>
                        {b.current_company && (
                          <p className="text-xs text-[#1A1A1A]/70 truncate">{b.current_company}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {b.nationality && (
                        <Badge variant="outline" className="text-[10px] border-[#B89555]/30 text-[#1A1A1A] bg-[#EFE6D6]/30">
                          {b.nationality}
                        </Badge>
                      )}
                      {(b.languages || []).slice(0, 3).map((lang) => (
                        <Badge key={lang} variant="outline" className="text-[10px] border-[#B89555]/30 text-[#1A1A1A] bg-[#EFE6D6]/30">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default BrokersTeamSection;
