import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, FileText, Upload, Download, Calendar, 
  Briefcase, Mail, Phone, Search, Plus, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CVRecord {
  id: string;
  candidateName: string;
  position: string;
  email: string;
  phone: string;
  uploadDate: Date;
  fileName: string;
  fileUrl: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected';
}

interface EmployeeCenterProps {
  userId: string;
}

const EmployeeCenter = ({ userId }: EmployeeCenterProps) => {
  const [cvRecords, setCvRecords] = useState<CVRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    candidateName: '',
    position: '',
    email: '',
    phone: ''
  });

  // Mock initial data
  useEffect(() => {
    setCvRecords([
      {
        id: '1',
        candidateName: 'Ahmed Hassan',
        position: 'Senior Broker',
        email: 'ahmed@example.com',
        phone: '+971 50 123 4567',
        uploadDate: new Date('2024-01-08'),
        fileName: 'Ahmed_Hassan_CV.pdf',
        fileUrl: '#',
        status: 'shortlisted'
      },
      {
        id: '2',
        candidateName: 'Sarah Johnson',
        position: 'Property Consultant',
        email: 'sarah@example.com',
        phone: '+971 55 987 6543',
        uploadDate: new Date('2024-01-07'),
        fileName: 'Sarah_Johnson_Resume.pdf',
        fileUrl: '#',
        status: 'pending'
      },
      {
        id: '3',
        candidateName: 'Mohamed Ali',
        position: 'Marketing Manager',
        email: 'mohamed@example.com',
        phone: '+971 52 456 7890',
        uploadDate: new Date('2024-01-06'),
        fileName: 'Mohamed_Ali_CV.pdf',
        fileUrl: '#',
        status: 'reviewed'
      }
    ]);
  }, []);

  const filteredRecords = cvRecords.filter(record =>
    record.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!uploadForm.candidateName || !uploadForm.email) {
      toast.error('Please fill in candidate name and email');
      return;
    }

    setIsUploading(true);

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newRecord: CVRecord = {
      id: Date.now().toString(),
      candidateName: uploadForm.candidateName,
      position: uploadForm.position || 'Unspecified',
      email: uploadForm.email,
      phone: uploadForm.phone || 'N/A',
      uploadDate: new Date(),
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      status: 'pending'
    };

    setCvRecords(prev => [newRecord, ...prev]);
    setUploadForm({ candidateName: '', position: '', email: '', phone: '' });
    setShowUploadForm(false);
    setIsUploading(false);
    toast.success(`CV uploaded successfully for ${uploadForm.candidateName}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shortlisted': return 'bg-green-600 text-white';
      case 'reviewed': return 'bg-blue-600 text-white';
      case 'rejected': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const stats = {
    total: cvRecords.length,
    pending: cvRecords.filter(r => r.status === 'pending').length,
    shortlisted: cvRecords.filter(r => r.status === 'shortlisted').length,
    reviewed: cvRecords.filter(r => r.status === 'reviewed').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="h-7 w-7 text-gold" />
            Employee Center
          </h2>
          <p className="text-muted-foreground mt-1">Manage employees and collect CVs</p>
        </div>
        <Button 
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="bg-gold text-black hover:bg-gold/90 font-semibold"
        >
          <Plus className="h-4 w-4 mr-2" />
          Upload CV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total CVs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Eye className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.reviewed}</p>
                <p className="text-xs text-muted-foreground">Reviewed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.shortlisted}</p>
                <p className="text-xs text-muted-foreground">Shortlisted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <Card className="bg-card border-gold/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Upload className="h-5 w-5 text-gold" />
              Upload New CV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Candidate Name *"
                value={uploadForm.candidateName}
                onChange={(e) => setUploadForm(prev => ({ ...prev, candidateName: e.target.value }))}
                className="bg-background border-border text-white"
              />
              <Input
                placeholder="Position Applied For"
                value={uploadForm.position}
                onChange={(e) => setUploadForm(prev => ({ ...prev, position: e.target.value }))}
                className="bg-background border-border text-white"
              />
              <Input
                placeholder="Email Address *"
                type="email"
                value={uploadForm.email}
                onChange={(e) => setUploadForm(prev => ({ ...prev, email: e.target.value }))}
                className="bg-background border-border text-white"
              />
              <Input
                placeholder="Phone Number"
                value={uploadForm.phone}
                onChange={(e) => setUploadForm(prev => ({ ...prev, phone: e.target.value }))}
                className="bg-background border-border text-white"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex-1">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-gold/50 transition-colors">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload CV, Cover Letter, or Documents
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, DOC (Max 10MB)</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
            {isUploading && (
              <div className="flex items-center gap-2 text-gold">
                <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                <span className="text-sm">Uploading...</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CV Records */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-gold" />
              CV Collected
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background border-border text-white"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No CVs found</p>
              </div>
            ) : (
              filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border hover:border-gold/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                      <span className="text-lg font-bold text-gold">
                        {record.candidateName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{record.candidateName}</h4>
                      <p className="text-sm text-muted-foreground">{record.position}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {record.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {record.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge className={getStatusColor(record.status)}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(record.uploadDate, 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-white border-border hover:bg-muted"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gold border-gold/30 hover:bg-gold/10"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeCenter;
