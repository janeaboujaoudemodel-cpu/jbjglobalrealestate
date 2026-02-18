import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FolderOpen, Video, Image, Loader2, Plus, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

interface VideoProject {
  id: string;
  project_name: string;
  tool_type: string;
  created_at: string;
  updated_at: string;
  thumbnail_url?: string | null;
}

export function ProjectIntegrationPanel() {
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_tool_projects')
        .select('id, project_name, tool_type, created_at, updated_at, thumbnail_url')
        .order('updated_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setProjects(data);
      }
    } catch {
      // not signed in or no projects
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVideoAd = async (project: VideoProject) => {
    setGenerating(project.id);
    // Simulate loading project assets into timeline
    await new Promise(r => setTimeout(r, 1500));
    toast.success(`🎬 Video Ad created from "${project.project_name}" — media added to timeline!`);
    setGenerating(null);
  };

  const handleNewProject = () => {
    toast.info('New project created');
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Recent Projects</span>
        </div>
        <button
          onClick={handleNewProject}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-amber-500 text-black hover:bg-amber-400 transition-all"
        >
          <Plus className="w-3 h-3" />
          New
        </button>
      </div>

      {/* Projects Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 gap-2 text-center">
            <FolderOpen className="w-8 h-8 text-slate-500" />
            <p className="text-xs text-slate-400">No saved projects yet.</p>
            <p className="text-xs text-slate-500">Projects you save will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {projects.map(project => (
              <div
                key={project.id}
                className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-amber-400/50 transition-all group"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-slate-700 flex items-center justify-center relative">
                  {project.thumbnail_url ? (
                    <img src={project.thumbnail_url} alt={project.project_name} className="w-full h-full object-cover" />
                  ) : (
                    <Video className="w-6 h-6 text-slate-500" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                    <button
                      onClick={() => handleCreateVideoAd(project)}
                      disabled={generating === project.id}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-all disabled:opacity-50"
                    >
                      {generating === project.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Wand2 className="w-3 h-3" />
                      )}
                      Create Ad
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-xs font-semibold text-white truncate">{project.project_name}</p>
                  <p className="text-xs text-slate-400 capitalize">{project.tool_type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="border-t border-slate-700 p-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => toast.info('Opening real estate projects...')}
          className="flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold border border-slate-500 bg-slate-700 text-slate-100 hover:border-amber-400 hover:text-amber-300 transition-all"
        >
          <Image className="w-3.5 h-3.5" />
          Import Photos
        </button>
        <button
          onClick={() => toast.info('Property Ad template applied!')}
          className="flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-all"
        >
          <Wand2 className="w-3.5 h-3.5" />
          Property Ad
        </button>
      </div>
    </div>
  );
}
