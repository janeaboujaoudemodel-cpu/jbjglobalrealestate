import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Calendar, Loader2, Upload, FileText, X, Clock, Send } from 'lucide-react';

interface BriefingRequestFormProps {
  representativeId: string;
  developerName: string;
}

interface UploadedFile {
  name: string;
  url: string;
  type: string;
}

const BriefingRequestForm = ({ representativeId, developerName }: BriefingRequestFormProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [form, setForm] = useState({
    project_name: '',
    briefing_date: '',
    briefing_time: '',
    duration_minutes: '60',
    notes: '',
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploadingFiles(true);
    const uploaded: UploadedFile[] = [];
    for (const file of Array.from(fileList)) {
      try {
        const path = `briefing-docs/${representativeId}/${Date.now()}-${file.name}`;
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
    if (!form.project_name || !form.briefing_date || !form.briefing_time) {
      toast.error('Please fill in project name, date, and time');
      return;
    }
    if (files.length === 0) {
      toast.error('Please upload project documents before requesting a briefing');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('briefing_requests').insert({
        representative_id: representativeId,
        user_id: user.id,
        developer_name: developerName,
        project_name: form.project_name,
        briefing_date: form.briefing_date,
        briefing_time: form.briefing_time,
        duration_minutes: parseInt(form.duration_minutes),
        notes: form.notes || null,
        uploaded_files: files,
      } as any);
      if (error) throw error;

      // Create admin task
      try {
        await supabase.from('admin_tasks').insert({
          user_id: '4944592b-93f1-4e05-ab59-4ebe1fee54f1',
          title: `Briefing Request: ${form.project_name} by ${developerName}`,
          description: `${developerName} rep requested a briefing for "${form.project_name}" on ${form.briefing_date} at ${form.briefing_time} (${form.duration_minutes} min). ${files.length} documents attached.`,
          category: 'briefing_request',
          priority: 'high',
          status: 'pending',
        } as any);
      } catch {}

      toast.success('Briefing request submitted! You will receive a confirmation email.');
      setForm({ project_name: '', briefing_date: '', briefing_time: '', duration_minutes: '60', notes: '' });
      setFiles([]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit briefing request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Calendar className="w-5 h-5 text-gold" />
          Request Briefing Session
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Schedule a project briefing with our team. Upload all documents before the session.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Project Name *</Label>
          <Input value={form.project_name} onChange={(e) => setForm(f => ({ ...f, project_name: e.target.value }))} placeholder="e.g. Damac Lagoons Phase 3" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Briefing Date *</Label>
            <Input type="date" value={form.briefing_date} onChange={(e) => setForm(f => ({ ...f, briefing_date: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Briefing Time *</Label>
            <Input type="time" value={form.briefing_time} onChange={(e) => setForm(f => ({ ...f, briefing_time: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Clock className="w-3 h-3" /> Duration</Label>
            <select
              value={form.duration_minutes}
              onChange={(e) => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="30">30 min</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Additional Notes</Label>
          <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Specific topics, attendees, special requirements..." rows={3} />
        </div>

        {/* File Upload */}
        <div className="space-y-3">
          <Label>Project Documents *</Label>
          <div
            className="border-2 border-dashed border-gold/40 rounded-xl p-6 text-center hover:border-gold/70 transition-colors cursor-pointer bg-card/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 mx-auto text-gold/60 mb-2" />
            <p className="text-sm font-medium text-foreground">Upload brochures, fact sheets, renders</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, images, presentations</p>
            <input ref={fileInputRef} type="file" className="hidden" multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.pptx,.xlsx"
              onChange={handleFileUpload} />
          </div>
          {uploadingFiles && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading files...
            </div>
          )}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-gold/20">
                  <FileText className="w-4 h-4 text-gold shrink-0" />
                  <span className="text-sm text-foreground truncate flex-1">{file.name}</span>
                  <button onClick={() => setFiles(f => f.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-gradient-to-r from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border border-gold/40 text-foreground font-bold h-12"
        >
          {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4 mr-2" /> Submit Briefing Request</>}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BriefingRequestForm;
