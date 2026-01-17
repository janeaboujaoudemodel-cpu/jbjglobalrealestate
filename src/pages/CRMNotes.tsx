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
  StickyNote, Plus, ArrowLeft, Search, Trash2, Edit2, Save, X
} from "lucide-react";
import { format } from "date-fns";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  color: string;
}

const NOTE_COLORS = [
  'bg-yellow-100 border-yellow-300',
  'bg-blue-100 border-blue-300',
  'bg-green-100 border-green-300',
  'bg-pink-100 border-pink-300',
  'bg-purple-100 border-purple-300',
  'bg-orange-100 border-orange-300',
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

  const addNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'New Note',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
    };
    const updatedNotes = [newNote, ...notes];
    saveNotes(updatedNotes);
    setEditingId(newNote.id);
    setEditTitle(newNote.title);
    setEditContent(newNote.content);
    toast.success("Note created");
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
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/crm">
              <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-zinc-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to CRM
              </Button>
            </Link>
            <div className="h-6 w-px bg-zinc-200" />
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <StickyNote className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-zinc-900">Notes</h1>
                <p className="text-xs text-zinc-500">{notes.length} notes</p>
              </div>
            </div>
          </div>
          <Button onClick={addNote} variant="gold">
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <Card className="border-zinc-200 bg-white">
            <CardContent className="py-12 text-center">
              <StickyNote className="h-12 w-12 mx-auto mb-4 text-zinc-300" />
              <p className="text-zinc-600 font-medium">No notes yet</p>
              <p className="text-sm text-zinc-400 mt-1">Create your first note to get started</p>
              <Button onClick={addNote} variant="gold" className="mt-4">
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
                className={`border-2 transition-all hover:shadow-md ${note.color}`}
              >
                <CardContent className="p-4">
                  {editingId === note.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="font-semibold bg-white/70"
                        placeholder="Note title"
                      />
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[120px] bg-white/70 resize-none"
                        placeholder="Write your note..."
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit} variant="gold">
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-zinc-900">{note.title}</h3>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => startEditing(note)}
                            className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-900"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deleteNote(note.id)}
                            className="h-7 w-7 p-0 text-zinc-500 hover:text-red-600"
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
  );
};

export default CRMNotes;
