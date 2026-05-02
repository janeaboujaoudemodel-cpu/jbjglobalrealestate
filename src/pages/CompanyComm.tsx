import MainLayout from '@/components/MainLayout';
import CompanyCommunicationHub from '@/components/communication/CompanyCommunicationHub';
import { motion } from 'framer-motion';

const CompanyComm = () => {
  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-6"
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Company Communication</h1>
          <p className="text-[#1A1A1A]/70">Connect with your team across all departments</p>
        </div>
        
        <CompanyCommunicationHub />
      </motion.div>
    </MainLayout>
  );
};

export default CompanyComm;
