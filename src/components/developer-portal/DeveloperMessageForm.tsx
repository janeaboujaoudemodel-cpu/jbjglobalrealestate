import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MessageSquare, Loader2, Upload, FileText, X, Send } from 'lucide-react';

interface DeveloperMessageFormProps {
  representativeId: string;
  developerName: string;
  autoApprove: boolean;
}

interface UploadedFile {
  name: string;
  url: string;
  type: string;
}

const DeveloperMessageForm = ({ representativeId, developerName, autoApprove }: DeveloperMessageFormProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [form, setForm] = useState({
    message_type: 'general',
    subject: '',
    content: '',
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploadingFiles(true);
    const uploaded: UploadedFile[] = [];
    for (const file of Array.from(fileList)) {
      try {
        const path = `developer-messages/${representativeId}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from('documents').upload(path, file);
        if (error) { toast.error(`Failed to upload ${file.name}`); continue; }
        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
        uploaded.push({ name: file.name, url: urlData.publicUrl, type: file.type });
      } catch { toast.error('Error uploading file'); }
    }
    setFiles(prev => [...prev, ...uploaded]);
    setUploadingFiles(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.content) {
      toast.error('Please enter your message content');
      return;
    }
    setSubmitting(true);
    try {
      const status = autoApprove ? 'approved' : 'pending_review';
      const { error } = await supabase.from('developer_messages').insert({
        representative_id: representativeId,
        user_id: user.id,
        developer_name: developerName,
        message_type: form.message_type,
        subject: form.subject || null,
        content: form.content,
        attachments: files,
        status,
      } as any);
      if (error) throw error;

      toast.success(autoApprove 
        ? 'Message published successfully!' 
        : 'Message submitted for review. You will be notified once approved.'
      );
      setForm({ message_type: 'general', subject: '', content: '' });
      setFiles([]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <MessageSquare className="w-5 h-5 text-gold" />
          Send Update / Message
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Share new project information, updates, or launch details with JBJ.
          {autoApprove && (
            <span className="ml-1 text-emerald-600 font-semibold">Auto-approve enabled</span>
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Message Type</Label>
            <Select value={form.message_type} onValueChange={(v) => setForm(f => ({ ...f, message_type: v }))}>
              <SelectTrigger className="border-gold/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Update</SelectItem>
                <SelectItem value="new_launch">New Launch Announcement</SelectItem>
                <SelectItem value="update">Project Update</SelectItem>
                <SelectItem value="commission">Commission / Incentive Info</SelectItem>
                <SelectItem value="motivational">Broker Motivation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. New Phase Launch - Q2 2026" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Message Content *</Label>
          <Textarea value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your update, launch details, or information here..." rows={5} />
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label>Attachments</Label>
          <div
            className="border-2 border-dashed border-gold/40 rounded-xl p-4 text-center hover:border-gold/70 transition-colors cursor-pointer bg-card/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-6 h-6 mx-auto text-gold/60 mb-1" />
            <p className="text-xs text-muted-foreground">Upload documents, images, or presentations</p>
            <input ref={fileInputRef} type="file" className="hidden" multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.pptx,.xlsx"
              onChange={handleFileUpload} />
          </div>
          {uploadingFiles && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
            </div>
          )}
          {files.length > 0 && (
            <div className="space-y-1">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-card border border-gold/20 text-sm">
                  <FileText className="w-3 h-3 text-gold shrink-0" />
                  <span className="truncate flex-1">{file.name}</span>
                  <button onClick={() => setFiles(f => f.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {form.message_type === 'commission' || form.message_type === 'motivational' ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            <strong>Note:</strong> Commission and motivational messages will be reviewed by our team and shared privately with approved brokers only. They will not appear on the public portal.
          </div>
        ) : null}

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-gradient-to-r from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border border-gold/40 text-foreground font-bold h-12"
        >
          {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : <><Send className="w-4 h-4 mr-2" /> Send Message</>}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DeveloperMessageForm;
