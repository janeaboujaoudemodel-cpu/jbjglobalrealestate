import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Share2,
  Building2,
  Wand2,
  Settings,
  Download,
  Film,
  Image as ImageIcon,
  FileText,
  Loader2,
  Cloud,
  CloudOff,
  MoreVertical,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { toast } from 'sonner';
import { useStudioProject } from '@/components/creative-suite/hooks/useStudioProject';
import { PropertyPicker } from '@/components/creative-suite/panels/PropertyPicker';
import { AICreativeDirector } from '@/components/creative-suite/panels/AICreativeDirector';
import { PublishPanel } from '@/components/creative-suite/panels/PublishPanel';
import { TrendingAudioPanel } from '@/components/creative-suite/panels/TrendingAudioPanel';
import { AIVideoStudio } from '@/components/ai-video-studio/AIVideoStudio';

export default function CreativeSuiteEditor() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const {
    project,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    updateProject,
    updateAISettings,
    saveProject,
    renameProject,
    linkProperty,
    generateShareLink,
  } = useStudioProject(projectId);

  const [isPropertyPickerOpen, setIsPropertyPickerOpen] = useState(false);
  const [isPublishPanelOpen, setIsPublishPanelOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'ai' | 'audio'>('editor');

  useEffect(() => {
    if (project) {
      setNewName(project.name);
    }
  }, [project?.name]);

  const handleRename = async () => {
    if (!newName.trim()) return;
    await renameProject(newName.trim());
    setIsRenaming(false);
  };

  const handleAIGenerate = async (prompt: string) => {
    setIsGenerating(true);
    try {
      // Store prompt in history
      const newPrompt = {
        id: crypto.randomUUID(),
        prompt,
        timestamp: new Date().toISOString(),
        status: 'pending' as const,
      };

      updateAISettings({
        promptHistory: [...(project?.ai_settings.promptHistory || []), newPrompt],
      });

      // Simulate AI generation (would call edge function in production)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success('AI generation started! Check the timeline for generated content.');
    } catch (err) {
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAudio = (audio: any) => {
    toast.success(`Added "${audio.audio_title}" to timeline`);
    // Would add to timeline in production
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#1A1A1A] animate-spin mx-auto mb-4" />
          <p className="text-[#1A1A1A]/70">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#1A1A1A]/70 mb-4">Project not found</p>
          <Button onClick={() => navigate('/studio')} className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]">
            Back to Studio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
      {/* Top Bar */}
      <header className="h-14 bg-[#1A1A1A]/90 backdrop-blur-xl border-b border-[#B89555]/20 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/studio" className="p-2 rounded-lg hover:bg-[#1A1A1A] text-[#1A1A1A]/70 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EFE6D6]/10 border border-[#B89555]/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
            </div>
            
            {isRenaming ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  className="w-64 h-8 bg-[#1A1A1A] border-[#B89555]/30 text-white"
                  autoFocus
                />
                <Button size="sm" onClick={handleRename} className="h-8 bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]">
                  Save
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setIsRenaming(true)}
                className="text-lg font-semibold hover:text-[#1A1A1A] transition-colors"
              >
                {project.name}
              </button>
            )}
          </div>

          {/* Save Status */}
          <div className="flex items-center gap-1 text-xs text-[#1A1A1A]/70">
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </>
            ) : hasUnsavedChanges ? (
              <>
                <CloudOff className="w-3 h-3" />
                Unsaved
              </>
            ) : (
              <>
                <Cloud className="w-3 h-3 text-green-500" />
                Saved
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Property Link */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPropertyPickerOpen(true)}
            className={`border-[#B89555]/30 ${project.property_snapshot ? 'text-[#1A1A1A] border-[#B89555]/50' : 'text-[#1A1A1A]/70'}`}
          >
            <Building2 className="w-4 h-4 mr-2" />
            {project.property_snapshot?.name || 'Link Property'}
          </Button>

          {/* Save */}
          <Button variant="outline" size="sm" onClick={saveProject} className="border-[#B89555]/30 text-[#1A1A1A]/70">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>

          {/* Share */}
          <Button variant="outline" size="sm" onClick={generateShareLink} className="border-[#B89555]/30 text-[#1A1A1A]/70">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>

          {/* Publish */}
          <Button onClick={() => setIsPublishPanelOpen(true)} className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]">
            <Download className="w-4 h-4 mr-2" />
            Export & Publish
          </Button>

          {/* More Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-[#1A1A1A]/70">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1A1A1A] border-[#1A1A1A]">
              <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/studio/settings')}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-400">
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Sidebar - AI & Tools */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <div className="h-full bg-[#1A1A1A]/50 border-r border-[#1A1A1A] overflow-auto">
              <div className="p-4 space-y-4">
                {/* Tab Switcher */}
                <div className="flex rounded-lg bg-[#1A1A1A]/50 p-1">
                  <button
                    onClick={() => setActiveTab('ai')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'ai'
                        ? 'bg-[#EFE6D6]/20 text-[#1A1A1A]'
                        : 'text-[#1A1A1A]/70 hover:text-white'
                    }`}
                  >
                    <Wand2 className="w-4 h-4 inline mr-1" />
                    AI Director
                  </button>
                  <button
                    onClick={() => setActiveTab('audio')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'audio'
                        ? 'bg-[#EFE6D6]/20 text-[#1A1A1A]'
                        : 'text-[#1A1A1A]/70 hover:text-white'
                    }`}
                  >
                    Trending Audio
                  </button>
                </div>

                {activeTab === 'ai' && (
                  <AICreativeDirector
                    settings={project.ai_settings}
                    onSettingsChange={updateAISettings}
                    property={project.property_snapshot}
                    onGenerate={handleAIGenerate}
                    isGenerating={isGenerating}
                  />
                )}

                {activeTab === 'audio' && (
                  <TrendingAudioPanel
                    platform="instagram"
                    onSelectAudio={handleSelectAudio}
                  />
                )}

                {/* Property Preview */}
                {project.property_snapshot && (
                  <div className="p-4 rounded-xl bg-[#1A1A1A]/50 border border-[#1A1A1A]">
                    <div className="flex items-start gap-3">
                      {project.property_snapshot.cover_image_url ? (
                        <img
                          src={project.property_snapshot.cover_image_url}
                          alt={project.property_snapshot.name}
                          className="w-16 h-16 rounded-lg object-cover"
                         loading="lazy" decoding="async" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-[#1A1A1A]/70" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">{project.property_snapshot.name}</h4>
                        <p className="text-xs text-[#1A1A1A]/70 truncate">
                          {project.property_snapshot.area_name}
                          {project.property_snapshot.developer_name && ` by ${project.property_snapshot.developer_name}`}
                        </p>
                        {project.property_snapshot.price_from && (
                          <p className="text-sm text-[#1A1A1A] mt-1">
                            From AED {(project.property_snapshot.price_from / 1000000).toFixed(1)}M
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPropertyPickerOpen(true)}
                      className="w-full mt-3 text-[#1A1A1A]/70 hover:text-white"
                    >
                      Change Property
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Main Editor Area */}
          <ResizablePanel defaultSize={75}>
            <div className="h-full bg-[#1A1A1A]">
              <AIVideoStudio />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Property Picker Dialog */}
      <PropertyPicker
        isOpen={isPropertyPickerOpen}
        onClose={() => setIsPropertyPickerOpen(false)}
        onSelect={linkProperty}
        selectedPropertyId={project.property_id}
      />

      {/* Publish Panel Dialog */}
      <PublishPanel
        isOpen={isPublishPanelOpen}
        onClose={() => setIsPublishPanelOpen(false)}
        projectId={project.id}
        property={project.property_snapshot}
      />
    </div>
  );
}
