import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  GraduationCap, Users, BookOpen, Shield, Crown, Search,
  Plus, Trash2, Eye, ChevronRight, Clock, CheckCircle,
  AlertTriangle, UserPlus, Settings, Award, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TrainingProgram {
  id: string;
  name: string;
  description: string | null;
  tier: string;
  is_active: boolean;
  sort_order: number | null;
}

interface EducationBook {
  id: string;
  title: string;
  book_number: number;
  learning_path: string;
  min_tier: string | null;
  is_restricted: boolean | null;
}

interface ProgramBook {
  id: string;
  program_id: string;
  book_id: string;
  is_mandatory: boolean | null;
  sort_order: number | null;
}

interface TrainingAssignment {
  id: string;
  user_id: string;
  program_id: string;
  broker_tier: string;
  assigned_by: string | null;
  assigned_at: string | null;
  probation_start_date: string | null;
  probation_end_date: string | null;
  first_deal_closed_at: string | null;
  promoted_to_elite_at: string | null;
  is_active: boolean | null;
  notes: string | null;
}

interface ApprovedApplicant {
  id: string;
  full_name: string;
  email: string;
  user_id: string | null;
  status: string;
  position_applied: string | null;
}

export default function TrainingManagement() {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [books, setBooks] = useState<EducationBook[]>([]);
  const [programBooks, setProgramBooks] = useState<ProgramBook[]>([]);
  const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
  const [approvedApplicants, setApprovedApplicants] = useState<ApprovedApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProgram, setActiveProgram] = useState<string | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showBooksDialog, setShowBooksDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [assignNotes, setAssignNotes] = useState('');
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [managingProgram, setManagingProgram] = useState<TrainingProgram | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [programsRes, booksRes, programBooksRes, assignmentsRes, applicantsRes] = await Promise.all([
        supabase.from('broker_training_programs').select('*').order('sort_order'),
        supabase.from('broker_education_books').select('id, title, book_number, learning_path, min_tier, is_restricted').order('sort_order'),
        supabase.from('broker_program_books').select('*').order('sort_order'),
        supabase.from('broker_training_assignments').select('*').order('assigned_at', { ascending: false }),
        supabase.from('hr_applications').select('id, full_name, email, user_id, status, position_applied').eq('status', 'approved') as any,
      ]);

      setPrograms(programsRes.data || []);
      setBooks(booksRes.data || []);
      setProgramBooks(programBooksRes.data || []);
      setAssignments(assignmentsRes.data || []);
      setApprovedApplicants(applicantsRes.data || []);

      if (!activeProgram && programsRes.data?.length) {
        setActiveProgram(programsRes.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching training data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeProgram]);

  useEffect(() => { fetchData(); }, []);

  const handleAssignUser = async () => {
    if (!selectedUser || !selectedProgram) {
      toast.error('Select both a user and a program');
      return;
    }

    const program = programs.find(p => p.id === selectedProgram);
    const probationStart = new Date().toISOString().split('T')[0];
    const probationEnd = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { error } = await supabase.from('broker_training_assignments').insert([{
      user_id: selectedUser,
      program_id: selectedProgram,
      broker_tier: (program?.tier || 'probation') as any,
      probation_start_date: program?.tier === 'probation' ? probationStart : null,
      probation_end_date: program?.tier === 'probation' ? probationEnd : null,
      notes: assignNotes || null,
      is_active: true,
    }]);

    if (error) {
      toast.error('Failed to assign training: ' + error.message);
      return;
    }

    toast.success(`Training assigned successfully`);
    setShowAssignDialog(false);
    setSelectedUser('');
    setSelectedProgram('');
    setAssignNotes('');
    fetchData();
  };

  const handleManageBooks = (program: TrainingProgram) => {
    setManagingProgram(program);
    const existingBookIds = programBooks.filter(pb => pb.program_id === program.id).map(pb => pb.book_id);
    setSelectedBooks(new Set(existingBookIds));
    setShowBooksDialog(true);
  };

  const handleSaveBooks = async () => {
    if (!managingProgram) return;

    // Delete existing program books
    await supabase.from('broker_program_books').delete().eq('program_id', managingProgram.id);

    // Insert new ones
    if (selectedBooks.size > 0) {
      const inserts = Array.from(selectedBooks).map((bookId, idx) => ({
        program_id: managingProgram.id,
        book_id: bookId,
        is_mandatory: true,
        sort_order: idx + 1,
      }));

      const { error } = await supabase.from('broker_program_books').insert(inserts);
      if (error) {
        toast.error('Failed to update books: ' + error.message);
        return;
      }
    }

    toast.success(`Books updated for ${managingProgram.name}`);
    setShowBooksDialog(false);
    setManagingProgram(null);
    fetchData();
  };

  const handlePromoteToElite = async (assignment: TrainingAssignment) => {
    const { error } = await supabase.from('broker_training_assignments').update({
      broker_tier: 'elite',
      promoted_to_elite_at: new Date().toISOString(),
      notes: (assignment.notes || '') + '\nPromoted to Elite by admin.',
    }).eq('id', assignment.id);

    if (error) {
      toast.error('Failed to promote: ' + error.message);
      return;
    }

    // Also assign elite program
    const eliteProgram = programs.find(p => p.tier === 'elite');
    if (eliteProgram) {
      await supabase.from('broker_training_assignments').insert({
        user_id: assignment.user_id,
        program_id: eliteProgram.id,
        broker_tier: 'elite',
        promoted_to_elite_at: new Date().toISOString(),
        is_active: true,
        notes: 'Auto-assigned upon promotion to Elite tier.',
      });
    }

    toast.success('Broker promoted to Elite tier!');
    fetchData();
  };

  const handleDeactivateAssignment = async (id: string) => {
    const { error } = await supabase.from('broker_training_assignments').update({ is_active: false }).eq('id', id);
    if (error) {
      toast.error('Failed to deactivate');
      return;
    }
    toast.success('Assignment deactivated');
    fetchData();
  };

  const getApplicantName = (userId: string) => {
    const app = approvedApplicants.find(a => a.user_id === userId);
    return app?.full_name || userId.slice(0, 8) + '...';
  };

  const getApplicantEmail = (userId: string) => {
    return approvedApplicants.find(a => a.user_id === userId)?.email || '';
  };

  const getProgramBooksForProgram = (programId: string) => {
    const bookIds = programBooks.filter(pb => pb.program_id === programId).map(pb => pb.book_id);
    return books.filter(b => bookIds.includes(b.id));
  };

  const filteredAssignments = assignments.filter(a => {
    if (!searchQuery) return true;
    const name = getApplicantName(a.user_id).toLowerCase();
    const email = getApplicantEmail(a.user_id).toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
  });

  const tierBadge = (tier: string) => {
    if (tier === 'elite') return <Badge className="bg-purple-500/20 text-purple-700 border-purple-500/30"><Crown className="w-3 h-3 mr-1" />Elite</Badge>;
    return <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30"><Shield className="w-3 h-3 mr-1" />Probation</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-crm-text flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-gold" />
            Training Management
          </h2>
          <p className="text-crm-text-muted text-sm mt-1">
            Manage training programs, assign books, and control broker tier access.
          </p>
        </div>
        <Button
          onClick={() => setShowAssignDialog(true)}
          className="bg-gradient-to-r from-gold to-amber-600 hover:from-amber-600 hover:to-gold text-black font-semibold"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Assign Training
        </Button>
      </div>

      {/* Programs Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {programs.map(program => {
          const programBooksList = getProgramBooksForProgram(program.id);
          const assignmentCount = assignments.filter(a => a.program_id === program.id && a.is_active).length;

          return (
            <Card
              key={program.id}
              className={`bg-white border cursor-pointer transition-all duration-200 hover:shadow-md ${activeProgram === program.id ? 'border-gold ring-2 ring-gold/20' : 'border-crm-border'}`}
              onClick={() => setActiveProgram(program.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-crm-text flex items-center gap-2">
                    {program.tier === 'elite' ? <Crown className="h-5 w-5 text-purple-500" /> : <Shield className="h-5 w-5 text-amber-500" />}
                    {program.name}
                  </CardTitle>
                  {tierBadge(program.tier)}
                </div>
                <CardDescription className="text-crm-text-muted text-sm">{program.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-crm-text-muted">
                      <BookOpen className="h-4 w-4" /> {programBooksList.length} Books
                    </span>
                    <span className="flex items-center gap-1 text-crm-text-muted">
                      <Users className="h-4 w-4" /> {assignmentCount} Assigned
                    </span>
                  </div>
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleManageBooks(program); }}>
                    <Settings className="h-3.5 w-3.5 mr-1" /> Books
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Books in selected program */}
      {activeProgram && (
        <Card className="bg-white border-crm-border">
          <CardHeader>
            <CardTitle className="text-crm-text text-base flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-gold" />
              Books in {programs.find(p => p.id === activeProgram)?.name}
            </CardTitle>
          </CardHeader>
           <CardContent>
            {getProgramBooksForProgram(activeProgram).length === 0 ? (
              <p className="text-crm-text-muted text-sm py-4 text-center">No books assigned to this program yet. Click "Books" above to configure.</p>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const programBooksList = getProgramBooksForProgram(activeProgram);
                  const sectionMap: Record<string, string> = {
                    'Foundations': 'Company Knowledge',
                    'Market Intelligence': 'Company Knowledge',
                    'Advanced (Restricted)': 'Company Knowledge',
                    'Buyer & Investor Advisory': 'Real Estate',
                    'Seller & Landlord Advisory': 'Real Estate',
                  };
                  const sections: Record<string, typeof programBooksList> = {};
                  programBooksList.forEach(book => {
                    const section = sectionMap[book.learning_path] || 'Real Estate';
                    if (!sections[section]) sections[section] = [];
                    sections[section].push(book);
                  });
                  return Object.entries(sections).map(([sectionName, sectionBooks]) => (
                    <div key={sectionName}>
                      <div className="flex items-center gap-2 mb-2">
                        {sectionName === 'Company Knowledge' ? (
                          <Shield className="h-4 w-4 text-amber-500" />
                        ) : (
                          <BookOpen className="h-4 w-4 text-purple-500" />
                        )}
                        <span className="text-sm font-semibold text-crm-text">{sectionName}</span>
                        <Badge variant="outline" className="text-[10px] text-crm-text-muted border-crm-border">{sectionBooks.length}</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {sectionBooks.map(book => (
                          <div key={book.id} className="flex items-center gap-3 p-3 rounded-lg border border-crm-border bg-gray-50/50">
                            <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-gold text-xs font-bold">{book.book_number}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-crm-text truncate">{book.title}</p>
                              <p className="text-xs text-crm-text-muted">{book.learning_path}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assignments Table */}
      <Card className="bg-white border-crm-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-crm-text text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-gold" />
              Training Assignments ({filteredAssignments.length})
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-crm-text-muted" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-crm-border text-crm-text text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="h-12 w-12 mx-auto mb-3 text-crm-text-muted opacity-50" />
              <p className="text-crm-text-muted">No training assignments yet</p>
              <p className="text-crm-text-muted text-sm">Assign a program to an accepted broker applicant</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssignments.map(assignment => {
                const program = programs.find(p => p.id === assignment.program_id);
                return (
                  <div key={assignment.id} className="flex items-center justify-between p-4 rounded-lg border border-crm-border bg-gray-50/30 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                        <GraduationCap className="h-5 w-5 text-gold" />
                      </div>
                      <div>
                        <p className="font-medium text-crm-text">{getApplicantName(assignment.user_id)}</p>
                        <p className="text-xs text-crm-text-muted">{getApplicantEmail(assignment.user_id)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {tierBadge(assignment.broker_tier)}
                          <Badge variant="outline" className="text-xs text-crm-text-muted border-crm-border">
                            {program?.name || 'Unknown Program'}
                          </Badge>
                          {!assignment.is_active && (
                            <Badge className="bg-red-500/20 text-red-700 border-red-500/30 text-xs">Inactive</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {assignment.broker_tier === 'probation' && assignment.is_active && (
                        <div className="text-right mr-4">
                          {assignment.probation_end_date && (
                            <p className="text-xs text-crm-text-muted">
                              <Clock className="inline h-3 w-3 mr-1" />
                              Probation ends: {new Date(assignment.probation_end_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                      {assignment.promoted_to_elite_at && (
                        <div className="text-right mr-4">
                          <p className="text-xs text-emerald-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Promoted {new Date(assignment.promoted_to_elite_at).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {assignment.broker_tier === 'probation' && assignment.is_active && (
                        <Button size="sm" variant="outline" className="text-purple-600 border-purple-300 hover:bg-purple-50" onClick={() => handlePromoteToElite(assignment)}>
                          <Crown className="h-3.5 w-3.5 mr-1" /> Promote to Elite
                        </Button>
                      )}
                      {assignment.is_active && (
                        <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => handleDeactivateAssignment(assignment.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Training Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-gold" />
              Assign Training Program
            </DialogTitle>
            <DialogDescription>
              Select an accepted applicant and a training program to assign.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-crm-text mb-1.5 block">Applicant</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="bg-white border-crm-border">
                  <SelectValue placeholder="Select accepted applicant..." />
                </SelectTrigger>
                <SelectContent>
                  {approvedApplicants.filter(a => a.user_id).map(app => (
                    <SelectItem key={app.user_id!} value={app.user_id!}>
                      {app.full_name} — {app.email}
                    </SelectItem>
                  ))}
                  {approvedApplicants.filter(a => a.user_id).length === 0 && (
                    <div className="px-3 py-2 text-sm text-crm-text-muted">No accepted applicants with accounts</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-crm-text mb-1.5 block">Training Program</label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger className="bg-white border-crm-border">
                  <SelectValue placeholder="Select program..." />
                </SelectTrigger>
                <SelectContent>
                  {programs.filter(p => p.is_active).map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.tier})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-crm-text mb-1.5 block">Notes (optional)</label>
              <Textarea
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                placeholder="Any special instructions..."
                className="bg-white border-crm-border resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancel</Button>
            <Button onClick={handleAssignUser} className="bg-gold hover:bg-gold/90 text-black">
              Assign Training
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Books Dialog */}
      <Dialog open={showBooksDialog} onOpenChange={setShowBooksDialog}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-gold" />
              Manage Books — {managingProgram?.name}
            </DialogTitle>
            <DialogDescription>
              Select which books are included in this training program.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh] pr-4">
            <div className="space-y-4">
              {(() => {
                // Group books by learning_path category
                const groups: Record<string, typeof books> = {};
                books.forEach(book => {
                  const category = book.learning_path || 'Other';
                  if (!groups[category]) groups[category] = [];
                  groups[category].push(book);
                });
                // Map paths to display sections
                const sectionMap: Record<string, string> = {
                  'Foundations': 'Company Knowledge',
                  'Market Intelligence': 'Company Knowledge',
                  'Advanced (Restricted)': 'Company Knowledge',
                  'Buyer & Investor Advisory': 'Real Estate',
                  'Seller & Landlord Advisory': 'Real Estate',
                };
                const sections: Record<string, typeof books> = {};
                Object.entries(groups).forEach(([path, pathBooks]) => {
                  const section = sectionMap[path] || 'Real Estate';
                  if (!sections[section]) sections[section] = [];
                  sections[section].push(...pathBooks);
                });
                return Object.entries(sections).map(([sectionName, sectionBooks]) => (
                  <div key={sectionName}>
                    <div className="flex items-center gap-2 mb-2">
                      {sectionName === 'Company Knowledge' ? (
                        <Shield className="h-4 w-4 text-amber-500" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-purple-500" />
                      )}
                      <span className="text-sm font-semibold text-crm-text">{sectionName}</span>
                      <span className="text-xs text-crm-text-muted">({sectionBooks.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {sectionBooks.map(book => (
                        <label
                          key={book.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-crm-border hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={selectedBooks.has(book.id)}
                            onCheckedChange={(checked) => {
                              const updated = new Set(selectedBooks);
                              if (checked) updated.add(book.id);
                              else updated.delete(book.id);
                              setSelectedBooks(updated);
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-crm-text">Book {book.book_number}: {book.title}</span>
                              {book.is_restricted && <Badge className="bg-red-500/20 text-red-700 text-[10px]">Restricted</Badge>}
                            </div>
                            <p className="text-xs text-crm-text-muted">{book.learning_path} · Tier: {book.min_tier || 'any'}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </ScrollArea>
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-crm-text-muted">{selectedBooks.size} of {books.length} selected</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedBooks(new Set(books.map(b => b.id)))}>Select All</Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedBooks(new Set())}>Clear</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBooksDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveBooks} className="bg-gold hover:bg-gold/90 text-black">
              Save Books
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
