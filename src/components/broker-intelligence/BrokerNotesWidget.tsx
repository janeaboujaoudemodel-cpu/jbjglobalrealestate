import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContentDark,
  SelectItemDark,
  SelectTriggerDark,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileText, Plus, Clock, Tag, Search, ChevronRight,
  User, Building2, Save, Trash2
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface QuickNote {
  id: string;
  content: string;
  category: "lead" | "property" | "meeting" | "general";
  createdAt: string;
  linkedTo?: string;
}

const MOCK_NOTES: QuickNote[] = [
  { 
    id: "1", 
    content: "Ahmed interested in 2BR units under 2M AED. Prefers high floors with sea view. Budget flexible for right property.", 
    category: "lead", 
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    linkedTo: "Ahmed K."
  },
  { 
    id: "2", 
    content: "Marina Heights Unit 1205 - Owner willing to negotiate. Currently rented at 180K/year, lease ends March.", 
    category: "property", 
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    linkedTo: "Marina Heights"
  },
  { 
    id: "3", 
    content: "Developer meeting notes: New launch in Q2, exclusive broker window available. Follow up next week.", 
    category: "meeting", 
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
];

export function BrokerNotesWidget() {
  const [notes, setNotes] = useState<QuickNote[]>(MOCK_NOTES);
  const [showNewNote, setShowNewNote] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newNote, setNewNote] = useState({
    content: "",
    category: "general" as QuickNote["category"],
    linkedTo: "",
  });

  const filteredNotes = notes.filter(note => 
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.linkedTo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveNote = () => {
    if (!newNote.content.trim()) {
      toast.error("Please enter note content");
      return;
    }
    
    const note: QuickNote = {
      id: Date.now().toString(),
      content: newNote.content,
      category: newNote.category,
      createdAt: new Date().toISOString(),
      linkedTo: newNote.linkedTo || undefined,
    };
    
    setNotes([note, ...notes]);
    toast.success("Note saved");
    setShowNewNote(false);
    setNewNote({ content: "", category: "general", linkedTo: "" });
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
    toast.success("Note deleted");
  };

  const getCategoryBadge = (category: QuickNote["category"]) => {
    switch (category) {
      case "lead":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs"><User className="w-3 h-3 mr-1" />Lead</Badge>;
      case "property":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs"><Building2 className="w-3 h-3 mr-1" />Property</Badge>;
      case "meeting":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs"><Clock className="w-3 h-3 mr-1" />Meeting</Badge>;
      case "general":
        return <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30 text-xs"><Tag className="w-3 h-3 mr-1" />General</Badge>;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Quick Notes Header */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold" />
              Quick Notes
            </CardTitle>
            <Button
              variant="dark-outline"
              size="sm"
              onClick={() => setShowNewNote(!showNewNote)}
            >
              <Plus className="w-4 h-4 mr-1" />
              New Note
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* New Note Form */}
          {showNewNote && (
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-gold/20 space-y-3">
              <Textarea
                placeholder="Write your note here..."
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[80px]"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 text-xs">Category</label>
                  <Select 
                    value={newNote.category} 
                    onValueChange={(v) => setNewNote({ ...newNote, category: v as QuickNote["category"] })}
                  >
                    <SelectTriggerDark className="h-9">
                      <SelectValue />
                    </SelectTriggerDark>
                    <SelectContentDark>
                      <SelectItemDark value="lead">Lead</SelectItemDark>
                      <SelectItemDark value="property">Property</SelectItemDark>
                      <SelectItemDark value="meeting">Meeting</SelectItemDark>
                      <SelectItemDark value="general">General</SelectItemDark>
                    </SelectContentDark>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 text-xs">Link to (Optional)</label>
                  <Input
                    placeholder="Lead or property name"
                    value={newNote.linkedTo}
                    onChange={(e) => setNewNote({ ...newNote, linkedTo: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-9"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ai-gold" size="sm" onClick={handleSaveNote} className="flex-1">
                  <Save className="w-4 h-4 mr-1" />
                  Save Note
                </Button>
                <Button variant="dark-ghost" size="sm" onClick={() => setShowNewNote(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 pl-10"
            />
          </div>

          {/* Notes List */}
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>{searchQuery ? "No notes match your search" : "No notes yet"}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50 hover:border-gold/20 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-2">
                    {getCategoryBadge(note.category)}
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-600 text-xs">{getTimeAgo(note.createdAt)}</span>
                      <Button
                        variant="dark-ghost"
                        size="icon"
                        className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-zinc-300 text-sm whitespace-pre-wrap">{note.content}</p>
                  {note.linkedTo && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gold">
                      <Tag className="w-3 h-3" />
                      {note.linkedTo}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link to Full Notes */}
      <Link to="/crm/notes">
        <Card className="bg-zinc-800/30 border-zinc-800 hover:border-gold/30 transition-colors cursor-pointer">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gold" />
              <div>
                <p className="text-white font-medium text-sm">Open Full Notes</p>
                <p className="text-zinc-500 text-xs">Access all notes, AI summaries, and linked items</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-600" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

export default BrokerNotesWidget;
