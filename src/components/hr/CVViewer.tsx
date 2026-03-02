import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Star, 
  Brain,
  Briefcase,
  GraduationCap,
  Award,
  Loader2,
  MessageSquare,
  Video
} from 'lucide-react';
import { format } from 'date-fns';

interface CVViewerProps {
  open: boolean;
  onClose: () => void;
  candidateId: string;
  candidateName: string;
  cvUrl: string | null;
  cvFileName: string | null;
  candidateData?: {
    email?: string;
    phone?: string;
    position?: string;
    nationality?: string;
    location?: string;
    uploadDate?: Date;
    aiAnalysis?: {
      experience: string;
      education: string;
      skills: string[];
      certifications: string[];
      achievements: string[];
      relevanceScore: number;
      recommendation: string;
    };
  };
}

const Label = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <p className={`text-sm font-medium ${className}`}>{children}</p>
);

const CVViewer = ({
  open,
  onClose,
  candidateId,
  candidateName,
  cvUrl,
  cvFileName,
  candidateData
}: CVViewerProps) => {
  const [loading, setLoading] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('preview');

  useEffect(() => {
    if (open && cvUrl) {
      getSignedUrl();
    }
  }, [open, cvUrl]);

  const getSignedUrl = async () => {
    if (!cvUrl) return;
    
    setLoading(true);
    try {
      const isWordDoc = /\.(docx?|odt)$/i.test(cvUrl);

      // For Word docs, we need a publicly accessible URL for Google Docs viewer
      if (isWordDoc) {
        const { data, error } = await supabase.storage
          .from('hr-documents')
          .createSignedUrl(cvUrl, 3600);
        if (!error && data?.signedUrl) {
          setSignedUrl(`https://docs.google.com/gview?url=${encodeURIComponent(data.signedUrl)}&embedded=true`);
        } else {
          toast.error('Unable to load Word document preview.');
        }
        return;
      }

      // For PDF/images: download as blob to bypass CORS/auth issues
      const buckets = ['hr-documents', 'documents', 'public'];
      let downloaded = false;

      for (const bucket of buckets) {
        const { data, error } = await supabase.storage
          .from(bucket)
          .download(cvUrl);
        
        if (!error && data) {
          // Ensure correct MIME type for PDFs
          let blob = data;
          if (/\.pdf$/i.test(cvUrl) && (!blob.type || blob.type === 'application/octet-stream')) {
            blob = new Blob([data], { type: 'application/pdf' });
          }
          const objectUrl = URL.createObjectURL(blob);
          setSignedUrl(objectUrl);
          downloaded = true;
          break;
        }
      }

      if (!downloaded) {
        toast.error('Unable to load CV preview. Try downloading instead.');
      }
    } catch (error) {
      console.error('Error loading CV:', error);
      toast.error('Error loading CV');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!cvUrl) {
      toast.error('No CV file available');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('hr-documents')
        .download(cvUrl);

      if (error) throw error;

      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = cvFileName || `${candidateName}_CV.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('CV downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download CV');
    }
  };

  const handleOpenExternal = () => {
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    }
  };

  const handleContact = (type: 'email' | 'phone' | 'whatsapp') => {
    if (!candidateData) return;

    switch (type) {
      case 'email':
        if (candidateData.email) {
          window.location.href = `mailto:${candidateData.email}?subject=Interview Invitation - JBJ Global Real Estate&body=Dear ${candidateName},%0D%0A%0D%0AWe are pleased to invite you for an interview...`;
        }
        break;
      case 'phone':
        if (candidateData.phone) {
          window.location.href = `tel:${candidateData.phone}`;
        }
        break;
      case 'whatsapp':
        if (candidateData.phone) {
          const phone = candidateData.phone.replace(/[^0-9]/g, '');
          window.open(`https://wa.me/${phone}?text=Hello ${candidateName}, this is JBJ Global Real Estate...`, '_blank');
        }
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl h-[90dvh] p-0 bg-gradient-to-br from-[#FDFBF7] to-[#F5EBD7] border-2 border-gold/30">
        <DialogHeader className="p-4 border-b border-gold/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                <span className="text-xl font-bold text-gold">{candidateName.charAt(0)}</span>
              </div>
              <div>
                <DialogTitle className="text-xl text-black">{candidateName}</DialogTitle>
                <p className="text-sm text-zinc-600">{candidateData?.position || 'Candidate'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-2 border-gold/30 hover:bg-gold/10"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenExternal}
                disabled={!signedUrl}
                className="gap-2 border-gold/30 hover:bg-gold/10"
              >
                <ExternalLink className="h-4 w-4" />
                Open
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Sidebar with candidate info */}
          <div className="w-80 border-r border-gold/20 p-4 overflow-y-auto">
            <div className="space-y-4">
              {/* Contact Info */}
              <Card className="bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] border-2 border-gold/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-black flex items-center gap-2">
                    <User className="h-4 w-4 text-gold" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {candidateData?.email && (
                    <div className="flex items-center gap-2 text-zinc-600">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{candidateData.email}</span>
                    </div>
                  )}
                  {candidateData?.phone && (
                    <div className="flex items-center gap-2 text-zinc-600">
                      <Phone className="h-3 w-3" />
                      <span>{candidateData.phone}</span>
                    </div>
                  )}
                  {candidateData?.nationality && (
                    <div className="flex items-center gap-2 text-zinc-600">
                      <MapPin className="h-3 w-3" />
                      <span>{candidateData.nationality}</span>
                    </div>
                  )}
                  {candidateData?.uploadDate && (
                    <div className="flex items-center gap-2 text-zinc-600">
                      <Calendar className="h-3 w-3" />
                      <span>Applied: {format(candidateData.uploadDate, 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] border-2 border-gold/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-black">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 border-gold/30 hover:bg-gold/10"
                    onClick={() => handleContact('email')}
                    disabled={!candidateData?.email}
                  >
                    <Mail className="h-4 w-4" />
                    Send Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 text-green-600 border-green-500/50 hover:bg-green-500/10"
                    onClick={() => handleContact('whatsapp')}
                    disabled={!candidateData?.phone}
                  >
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 text-blue-600 border-blue-500/50 hover:bg-blue-500/10"
                    onClick={() => handleContact('phone')}
                    disabled={!candidateData?.phone}
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </Button>
                  <Button
                    size="sm"
                    className="w-full justify-start gap-2 bg-gold text-black hover:bg-gold/90"
                    onClick={() => window.open('/video-meeting', '_blank')}
                  >
                    <Video className="h-4 w-4" />
                    Schedule Interview
                  </Button>
                </CardContent>
              </Card>

              {/* AI Analysis */}
              {candidateData?.aiAnalysis && (
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-2 border-purple-300/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-purple-700 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      AI Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600">Relevance Score</span>
                      <Badge className="bg-purple-600">
                        <Star className="h-3 w-3 mr-1" />
                        {candidateData.aiAnalysis.relevanceScore}%
                      </Badge>
                    </div>
                    
                    <div>
                      <span className="text-zinc-600 flex items-center gap-1 mb-1">
                        <Briefcase className="h-3 w-3" /> Experience
                      </span>
                      <p className="text-black text-xs">{candidateData.aiAnalysis.experience}</p>
                    </div>

                    <div>
                      <span className="text-zinc-600 flex items-center gap-1 mb-1">
                        <GraduationCap className="h-3 w-3" /> Education
                      </span>
                      <p className="text-black text-xs">{candidateData.aiAnalysis.education}</p>
                    </div>

                    {candidateData.aiAnalysis.skills.length > 0 && (
                      <div>
                        <span className="text-zinc-600 mb-1 block">Skills</span>
                        <div className="flex flex-wrap gap-1">
                          {candidateData.aiAnalysis.skills.slice(0, 5).map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs border-gold/30 text-gold">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {candidateData.aiAnalysis.certifications.length > 0 && (
                      <div>
                        <span className="text-zinc-600 flex items-center gap-1 mb-1">
                          <Award className="h-3 w-3" /> Certifications
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {candidateData.aiAnalysis.certifications.map((cert, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs border-green-500/30 text-green-600">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-purple-300/50">
                      <span className="text-zinc-600 mb-1 block text-xs">AI Recommendation</span>
                      <p className="text-purple-700 text-xs italic">"{candidateData.aiAnalysis.recommendation}"</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Main content - CV Preview */}
          <div className="flex-1 p-4 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="mb-4 bg-gradient-to-r from-[#F5EBD7] to-[#E8DCC8] border-2 border-gold/30">
                <TabsTrigger value="preview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40">
                  Document Preview
                </TabsTrigger>
                <TabsTrigger value="details" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40">
                  Application Details
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="flex-1 overflow-hidden">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gold" />
                    <span className="ml-2 text-zinc-600">Loading document...</span>
                  </div>
                ) : signedUrl ? (
                  <iframe
                    src={signedUrl}
                    className="w-full h-full border-2 border-gold/20 rounded-lg"
                    title="CV Preview"
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <FileText className="h-16 w-16 text-zinc-400 mb-4" />
                    <h3 className="text-lg font-semibold text-black mb-2">CV Not Available</h3>
                    <p className="text-zinc-600 mb-4">
                      {cvUrl ? 'Unable to load CV preview. Try downloading instead.' : 'No CV file has been uploaded.'}
                    </p>
                    {cvUrl && (
                      <Button onClick={handleDownload} className="bg-gold text-black hover:bg-gold/90">
                        <Download className="h-4 w-4 mr-2" />
                        Download CV
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="details" className="flex-1 overflow-auto">
                <Card className="bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] border-2 border-gold/30">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-zinc-600">Full Name</Label>
                        <p className="text-black">{candidateName}</p>
                      </div>
                      <div>
                        <Label className="text-zinc-600">Position Applied</Label>
                        <p className="text-black">{candidateData?.position || 'Not specified'}</p>
                      </div>
                      <div>
                        <Label className="text-zinc-600">Email</Label>
                        <p className="text-black">{candidateData?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-zinc-600">Phone</Label>
                        <p className="text-black">{candidateData?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-zinc-600">Nationality</Label>
                        <p className="text-black">{candidateData?.nationality || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-zinc-600">Application Date</Label>
                        <p className="text-black">
                          {candidateData?.uploadDate ? format(candidateData.uploadDate, 'MMMM d, yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-zinc-600">CV File</Label>
                        <p className="text-black flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gold" />
                          {cvFileName || 'No file uploaded'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CVViewer;
