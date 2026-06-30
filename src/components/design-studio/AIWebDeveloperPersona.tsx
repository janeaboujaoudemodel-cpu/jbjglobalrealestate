import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  Globe,
  Palette,
  Layers,
  GitBranch,
  History,
  CheckCircle,
  Clock,
  AlertCircle,
  Lock,
  Sparkles,
  MessageSquare,
  FileCode,
  Languages,
  Zap,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

// Web Developer Persona Photo
import webDevPhoto from '@/assets/team/web-developer-persona.png';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending_approval' | 'approved' | 'in_progress' | 'completed' | 'review_needed';
  assignedBy: 'owner' | 'assistant';
  createdAt: Date;
  approvedAt?: Date;
  completedAt?: Date;
  changes?: string[];
}

interface AIWebDeveloperPersonaProps {
  isOwner?: boolean;
  isAssistant?: boolean;
  onTaskApproval?: (taskId: string, approved: boolean) => void;
  onRestoreVersion?: (versionId: string) => void;
}

const CAPABILITIES = [
  { icon: Code2, label: 'HTML/CSS/JS', color: 'text-orange-400' },
  { icon: Palette, label: 'UI Design', color: 'text-pink-400' },
  { icon: Layers, label: 'Components', color: 'text-purple-400' },
  { icon: Globe, label: 'Responsive', color: 'text-blue-400' },
  { icon: Zap, label: 'Performance', color: 'text-yellow-400' },
  { icon: Shield, label: 'Security', color: 'text-green-400' },
];

const LANGUAGES = ['English', 'Arabic', 'French', 'Spanish', 'Russian', 'Chinese', 'Hindi'];

export const AIWebDeveloperPersona: React.FC<AIWebDeveloperPersonaProps> = ({
  isOwner = false,
  isAssistant = false,
  onTaskApproval,
  onRestoreVersion,
}) => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Update Hero Section Layout',
      description: 'Redesign the hero section with new gradient backgrounds and animated elements',
      status: 'pending_approval',
      assignedBy: 'assistant',
      createdAt: new Date(),
    },
    {
      id: '2',
      title: 'Optimize Mobile Navigation',
      description: 'Implement sticky header with improved mobile menu animation',
      status: 'approved',
      assignedBy: 'owner',
      createdAt: new Date(Date.now() - 86400000),
      approvedAt: new Date(),
    },
  ]);
  
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [versions] = useState([
    { id: 'v1.2.3', date: new Date(), description: 'Added new footer design' },
    { id: 'v1.2.2', date: new Date(Date.now() - 86400000), description: 'Updated color scheme' },
    { id: 'v1.2.1', date: new Date(Date.now() - 172800000), description: 'Initial hero layout' },
  ]);

  const canAssignTasks = isOwner || isAssistant;

  const handleApproveTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: 'approved' as const, approvedAt: new Date() }
        : task
    ));
    onTaskApproval?.(taskId, true);
    toast.success('Task approved! Development will begin.');
  };

  const handleRejectTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    onTaskApproval?.(taskId, false);
    toast.info('Task rejected');
  };

  const handleCompleteReview = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: 'completed' as const, completedAt: new Date() }
        : task
    ));
    toast.success('Changes approved and deployed!');
  };

  const handleAssignTask = () => {
    if (!newTaskDescription.trim()) {
      toast.error('Please describe the task');
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title: 'New Development Task',
      description: newTaskDescription,
      status: isOwner ? 'approved' : 'pending_approval',
      assignedBy: isOwner ? 'owner' : 'assistant',
      createdAt: new Date(),
      approvedAt: isOwner ? new Date() : undefined,
    };

    setTasks(prev => [...prev, newTask]);
    setNewTaskDescription('');
    
    if (isOwner) {
      toast.success('Task assigned and approved for development');
    } else {
      toast.info('Task submitted for Owner approval');
    }
  };

  const getStatusBadge = (status: Task['status']) => {
    const configs = {
      pending_approval: { icon: Clock, label: 'Pending Approval', className: 'bg-amber-500/20 text-[#1A1A1A]' },
      approved: { icon: CheckCircle, label: 'Approved', className: 'jj-surface-emerald-soft text-green-400' },
      in_progress: { icon: Code2, label: 'In Progress', className: 'bg-blue-500/20 text-blue-400' },
      completed: { icon: CheckCircle, label: 'Completed', className: 'jj-surface-emerald-soft text-emerald-400' },
      review_needed: { icon: AlertCircle, label: 'Review Needed', className: 'bg-purple-500/20 text-purple-400' },
    };
    
    const config = configs[status];
    return (
      <Badge className={config.className}>
        <config.icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Persona Header */}
      <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[#B89555]/20 shadow-lg overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Photo */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#B89555]/30 shadow-lg">
                <img 
                  src={webDevPhoto} 
                  alt="Marcus Chen - AI Web Developer"
                  className="w-full h-full object-cover"
                  onError={(e) = loading="lazy" decoding="async"> {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop';
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 jj-surface-emerald rounded-full flex items-center justify-center border-2 border-white">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-[#1A1A1A]">Marcus Chen</h2>
                <Badge className="bg-[#EFE6D6]/20 text-[#1A1A1A] border border-[#B89555]/30">
                  <Code2 className="w-3 h-3 mr-1" />
                  AI Web Developer
                </Badge>
              </div>
              <p className="text-[#1A1A1A]/70 mb-4">
                Full-stack web development specialist with expertise in modern frameworks, 
                responsive design, and performance optimization. Works exclusively under 
                Owner/Assistant approval with full version control.
              </p>

              {/* Capabilities */}
              <div className="flex flex-wrap gap-2 mb-3">
                {CAPABILITIES.map((cap) => (
                  <Badge key={cap.label} variant="outline" className="bg-[#FDFBF7]/80 border-[#B89555]/30">
                    <cap.icon className={`w-3 h-3 mr-1 ${cap.color}`} />
                    {cap.label}
                  </Badge>
                ))}
              </div>

              {/* Languages */}
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-[#1A1A1A]" />
                <span className="text-sm text-[#1A1A1A]/70">
                  {LANGUAGES.join(' • ')}
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-2">
                <span className="w-2 h-2 jj-surface-emerald rounded-full animate-pulse" />
                <span className="text-sm text-[color:var(--emerald-1)] font-medium">Online</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#1A1A1A]/70">
                <Lock className="w-3 h-3" />
                Approval-Only Mode
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Task Queue */}
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[#B89555]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
              <FileCode className="w-5 h-5 text-[#1A1A1A]" />
              Development Tasks
              <Badge className="ml-auto bg-[#F7F2EA] text-[#1A1A1A]/70">
                {tasks.filter(t => t.status !== 'completed').length} Active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                <AnimatePresence>
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 bg-[#FDFBF7] rounded-xl border border-[#B89555]/30 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="font-medium text-[#1A1A1A]">{task.title}</h4>
                        {getStatusBadge(task.status)}
                      </div>
                      <p className="text-sm text-[#1A1A1A]/70 mb-3">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#1A1A1A]/70">
                          Assigned by: {task.assignedBy === 'owner' ? 'Founder' : 'Assistant'}
                        </span>
                        
                        {task.status === 'pending_approval' && isOwner && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRejectTask(task.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              Reject
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleApproveTask(task.id)}
                              className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]"
                            >
                              Approve
                            </Button>
                          </div>
                        )}

                        {task.status === 'review_needed' && isOwner && (
                          <Button 
                            size="sm"
                            onClick={() => handleCompleteReview(task.id)}
                            className="jj-surface-emerald hover:jj-surface-emerald text-white"
                          >
                            Approve Changes
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Assign New Task */}
            {canAssignTasks && (
              <div className="mt-4 pt-4 border-t border-[#B89555]/30">
                <Label className="text-sm text-[#1A1A1A]/70 mb-2 block">Assign New Task</Label>
                <div className="flex gap-2">
                  <Textarea
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Describe what you want to build or change..."
                    className="min-h-[80px] bg-[#FDFBF7] border-[#B89555]/30"
                  />
                </div>
                <Button 
                  onClick={handleAssignTask}
                  className="mt-2 w-full bg-gradient-to-r from-gold to-gold/80 text-[#1A1A1A] font-semibold hover:from-gold/90 hover:to-gold/70"
                  disabled={!newTaskDescription.trim()}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {isOwner ? 'Assign & Approve Task' : 'Submit for Approval'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Version History */}
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[#B89555]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-[#1A1A1A]" />
              Version History
              <Badge className="ml-auto bg-[#F7F2EA] text-[#1A1A1A]/70">
                {versions.length} Versions
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {versions.map((version, index) => (
                  <motion.div
                    key={version.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-[#FDFBF7] rounded-xl border border-[#B89555]/30 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-[#1A1A1A]" />
                        <span className="font-mono font-medium text-[#1A1A1A]">{version.id}</span>
                        {index === 0 && (
                          <Badge className="jj-surface-emerald-soft text-[color:var(--emerald-1)]">Current</Badge>
                        )}
                      </div>
                      <span className="text-xs text-[#1A1A1A]/70">
                        {version.date.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-[#1A1A1A]/70 mb-3">{version.description}</p>
                    {index > 0 && isOwner && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          onRestoreVersion?.(version.id);
                          toast.success(`Restored to ${version.id}`);
                        }}
                        className="text-[#1A1A1A] border-[#B89555]/30 hover:bg-[#EFE6D6]/10"
                      >
                        <History className="w-3 h-3 mr-1" />
                        Restore
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            </ScrollArea>

            {/* Governance Note */}
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="text-xs text-amber-700">
                  <strong>Approval-Only Execution:</strong> All tasks require Owner approval 
                  before implementation. Changes are flagged for review before deployment.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connected Tools */}
      <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[#B89555]/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#1A1A1A]" />
            Connected AI Tools
          </CardTitle>
          <p className="text-sm text-[#1A1A1A]/70">
            Marcus works collaboratively with all creative and content tools
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'Design Studio', icon: Palette, color: 'from-rose-500 to-pink-500' },
              { name: 'Copywriter', icon: FileCode, color: 'from-blue-500 to-cyan-500' },
              { name: 'Content Editor', icon: MessageSquare, color: 'from-purple-500 to-indigo-500' },
              { name: 'Social Media', icon: Globe, color: ' ' },
            ].map((tool) => (
              <div
                key={tool.name}
                className="p-3 bg-[#FDFBF7] rounded-xl border border-[#B89555]/30 flex items-center gap-3 hover:border-[#B89555]/50 hover:shadow-md transition-all cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center`}>
                  <tool.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-[#1A1A1A]">{tool.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIWebDeveloperPersona;
