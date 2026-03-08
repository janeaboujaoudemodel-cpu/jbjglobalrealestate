import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  FileText,
  Upload,
  Plus,
  Search,
  FolderOpen,
  FileJson,
  Calendar,
  Clock,
  Download,
  Share2,
  Trash2,
  Edit3,
  CheckCircle,
  AlertCircle,
  Sparkles,
  BookOpen,
  ListTodo,
  FileDown,
  Loader2,
  X,
  Tag,
  Archive,
  RefreshCw,
  Brain,
  Target,
  MessageSquare,
  Save,
  Square
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Note {
  id: string;
  title: string;
  content: string;
  source_type: string;
  ai_summary?: string;
  ai_action_items?: any[];
  ai_key_points?: any[];
  ai_schedule?: any[];
  tags?: string[];
  project_id?: string;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
}

export function AINoteCenter() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  
  // Recording state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // New note form
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    project_id: '',
    tags: [] as string[]
  });
  
  // New project form
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    color: '#A8925A'
  });

  useEffect(() => {
    if (user) {
      fetchNotes();
      fetchProjects();
    }
  }, [user]);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('ai_notes')
      .select('*')
      .eq('is_archived', false)
      .order('created_at', { ascending: false });
    
    if (data && !error) {
      setNotes(data as Note[]);
    }
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('note_projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data && !error) {
      setProjects(data as Project[]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        await processRecording();
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const processRecording = async () => {
    if (chunksRef.current.length === 0) return;

    setIsProcessing(true);
    
    try {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Transcribe using voice-to-text edge function
        const { data: transcriptData, error: transcriptError } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio }
        });

        if (transcriptError) throw transcriptError;

        const transcript = transcriptData?.text || '';

        // Process with AI to extract notes
        const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-meeting-summarizer', {
          body: {
            transcript,
            meetingType: 'Voice Note',
            participants: 'Self',
            propertyDiscussed: 'N/A'
          }
        });

        // Save the note
        const { data: noteData, error: noteError } = await supabase
          .from('ai_notes')
          .insert({
            user_id: user?.id,
            title: `Voice Note - ${new Date().toLocaleDateString()}`,
            content: transcript,
            source_type: 'voice',
            ai_summary: aiData?.summary || null,
            ai_action_items: extractActionItems(aiData?.summary),
            ai_key_points: extractKeyPoints(aiData?.summary)
          })
          .select()
          .single();

        if (noteData) {
          setNotes(prev => [noteData as Note, ...prev]);
          toast.success('Voice note saved and processed!');
        }
      };

      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error processing recording:', error);
      toast.error('Failed to process recording');
    } finally {
      setIsProcessing(false);
    }
  };

  const extractActionItems = (summary: string | undefined): any[] => {
    if (!summary) return [];
    const actionMatch = summary.match(/ACTION ITEMS[\s\S]*?(?=##|$)/i);
    if (!actionMatch) return [];
    const items = actionMatch[0].match(/- \[[ x]\] .+/g) || [];
    return items.map((item, i) => ({
      id: i,
      text: item.replace(/- \[[ x]\] /, ''),
      completed: item.includes('[x]')
    }));
  };

  const extractKeyPoints = (summary: string | undefined): any[] => {
    if (!summary) return [];
    const pointsMatch = summary.match(/KEY.*?POINTS[\s\S]*?(?=##|$)/i);
    if (!pointsMatch) return [];
    const points = pointsMatch[0].match(/- .+/g) || [];
    return points.map((point, i) => ({
      id: i,
      text: point.replace(/^- /, '')
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    try {
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64Content = (reader.result as string).split(',')[1];
        
        // Parse document using document parser
        const { data: parseData, error: parseError } = await supabase.functions.invoke('parse-document', {
          body: { 
            file_content: base64Content,
            file_name: file.name,
            file_type: file.type
          }
        });

        if (parseError) {
          // Fallback: just save raw text for text files
          if (file.type.includes('text')) {
            const text = await file.text();
            await saveExtractedNote(file.name, text);
          } else {
            throw parseError;
          }
        } else {
          await saveExtractedNote(file.name, parseData?.content || '');
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to process file');
    } finally {
      setIsProcessing(false);
      setShowUploadDialog(false);
    }
  };

  const saveExtractedNote = async (fileName: string, content: string) => {
    // Process with AI to extract key information
    const { data: aiData } = await supabase.functions.invoke('ai-meeting-summarizer', {
      body: {
        transcript: content.substring(0, 4000),
        meetingType: 'Document Extract',
        participants: 'N/A',
        propertyDiscussed: 'N/A'
      }
    });

    const { data: noteData, error } = await supabase
      .from('ai_notes')
      .insert({
        user_id: user?.id,
        title: `Extracted: ${fileName}`,
        content,
        source_type: fileName.endsWith('.pdf') ? 'pdf_extract' : 'document_extract',
        ai_summary: aiData?.summary || null,
        ai_action_items: extractActionItems(aiData?.summary),
        ai_key_points: extractKeyPoints(aiData?.summary)
      })
      .select()
      .single();

    if (noteData) {
      setNotes(prev => [noteData as Note, ...prev]);
      toast.success('Document extracted and saved!');
    }
  };

  const saveNote = async () => {
    if (!newNote.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsProcessing(true);

    try {
      // Process with AI if content is substantial
      let aiData = null;
      if (newNote.content.length > 100) {
        const { data } = await supabase.functions.invoke('ai-meeting-summarizer', {
          body: {
            transcript: newNote.content,
            meetingType: 'Manual Note',
            participants: 'Self',
            propertyDiscussed: 'N/A'
          }
        });
        aiData = data;
      }

      const { data: noteData, error } = await supabase
        .from('ai_notes')
        .insert({
          user_id: user?.id,
          title: newNote.title,
          content: newNote.content,
          source_type: 'manual',
          project_id: newNote.project_id || null,
          tags: newNote.tags.length > 0 ? newNote.tags : null,
          ai_summary: aiData?.summary || null,
          ai_action_items: extractActionItems(aiData?.summary),
          ai_key_points: extractKeyPoints(aiData?.summary)
        })
        .select()
        .single();

      if (noteData) {
        setNotes(prev => [noteData as Note, ...prev]);
        setNewNote({ title: '', content: '', project_id: '', tags: [] });
        setShowNoteEditor(false);
        toast.success('Note saved!');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    } finally {
      setIsProcessing(false);
    }
  };

  const createProject = async () => {
    if (!newProject.name.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    const { data, error } = await supabase
      .from('note_projects')
      .insert({
        user_id: user?.id,
        name: newProject.name,
        description: newProject.description,
        color: newProject.color
      })
      .select()
      .single();

    if (data) {
      setProjects(prev => [data as Project, ...prev]);
      setNewProject({ name: '', description: '', color: '#A8925A' });
      setShowProjectDialog(false);
      toast.success('Project created!');
    }
  };

  const deleteNote = async (noteId: string) => {
    const { error } = await supabase
      .from('ai_notes')
      .update({ is_archived: true })
      .eq('id', noteId);

    if (!error) {
      setNotes(prev => prev.filter(n => n.id !== noteId));
      toast.success('Note moved to Recently Deleted (30 days to restore)', {
        action: {
          label: 'Undo',
          onClick: async () => {
            await supabase.from('ai_notes').update({ is_archived: false }).eq('id', noteId);
            fetchNotes();
            toast.success('Note restored');
          },
        },
      });
    }
  };

  const restoreNote = async (noteId: string) => {
    const { error } = await supabase
      .from('ai_notes')
      .update({ is_archived: false })
      .eq('id', noteId);

    if (!error) {
      toast.success('Note restored');
      fetchNotes();
      fetchArchivedNotes();
    }
  };

  const permanentlyDeleteNote = async (noteId: string) => {
    const { error } = await supabase
      .from('ai_notes')
      .delete()
      .eq('id', noteId);

    if (!error) {
      toast.success('Note permanently deleted');
      fetchArchivedNotes();
    }
  };

  const [archivedNotes, setArchivedNotes] = useState<Note[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  const fetchArchivedNotes = async () => {
    const { data, error } = await supabase
      .from('ai_notes')
      .select('*')
      .eq('is_archived', true)
      .order('updated_at', { ascending: false });
    
    if (data && !error) {
      setArchivedNotes(data as Note[]);
    }
  };

  const generatePDF = async (note: Note) => {
    toast.info('Generating PDF...', { duration: 2000 });
    
    // Create a simple PDF content
    const pdfContent = `
# ${note.title}

Created: ${new Date(note.created_at).toLocaleString()}

## Content
${note.content}

${note.ai_summary ? `## AI Summary\n${note.ai_summary}` : ''}

${note.ai_action_items?.length ? `## Action Items\n${note.ai_action_items.map(a => `- ${a.text}`).join('\n')}` : ''}
    `;

    // Create and download blob
    const blob = new Blob([pdfContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Document downloaded!');
  };

  const filteredNotes = notes.filter(note => {
    const matchesProject = selectedProject === 'all' || note.project_id === selectedProject;
    const matchesSearch = !searchQuery || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProject && matchesSearch;
  });

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Voice Recording Card */}
        <Card 
          className={`bg-white border-2 border-[#C9A84C]/20 hover:border-[#C9A84C]/40 transition-all cursor-pointer group ${
            isRecording ? 'border-red-300 bg-red-50' : ''
          }`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${
              isRecording ? 'bg-red-500 animate-pulse' : 'bg-[#C9A84C]/10'
            }`}>
              {isRecording ? (
                <Square className="w-6 h-6 text-white fill-white" />
              ) : (
                <Mic className="w-6 h-6 text-[#C9A84C]" />
              )}
            </div>
            {isRecording ? (
              <>
                <h3 className="text-red-600 font-semibold">Recording...</h3>
                <p className="text-lg text-black mt-1">{formatRecordingTime(recordingTime)}</p>
                <p className="text-xs text-red-500 mt-1">Click to stop</p>
              </>
            ) : (
              <>
                <h3 className="text-black font-semibold">Voice Note</h3>
                <p className="text-sm text-zinc-500 mt-1">Record & transcribe</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* New Note Card */}
        <Card 
          className="bg-white border-2 border-[#C9A84C]/20 hover:border-[#C9A84C]/40 transition-all cursor-pointer group"
          onClick={() => setShowNoteEditor(true)}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-black font-semibold">New Note</h3>
            <p className="text-sm text-zinc-500 mt-1">Create manually</p>
          </CardContent>
        </Card>

        {/* Upload Document Card */}
        <Card 
          className="bg-white border-2 border-[#C9A84C]/20 hover:border-[#C9A84C]/40 transition-all cursor-pointer group"
          onClick={() => setShowUploadDialog(true)}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-black font-semibold">Upload</h3>
            <p className="text-sm text-zinc-500 mt-1">PDF, DOC, TXT</p>
          </CardContent>
        </Card>

        {/* New Project Card */}
        <Card 
          className="bg-white border-2 border-[#C9A84C]/20 hover:border-[#C9A84C]/40 transition-all cursor-pointer group"
          onClick={() => setShowProjectDialog(true)}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FolderOpen className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-black font-semibold">New Project</h3>
            <p className="text-sm text-zinc-500 mt-1">Organize notes</p>
          </CardContent>
        </Card>
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <Card className="bg-[#C9A84C]/10 border border-[#C9A84C]/30">
          <CardContent className="p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-[#C9A84C] animate-spin" />
            <div>
              <p className="text-black font-medium">Processing...</p>
              <p className="text-sm text-zinc-500">Extracting key points and action items</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-50 border-[#C9A84C]/20 text-black"
          />
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-full md:w-[200px] bg-zinc-50 border-[#C9A84C]/20 text-black">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                  {project.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.map(note => (
          <Card 
            key={note.id} 
            className="bg-white border-2 border-[#C9A84C]/20 hover:border-[#C9A84C]/40 transition-all cursor-pointer group"
            onClick={() => setActiveNote(note)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {note.source_type === 'voice' && <Mic className="w-4 h-4 text-red-500" />}
                  {note.source_type === 'pdf_extract' && <FileText className="w-4 h-4 text-blue-600" />}
                  {note.source_type === 'manual' && <Edit3 className="w-4 h-4 text-purple-600" />}
                  {note.source_type === 'meeting' && <MessageSquare className="w-4 h-4 text-green-600" />}
                  <h3 className="text-black font-medium truncate">{note.title}</h3>
                </div>
                <Badge variant="outline" className="text-xs border-[#C9A84C]/30 text-[#C9A84C]">
                  {note.source_type}
                </Badge>
              </div>
              
              <p className="text-zinc-500 text-sm line-clamp-3 mb-3">
                {note.content?.substring(0, 150)}...
              </p>

              {note.ai_action_items && note.ai_action_items.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <ListTodo className="w-3 h-3 text-[#C9A84C]" />
                  <span className="text-xs text-[#C9A84C]">{note.ai_action_items.length} action items</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(note.created_at).toLocaleDateString()}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6"
                    onClick={(e) => { e.stopPropagation(); generatePDF(note); }}
                  >
                    <FileDown className="w-3 h-3 text-[#C9A84C]" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6"
                    onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredNotes.length === 0 && (
          <div className="col-span-full text-center py-12">
            <BookOpen className="w-12 h-12 text-[#C9A84C]/30 mx-auto mb-4" />
            <p className="text-zinc-500">No notes yet</p>
            <p className="text-sm text-zinc-400 mt-1">Start by recording a voice note or creating a new note</p>
          </div>
        )}
      </div>

      {/* Note Viewer Dialog */}
      <Dialog open={!!activeNote} onOpenChange={() => setActiveNote(null)}>
        <DialogContent className="bg-white border-2 border-[#C9A84C]/30 max-w-3xl max-h-[80vh] overflow-y-auto">
          {activeNote && (
            <>
              <DialogHeader>
                <DialogTitle className="text-black flex items-center gap-2">
                  {activeNote.source_type === 'voice' && <Mic className="w-5 h-5 text-red-500" />}
                  {activeNote.source_type === 'pdf_extract' && <FileText className="w-5 h-5 text-blue-600" />}
                  {activeNote.source_type === 'manual' && <Edit3 className="w-5 h-5 text-purple-600" />}
                  {activeNote.title}
                </DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="content" className="mt-4">
                <TabsList className="bg-zinc-50 border border-[#C9A84C]/20">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="actions">Action Items</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="mt-4">
                  <div className="prose max-w-none">
                    <p className="text-zinc-700 whitespace-pre-wrap">{activeNote.content}</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="summary" className="mt-4">
                  {activeNote.ai_summary ? (
                    <div className="prose max-w-none">
                      <div className="p-4 bg-[#C9A84C]/10 rounded-lg border border-[#C9A84C]/20">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                          <span className="text-[#C9A84C] font-medium">Generated Summary</span>
                        </div>
                        <p className="text-zinc-700 whitespace-pre-wrap">{activeNote.ai_summary}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-zinc-400 text-center py-8">No summary available</p>
                  )}
                </TabsContent>
                
                <TabsContent value="actions" className="mt-4">
                  {activeNote.ai_action_items && activeNote.ai_action_items.length > 0 ? (
                    <div className="space-y-2">
                      {activeNote.ai_action_items.map((item: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                          <CheckCircle className={`w-5 h-5 mt-0.5 ${item.completed ? 'text-green-600' : 'text-zinc-400'}`} />
                          <span className={`text-zinc-700 ${item.completed ? 'line-through opacity-50' : ''}`}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-400 text-center py-8">No action items extracted</p>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => generatePDF(activeNote)}
                  className="border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button 
                  onClick={() => setActiveNote(null)}
                  className="bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Note Dialog */}
      <Dialog open={showNoteEditor} onOpenChange={setShowNoteEditor}>
        <DialogContent className="bg-white border-2 border-[#C9A84C]/30 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-black flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#C9A84C]" />
              Create New Note
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-zinc-600">Title</Label>
              <Input value={newNote.title} onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))} placeholder="Note title..." className="bg-zinc-50 border-[#C9A84C]/20 text-black" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-600">Content</Label>
              <Textarea value={newNote.content} onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))} placeholder="Write your note here..." className="bg-zinc-50 border-[#C9A84C]/20 text-black min-h-[200px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-600">Project (optional)</Label>
              <Select value={newNote.project_id} onValueChange={(v) => setNewNote(prev => ({ ...prev, project_id: v }))}>
                <SelectTrigger className="bg-zinc-50 border-[#C9A84C]/20 text-black">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowNoteEditor(false)} className="border-[#C9A84C]/20">Cancel</Button>
            <Button onClick={saveNote} disabled={isProcessing} className="bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white">
              {isProcessing ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>) : (<><Save className="w-4 h-4 mr-2" />Save Note</>)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Project Dialog */}
      <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
        <DialogContent className="bg-white border-2 border-[#C9A84C]/30">
          <DialogHeader>
            <DialogTitle className="text-black flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-[#C9A84C]" />
              Create New Project
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-zinc-600">Project Name</Label>
              <Input value={newProject.name} onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Client Meetings Q1" className="bg-zinc-50 border-[#C9A84C]/20 text-black" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-600">Description (optional)</Label>
              <Textarea value={newProject.description} onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))} placeholder="Project description..." className="bg-zinc-50 border-[#C9A84C]/20 text-black" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-600">Color</Label>
              <div className="flex gap-2">
                {['#A8925A', '#EF4444', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'].map(color => (
                  <button key={color} onClick={() => setNewProject(prev => ({ ...prev, color }))} className={`w-8 h-8 rounded-full transition-transform ${newProject.color === color ? 'ring-2 ring-[#C9A84C] ring-offset-2 scale-110' : ''}`} style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowProjectDialog(false)} className="border-[#C9A84C]/20">Cancel</Button>
            <Button onClick={createProject} className="bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white">Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="bg-white border-2 border-[#C9A84C]/30">
          <DialogHeader>
            <DialogTitle className="text-black flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#C9A84C]" />
              Upload Document
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="border-2 border-dashed border-[#C9A84C]/30 rounded-xl p-8 text-center hover:border-[#C9A84C]/50 transition-colors relative">
              <Upload className="w-12 h-12 text-[#C9A84C]/40 mx-auto mb-4" />
              <p className="text-zinc-500 mb-2">Drop your file here or click to upload</p>
              <p className="text-xs text-zinc-400">Supports PDF, DOC, DOCX, TXT, and more</p>
              <input type="file" accept=".pdf,.doc,.docx,.txt,.md" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              <Button className="mt-4 relative bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white">
                Choose File
                <input type="file" accept=".pdf,.doc,.docx,.txt,.md" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </Button>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-blue-700 font-medium">Extraction</p>
                  <p className="text-xs text-zinc-500 mt-1">Key points, action items, and a summary will be automatically extracted from your document.</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AINoteCenter;
