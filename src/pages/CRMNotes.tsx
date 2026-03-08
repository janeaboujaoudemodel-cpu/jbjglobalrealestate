import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  StickyNote, Plus, ArrowLeft, Search, Trash2, Edit2, Save, X, Mic, ListChecks, CheckSquare
} from "lucide-react";
import { format } from "date-fns";
import VoiceNoteRecorder from "@/components/crm/VoiceNoteRecorder";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  color: string;
}

const NOTE_COLORS = [
  'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300',
  'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300',
  'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300',
  'bg-gradient-to-br from-pink-50 to-pink-100 border-pink-300',
  'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300',
  'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300',
];

const CRMNotes = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/auth");
      return;
    }

    loadNotes();
  }, [authLoading, user, navigate]);

  const loadNotes = () => {
    // Load from localStorage for now
    const savedNotes = localStorage.getItem(`crm_notes_${user?.id}`);
    if (savedNotes) {
      try {
        const parsed = JSON.parse(savedNotes);
        setNotes(parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt)
        })));
      } catch (e) {
        console.error('Failed to parse notes');
      }
    }
    setLoading(false);
  };

  const saveNotes = (updatedNotes: Note[]) => {
    localStorage.setItem(`crm_notes_${user?.id}`, JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  };

  const addNote = (content?: string) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: content ? 'Voice Note' : 'New Note',
      content: content || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
    };
    const updatedNotes = [newNote, ...notes];
    saveNotes(updatedNotes);
    if (!content) {
      setEditingId(newNote.id);
      setEditTitle(newNote.title);
      setEditContent(newNote.content);
    }
    toast.success("Note created");
  };

  const handleVoiceTranscript = (transcript: string) => {
    if (transcript && transcript.trim()) {
      addNote(transcript);
      toast.success("Voice note transcribed & saved!");
    }
    setShowVoiceRecorder(false);
  };

  // Extract tasks from note content (lines starting with "- [ ]", "TODO:", "task:", "action:")
  const extractTasks = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const taskPatterns = [
      /^[-*]\s*\[?\s?\]?\s*(.+)/gm,
      /(?:TODO|TASK|ACTION|FOLLOW.?UP):\s*(.+)/gim,
    ];
    const extracted: string[] = [];
    taskPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(note.content)) !== null) {
        const task = match[1].trim();
        if (task.length > 3 && !extracted.includes(task)) extracted.push(task);
      }
    });
    if (extracted.length === 0) {
      toast.info("No tasks found. Use '- [ ] task' or 'TODO: task' format");
      return;
    }
    // Save extracted tasks to localStorage
    const existingTasks = JSON.parse(localStorage.getItem(`crm_extracted_tasks_${user?.id}`) || '[]');
    const newTasks = extracted.map(t => ({ id: `task-${Date.now()}-${Math.random()}`, text: t, done: false, noteId, createdAt: new Date().toISOString() }));
    localStorage.setItem(`crm_extracted_tasks_${user?.id}`, JSON.stringify([...newTasks, ...existingTasks]));
    toast.success(`${extracted.length} task(s) extracted from note!`);
  };

  const deleteNote = (noteId: string) => {
    const updatedNotes = notes.filter(n => n.id !== noteId);
    saveNotes(updatedNotes);
    toast.success("Note deleted");
  };

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const saveEdit = () => {
    if (!editingId) return;
    
    const updatedNotes = notes.map(n => 
      n.id === editingId 
        ? { ...n, title: editTitle, content: editContent, updatedAt: new Date() }
        : n
    );
    saveNotes(updatedNotes);
    setEditingId(null);
    toast.success("Note saved");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64 bg-gold/20" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-48 bg-gold/20 border-2 border-gold/30 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Layer 2 - Active Champagne */}
      <div className="mx-0.5 md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8">
        <div className="min-h-screen bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]">
          {/* Header - Layer 3 */}
          <header className="border-b-2 border-gold/30 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] sticky top-0 z-50 shadow-[0_4px_20px_rgba(200,167,102,0.15)]">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to="/crm">
                  <Button variant="secondary" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to CRM
                  </Button>
                </Link>
                <div className="h-6 w-px bg-gold/30" />
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/30">
                    <StickyNote className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-black">Notes</h1>
                    <p className="text-xs text-zinc-600">{notes.length} notes</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => setShowVoiceRecorder(!showVoiceRecorder)} 
                  variant="secondary"
                  className={showVoiceRecorder ? 'bg-gold text-black' : ''}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Voice Note
                </Button>
                <Button onClick={() => addNote()} variant="primary">
                  <Plus className="h-4 w-4 mr-2" />
                  New Note
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
            {/* Voice Recorder Panel */}
            {showVoiceRecorder && (
              <Card className="border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-[0_8px_30px_rgba(200,167,102,0.18)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-black flex items-center gap-2">
                    <Mic className="h-5 w-5 text-gold" />
                    Voice Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-600 mb-4">
                    Click the microphone to record a voice note. Your speech will be transcribed and saved as a note.
                  </p>
                  <VoiceNoteRecorder onTranscript={handleVoiceTranscript} />
                </CardContent>
              </Card>
            )}

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 focus:border-gold/50"
              />
            </div>

            {/* Notes Grid */}
            {filteredNotes.length === 0 ? (
              <Card className="border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-[0_8px_30px_rgba(200,167,102,0.18)]">
                <CardContent className="py-12 text-center">
                  <StickyNote className="h-12 w-12 mx-auto mb-4 text-gold/50" />
                  <p className="text-black font-medium">No notes yet</p>
                  <p className="text-sm text-zinc-600 mt-1">Create your first note to get started</p>
                  <Button onClick={() => addNote()} variant="primary" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Note
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotes.map(note => (
                  <Card 
                    key={note.id} 
                    className={`border-2 transition-all hover:shadow-[0_8px_30px_rgba(200,167,102,0.25)] hover:-translate-y-0.5 ${note.color}`}
                  >
                    <CardContent className="p-4">
                      {editingId === note.id ? (
                        <div className="space-y-3">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="font-semibold bg-white/70 border-gold/30"
                            placeholder="Note title"
                          />
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[120px] bg-white/70 border-gold/30 resize-none"
                            placeholder="Write your note..."
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveEdit} variant="primary">
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="secondary" onClick={cancelEdit}>
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-black">{note.title}</h3>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => startEditing(note)}
                                className="h-7 w-7 p-0 text-zinc-600 hover:text-gold"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => deleteNote(note.id)}
                                className="h-7 w-7 p-0 text-zinc-600 hover:text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-zinc-700 whitespace-pre-wrap line-clamp-6">
                            {note.content || 'Empty note...'}
                          </p>
                          <p className="text-xs text-zinc-500 mt-3">
                            Updated {format(note.updatedAt, 'MMM d, yyyy')}
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CRMNotes;
