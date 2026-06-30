import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderOpen, 
  Plus, 
  Search,
  Grid,
  List,
  Filter,
  Clock,
  Star,
  MoreVertical,
  Trash2,
  Edit2,
  Copy,
  Download,
  Eye,
  Archive,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface DesignProject {
  id: string;
  name: string;
  description: string | null;
  category: string;
  template_type: string | null;
  template_size: string | null;
  status: string;
  thumbnail_url: string | null;
  final_design_url: string | null;
  metadata: Record<string, any>;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface DesignProjectManagerProps {
  onSelectProject: (project: DesignProject) => void;
  onCreateNew: () => void;
  selectedProjectId?: string;
}

const PROJECT_CATEGORIES = [
  { id: 'all', label: 'All Projects' },
  { id: 'social', label: 'Social Media' },
  { id: 'print', label: 'Print Materials' },
  { id: 'presentation', label: 'Presentations' },
  { id: 'branding', label: 'Branding' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'books', label: 'Books & Reports' },
];

export const DesignProjectManager: React.FC<DesignProjectManagerProps> = ({
  onSelectProject,
  onCreateNew,
  selectedProjectId
}) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<DesignProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, showArchived]);

  const fetchProjects = async () => {
    try {
      let query = supabase
        .from('design_studio_projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (!showArchived) {
        query = query.eq('is_archived', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      setProjects((data || []).map(p => ({
        ...p,
        metadata: (typeof p.metadata === 'object' && p.metadata !== null ? p.metadata : {}) as Record<string, any>
      })));
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('design_studio_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success('Project deleted');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleArchiveProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('design_studio_projects')
        .update({ is_archived: true })
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success('Project archived');
    } catch (error) {
      console.error('Error archiving project:', error);
      toast.error('Failed to archive project');
    }
  };

  const handleDuplicateProject = async (project: DesignProject) => {
    try {
      const { data, error } = await supabase
        .from('design_studio_projects')
        .insert({
          user_id: user?.id as string,
          name: `${project.name} (Copy)`,
          description: project.description,
          category: project.category,
          template_type: project.template_type,
          template_size: project.template_size,
          status: 'draft',
          thumbnail_url: project.thumbnail_url,
          metadata: project.metadata,
        })
        .select()
        .single();

      if (error) throw error;

      const newProject: DesignProject = {
        ...data,
        metadata: (typeof data.metadata === 'object' && data.metadata !== null ? data.metadata : {}) as Record<string, any>
      };
      setProjects(prev => [newProject, ...prev]);
      toast.success('Project duplicated');
    } catch (error) {
      console.error('Error duplicating project:', error);
      toast.error('Failed to duplicate project');
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'jj-surface-emerald-soft text-emerald-400 border-[color:var(--emerald-1)]/30/30';
      case 'in_progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'draft': return 'bg-[#B89555]/20 text-white/70 border-[#B89555]/30';
      default: return 'bg-[#B89555]/20 text-white/70 border-[#B89555]/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-[#1A1A1A]" />
          <h3 className="text-white font-semibold">My Projects</h3>
        </div>
        <Button size="sm" onClick={onCreateNew} className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]">
          <Plus className="w-4 h-4 mr-1" />
          New Project
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/90" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="pl-10 bg-[#1A1A1A] border-[#1A1A1A] text-white"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          className="border-[#1A1A1A] text-white/70"
        >
          {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
        </Button>
      </div>

      {/* Category Tabs */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {PROJECT_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
 selectedCategory === cat.id
 ? 'bg-[#EFE6D6] text-[#1A1A1A]'
 : 'bg-[#1A1A1A] text-white/70 hover:bg-[#1A1A1A]'
 }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Projects List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#1A1A1A] animate-spin" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 text-[#1A1A1A]/70 mx-auto mb-4" />
          <h4 className="text-white font-medium mb-2">No projects found</h4>
          <p className="text-white/90 text-sm mb-4">
            {searchQuery ? 'Try a different search term' : 'Create your first design project'}
          </p>
          <Button onClick={onCreateNew} className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]">
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-2'}>
            <AnimatePresence>
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group rounded-lg border-2 transition-all cursor-pointer ${
 selectedProjectId === project.id
 ? 'border-[#B89555] bg-[#EFE6D6]/10'
 : 'border-[#1A1A1A] bg-[#1A1A1A]/50 hover:border-[#1A1A1A]'
 } ${viewMode === 'grid' ? 'p-3' : 'p-4'}`}
                  onClick={() => onSelectProject(project)}
                >
                  {viewMode === 'grid' ? (
                    <>
                      {/* Thumbnail */}
                      <div className="aspect-video bg-[#1A1A1A] rounded-lg mb-2 overflow-hidden relative">
                        {project.thumbnail_url ? (
                          <img 
                            src={project.thumbnail_url} 
                            alt={project.name}
                            className="w-full h-full object-cover"
                           loading="lazy" decoding="async" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FolderOpen className="w-8 h-8 text-[#1A1A1A]/70" />
                          </div>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute top-1 right-1 w-6 h-6 bg-[#1A1A1A]/50 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-3 h-3 text-white" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#FDFBF7] border-[#1A1A1A]">
                            <DropdownMenuItem onClick={() => handleDuplicateProject(project)} className="text-white/85">
                              <Copy className="w-4 h-4 mr-2" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleArchiveProject(project.id)} className="text-white/85">
                              <Archive className="w-4 h-4 mr-2" /> Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteProject(project.id)} className="text-red-400">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <h4 className="text-white text-sm font-medium truncate">{project.name}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <Badge className={`text-[10px] ${getStatusColor(project.status)}`}>
                          {project.status}
                        </Badge>
                        <span className="text-white/90 text-[10px]">
                          {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-12 bg-[#1A1A1A] rounded overflow-hidden flex-shrink-0">
                        {project.thumbnail_url ? (
                          <img 
                            src={project.thumbnail_url} 
                            alt={project.name}
                            className="w-full h-full object-cover"
                           loading="lazy" decoding="async" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-[#1A1A1A]/70" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">{project.name}</h4>
                        <p className="text-white/90 text-sm truncate">{project.template_type || project.category}</p>
                      </div>
                      <Badge className={`${getStatusColor(project.status)}`}>
                        {project.status}
                      </Badge>
                      <span className="text-white/90 text-xs whitespace-nowrap">
                        {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="w-8 h-8" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="w-4 h-4 text-white/70" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#FDFBF7] border-[#1A1A1A]">
                          <DropdownMenuItem onClick={() => handleDuplicateProject(project)} className="text-white/85">
                            <Copy className="w-4 h-4 mr-2" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchiveProject(project.id)} className="text-white/85">
                            <Archive className="w-4 h-4 mr-2" /> Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteProject(project.id)} className="text-red-400">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}

      {/* Show Archived Toggle */}
      <div className="flex items-center justify-center">
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="text-white/90 text-xs hover:text-white/70 transition-colors"
        >
          {showArchived ? 'Hide archived projects' : 'Show archived projects'}
        </button>
      </div>
    </div>
  );
};

export default DesignProjectManager;
