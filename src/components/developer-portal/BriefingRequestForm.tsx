import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { LanguageMultiSelect } from '@/components/ui/language-multi-select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2, Upload, FileText, X, Clock, Send, MapPin, Building2, AlertTriangle } from 'lucide-react';

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [languages, setLanguages] = useState<string[]>(['English']);
  const [form, setForm] = useState({
    project_name: '',
    briefing_time: '',
    duration_minutes: '60',
    notes: '',
    location_type: 'developer_office',
    location_address: '',
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
    if (!form.project_name || !selectedDate || !form.briefing_time) {
      toast.error('Please fill in project name, date, and time');
      return;
    }
    if (files.length === 0) {
      toast.error('Please upload project documents before requesting a briefing');
      return;
    }
    setSubmitting(true);
    try {
      const briefingDate = format(selectedDate, 'yyyy-MM-dd');
      const { error } = await supabase.from('briefing_requests').insert({
        representative_id: representativeId,
        user_id: user.id,
        developer_name: developerName,
        project_name: form.project_name,
        briefing_date: briefingDate,
        briefing_time: form.briefing_time,
        duration_minutes: parseInt(form.duration_minutes),
        notes: form.notes || null,
        uploaded_files: files,
        location_type: form.location_type,
        location_address: form.location_type === 'developer_office' ? form.location_address : null,
      } as any);
      if (error) throw error;

      // Log activity for the rep (+3 points for briefing request)
      try {
        await supabase.from('rep_activity_log').insert({
          representative_id: representativeId,
          activity_type: 'briefing_hosted',
          description: `Briefing requested for ${form.project_name}`,
          points_earned: 3,
        } as any);
        // Update rep activity score
        await supabase.from('developer_representatives').update({
          activity_score: 3,
        } as any).eq('id', representativeId).then(() => {});
      } catch {}

      // Create admin task
      try {
        const locationLabel = form.location_type === 'developer_office' 
          ? `at Developer Office${form.location_address ? ` (${form.location_address})` : ''}`
          : 'at Our Office';
        await supabase.from('admin_tasks').insert({
          user_id: '4944592b-93f1-4e05-ab59-4ebe1fee54f1',
          title: `Briefing Request: ${form.project_name} by ${developerName}`,
          description: `${developerName} rep requested a briefing for "${form.project_name}" on ${briefingDate} at ${form.briefing_time} (${form.duration_minutes} min) ${locationLabel}. Languages: ${languages.join(', ')}. ${files.length} documents attached.`,
          category: 'briefing_request',
          priority: 'high',
          status: 'pending',
        } as any);
      } catch {}

      toast.success('Briefing request submitted! You will receive a confirmation once approved.');
      setForm({ project_name: '', briefing_time: '', duration_minutes: '60', notes: '', location_type: 'developer_office', location_address: '' });
      setSelectedDate(undefined);
      setLanguages(['English']);
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
          <CalendarIcon className="w-5 h-5 text-gold" />
          Request Briefing Session
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Schedule a project briefing with our team. Upload all documents before the session.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Project Name */}
        <div className="space-y-2">
          <Label>Project Name *</Label>
          <Input value={form.project_name} onChange={(e) => setForm(f => ({ ...f, project_name: e.target.value }))} placeholder="e.g. Damac Lagoons Phase 3" />
        </div>

        {/* Location Type */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gold" /> Briefing Location *
          </Label>
          <RadioGroup
            value={form.location_type}
            onValueChange={(val) => setForm(f => ({ ...f, location_type: val }))}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            {/* Developer Office - Active */}
            <div className={cn(
              "flex items-center space-x-3 rounded-xl border-2 p-4 cursor-pointer transition-all",
              form.location_type === 'developer_office'
                ? "border-gold bg-gold/10 shadow-md"
                : "border-gold/20 hover:border-gold/40"
            )}>
              <RadioGroupItem value="developer_office" id="loc-dev" />
              <label htmlFor="loc-dev" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gold" />
                  <span className="font-semibold text-foreground">Developer Sales Office</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Briefing at your sales gallery</p>
              </label>
            </div>

            {/* Our Office - Disabled */}
            <div className="flex items-center space-x-3 rounded-xl border-2 border-muted/40 p-4 opacity-50 cursor-not-allowed bg-muted/10 relative overflow-hidden">
              <RadioGroupItem value="our_office" id="loc-our" disabled />
              <label htmlFor="loc-our" className="flex-1">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-muted-foreground">Our Sales Office</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">JBJ Global headquarters</p>
              </label>
              <Badge className="absolute top-2 right-2 bg-amber-500/20 text-amber-700 border-amber-500/30 text-[10px]">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Under Renovation
              </Badge>
            </div>
          </RadioGroup>

          {/* Location Address */}
          {form.location_type === 'developer_office' && (
            <div className="space-y-2 pl-1">
              <Label className="text-sm">Sales Office Address</Label>
              <Input
                value={form.location_address}
                onChange={(e) => setForm(f => ({ ...f, location_address: e.target.value }))}
                placeholder="e.g. Downtown Dubai, Damac Hills Sales Center"
              />
            </div>
          )}
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Briefing Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
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

        {/* Languages */}
        <div className="space-y-2">
          <Label>Languages Spoken by Representative</Label>
          <LanguageMultiSelect value={languages} onChange={setLanguages} />
        </div>

        {/* Notes */}
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
