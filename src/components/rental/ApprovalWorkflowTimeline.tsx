/**
 * APPROVAL WORKFLOW TIMELINE
 * Visual timeline showing the 4-step unified approval process with approver details
 * 
 * Workflow: Admin → Leadership → Executive Assistant → Founder
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { UNIFIED_APPROVAL_WORKFLOW } from '@/config/listing-approval-workflow';
import { format } from 'date-fns';

interface ApprovalStep {
  step: number;
  name: string;
  completed: boolean;
  approvedAt: string | null;
  approvedBy: string | null;
  approverName: string;
  approverTitle: string;
  approverDepartment: string;
  approverPhoto: string;
  approverEmail: string;
  approverLanguages: string[];
  approverNationality: string;
  approverExperience: string;
  approverBio: string;
  joinedDate: string;
}

interface ApprovalWorkflowTimelineProps {
  steps: ApprovalStep[];
  currentStep: number;
  isLive: boolean;
  isRejected: boolean;
  className?: string;
  listingType?: 'rental' | 'sale';
}

export function ApprovalWorkflowTimeline({
  steps,
  currentStep,
  isLive,
  isRejected,
  className,
  listingType = 'rental',
}: ApprovalWorkflowTimelineProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const workflowConfig = UNIFIED_APPROVAL_WORKFLOW;

  const getStepStatus = (step: ApprovalStep, index: number) => {
    if (isRejected) return 'rejected';
    if (step.completed) return 'completed';
    if (index + 1 === currentStep) return 'current';
    return 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-white" />;
      case 'current':
        return <Clock className="h-4 w-4 text-white animate-pulse" />;
      case 'rejected':
        return <X className="h-4 w-4 text-white" />;
      default:
        return <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-500';
      case 'current':
        return 'bg-amber-500 border-amber-500';
      case 'rejected':
        return 'bg-red-500 border-red-500';
      default:
        return 'bg-muted border-muted-foreground/20';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Timeline Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Approval Progress</h3>
          <p className="text-sm text-muted-foreground">
            Track your listing through our quality assurance process
          </p>
        </div>
        {isLive && (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            Live
          </Badge>
        )}
        {isRejected && (
          <Badge variant="destructive">Rejected</Badge>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {steps.map((step, index) => {
          const status = getStepStatus(step, index);
          const workflowInfo = workflowConfig[index] || step;
          const isLastStep = index === steps.length - 1;

          return (
            <div key={step.step} className="relative">
              {/* Connector Line */}
              {!isLastStep && (
                <div
                  className={cn(
                    'absolute left-6 top-14 w-0.5 h-16',
                    status === 'completed' ? 'bg-green-500' : 'bg-muted-foreground/20'
                  )}
                />
              )}

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 mb-6"
              >
                {/* Step Circle */}
                <div
                  className={cn(
                    'flex items-center justify-center w-12 h-12 rounded-full border-2 flex-shrink-0 z-10',
                    getStatusColor(status)
                  )}
                >
                  {getStepStatus(step, index) === 'completed' || getStepStatus(step, index) === 'current' || getStepStatus(step, index) === 'rejected' ? (
                    getStatusIcon(status)
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">{step.step}</span>
                  )}
                </div>

                {/* Step Content */}
                <Card className={cn(
                  'flex-1 transition-all duration-200',
                  status === 'current' && 'ring-2 ring-amber-500/50 shadow-lg',
                  status === 'completed' && 'bg-green-50/50 dark:bg-green-950/10'
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{step.name}</span>
                          {status === 'completed' && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                              Approved
                            </Badge>
                          )}
                          {status === 'current' && (
                            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 animate-pulse">
                              In Progress
                            </Badge>
                          )}
                        </div>

                        {step.approvedAt && (
                          <p className="text-xs text-muted-foreground mb-3">
                            Approved on {format(new Date(step.approvedAt), 'PPP \'at\' p')}
                          </p>
                        )}

                        {/* Approver Info */}
                        <HoverCard openDelay={200}>
                          <HoverCardTrigger asChild>
                            <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer w-full">
                              <Avatar className="h-10 w-10 border-2 border-gold/20">
                                <AvatarImage src={workflowInfo.approverPhoto} alt={workflowInfo.approverName} />
                                <AvatarFallback className="bg-gradient-to-br from-gold/20 to-champagne/20 text-foreground font-medium">
                                  {workflowInfo.approverName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-left">
                                <p className="font-medium text-sm">{workflowInfo.approverName}</p>
                                <p className="text-xs text-muted-foreground">{workflowInfo.approverTitle}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                            </button>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80 p-0" side="right" align="start">
                            <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 rounded-lg overflow-hidden">
                              {/* Header */}
                              <div className="p-4 border-b border-gold/10">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-14 w-14 border-2 border-gold/30">
                                    <AvatarImage src={workflowInfo.approverPhoto} alt={workflowInfo.approverName} />
                                    <AvatarFallback className="bg-gradient-to-br from-gold/20 to-champagne/20 text-lg">
                                      {workflowInfo.approverName.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h4 className="font-semibold">{workflowInfo.approverName}</h4>
                                    <p className="text-sm text-muted-foreground">{workflowInfo.approverTitle}</p>
                                    <Badge variant="outline" className="text-xs mt-1 border-gold/30 text-gold">
                                      {workflowInfo.approverDepartment}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              {/* Details */}
                              <div className="p-4 space-y-3 text-sm">
                                <p className="text-muted-foreground">{workflowInfo.approverBio}</p>
                                
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Nationality</p>
                                    <p className="font-medium">{workflowInfo.approverNationality}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Experience</p>
                                    <p className="font-medium">{workflowInfo.approverExperience}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Languages</p>
                                    <p className="font-medium">{workflowInfo.approverLanguages.join(', ')}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Joined</p>
                                    <p className="font-medium">{format(new Date(workflowInfo.joinedDate), 'MMM yyyy')}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          );
        })}

        {/* Live Status */}
        {isLive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-start gap-4"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 border-2 border-green-400 flex-shrink-0 z-10">
              <Check className="h-5 w-5 text-white" />
            </div>
            <Card className="flex-1 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Check className="w-6 h-6 text-green-600" />
                  <div>
                    <h4 className="font-semibold text-green-700 dark:text-green-400">Your Listing is Live!</h4>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      Congratulations! Your property is now visible to potential tenants.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default ApprovalWorkflowTimeline;
