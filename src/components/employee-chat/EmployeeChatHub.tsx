import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Search, 
  MessageCircle, 
  Circle,
  Users,
  Building2,
  Loader2,
  Copy,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { allTeamMembers, TeamMember } from '@/config/team-members';
import { useEmployeeChat } from '@/hooks/useEmployeeChat';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface EmployeeChatHubProps {
  className?: string;
}

const EmployeeChatHub: React.FC<EmployeeChatHubProps> = ({ className }) => {
  const { t } = useLanguage();
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    employeeStatuses, 
    isTyping, 
    loading, 
    sendMessage,
    getEmployee 
  } = useEmployeeChat(selectedEmployee);

  // Get unique departments
  const departments = Array.from(new Set(allTeamMembers.map(m => m.department).filter(Boolean)));

  // Filter employees
  const filteredEmployees = allTeamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.role?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = !selectedDepartment || member.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // On mobile, hide sidebar when employee selected
  const handleSelectEmployee = (id: string) => {
    setSelectedEmployee(id);
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  const handleBackToList = () => {
    setShowSidebar(true);
    if (window.innerWidth < 768) {
      setSelectedEmployee(null);
    }
  };

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedEmployee) {
      sendMessage(messageInput);
      setMessageInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-amber-500';
      case 'away': return 'bg-zinc-400';
      default: return 'bg-zinc-300';
    }
  };

  const getStatusText = (employeeId: string) => {
    const status = employeeStatuses.get(employeeId);
    if (!status) return 'Offline';
    if (status.is_typing) return 'Typing...';
    return status.status.charAt(0).toUpperCase() + status.status.slice(1);
  };

  const selectedEmployeeData = selectedEmployee ? getEmployee(selectedEmployee) : null;

  return (
    <div className={cn(
      "flex h-[calc(100vh-280px)] min-h-[500px] bg-white rounded-xl border border-[#C9A84C]/20 overflow-hidden shadow-sm",
      className
    )}>
      {/* Employee List Sidebar */}
      <div className={cn(
        "w-full md:w-80 border-r border-[#C9A84C]/10 flex flex-col bg-gradient-to-b from-white to-[#FDFBF7]",
        showSidebar ? "flex" : "hidden md:flex"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#C9A84C]/10">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="h-5 w-5 text-[#C9A84C]" />
            <h2 className="font-semibold text-black">Team Chat</h2>
            <Badge variant="outline" className="ml-auto text-xs border-[#C9A84C]/30 text-[#C9A84C]">
              {filteredEmployees.length}
            </Badge>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
            <Input
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#FDFBF7] border-[#C9A84C]/20 text-black placeholder:text-black/40 focus-visible:ring-[#C9A84C]/30"
            />
          </div>
        </div>

        {/* Department Filter - scrollable, no slice limit */}
        <div className="p-2 border-b border-[#C9A84C]/10">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDepartment(null)}
              className={cn(
                "text-xs shrink-0 rounded-full px-3",
                selectedDepartment === null 
                  ? "bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white hover:from-[#B8973F] hover:to-[#A78636]" 
                  : "text-black/70 hover:bg-[#C9A84C]/10 border border-[#C9A84C]/20"
              )}
            >
              <Users className="h-3 w-3 mr-1" />
              All ({allTeamMembers.length})
            </Button>
            {departments.map(dept => {
              const count = allTeamMembers.filter(m => m.department === dept).length;
              return (
                <Button
                  key={dept}
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDepartment(dept || null)}
                  className={cn(
                    "text-xs shrink-0 rounded-full px-3 whitespace-nowrap",
                    selectedDepartment === dept 
                      ? "bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white hover:from-[#B8973F] hover:to-[#A78636]" 
                      : "text-black/70 hover:bg-[#C9A84C]/10 border border-[#C9A84C]/20"
                  )}
                >
                  {dept} ({count})
                </Button>
              );
            })}
          </div>
        </div>

        {/* Employee List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {filteredEmployees.length === 0 && (
              <div className="text-center py-8 text-black/40">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No team members found</p>
              </div>
            )}
            {filteredEmployees.map(employee => {
              const status = employeeStatuses.get(employee.id);
              const isSelected = selectedEmployee === employee.id;
              
              return (
                <button
                  key={employee.id}
                  onClick={() => handleSelectEmployee(employee.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200",
                    isSelected 
                      ? "bg-gradient-to-r from-[#C9A84C]/15 to-[#C9A84C]/5 border border-[#C9A84C]/30 shadow-sm" 
                      : "hover:bg-[#C9A84C]/5 border border-transparent"
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-10 w-10 border border-[#C9A84C]/20">
                      <AvatarImage src={employee.avatar} alt={employee.name} />
                      <AvatarFallback className="bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-semibold">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                      getStatusColor(status?.status)
                    )} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-black truncate">{employee.name}</p>
                    <p className="text-xs text-black/50 truncate">{employee.role}</p>
                  </div>
                  
                  {status?.is_typing && (
                    <div className="flex gap-0.5">
                      <span className="h-1.5 w-1.5 bg-[#C9A84C] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 bg-[#C9A84C] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 bg-[#C9A84C] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6]/30 to-[#EDE4D3]/20",
        !showSidebar ? "flex" : "hidden md:flex"
      )}>
        {selectedEmployeeData ? (
          <>
            {/* Chat Header */}
            <div className="p-3 sm:p-4 border-b border-[#C9A84C]/10 bg-white/80 backdrop-blur-sm flex items-center gap-3">
              {/* Back button on mobile */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToList}
                className="md:hidden shrink-0 h-8 w-8 hover:bg-[#C9A84C]/10"
              >
                <ArrowLeft className="h-4 w-4 text-black" />
              </Button>

              <div className="relative shrink-0">
                <Avatar className="h-10 w-10 border border-[#C9A84C]/20">
                  <AvatarImage src={selectedEmployeeData.avatar} alt={selectedEmployeeData.name} />
                  <AvatarFallback className="bg-[#C9A84C]/10 text-[#C9A84C] text-xs">
                    {selectedEmployeeData.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                  getStatusColor(employeeStatuses.get(selectedEmployee!)?.status)
                )} />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-black text-sm truncate">{selectedEmployeeData.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-black/50">
                  <span className="truncate">{selectedEmployeeData.role}</span>
                  <Circle className="h-1 w-1 fill-current shrink-0" />
                  <span className="shrink-0">{getStatusText(selectedEmployee!)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-[10px] border-[#C9A84C]/20 text-black/60 hidden sm:flex">
                  <Building2 className="h-3 w-3 mr-1" />
                  {selectedEmployeeData.department}
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#C9A84C]/10 hidden sm:flex">
                  <Phone className="h-4 w-4 text-black/60" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#C9A84C]/10 hidden sm:flex">
                  <Video className="h-4 w-4 text-black/60" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#C9A84C]/10">
                  <MoreVertical className="h-4 w-4 text-black/60" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-3 sm:p-4">
              <div className="space-y-3">
                {messages.length === 0 && !loading && (
                  <div className="text-center py-12 text-black/40">
                    <div className="h-16 w-16 rounded-full bg-[#C9A84C]/10 flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="h-8 w-8 text-[#C9A84C]/50" />
                    </div>
                    <p className="font-medium text-black/60">No messages yet</p>
                    <p className="text-sm mt-1">Start a conversation with {selectedEmployeeData.name}</p>
                  </div>
                )}
                
                {messages.map(msg => {
                  const isUser = msg.sender_type === 'user';
                  
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-2.5 group",
                        isUser ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5 border border-[#C9A84C]/10">
                        {isUser ? (
                          <AvatarFallback className="bg-gradient-to-br from-[#C9A84C] to-[#B8973F] text-white text-[10px]">You</AvatarFallback>
                        ) : (
                          <>
                            <AvatarImage src={selectedEmployeeData.avatar} />
                            <AvatarFallback className="bg-[#C9A84C]/10 text-[#C9A84C] text-[10px]">
                              {selectedEmployeeData.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      
                      <div className={cn("flex flex-col max-w-[75%]", isUser ? "items-end" : "items-start")}>
                        <div className={cn(
                          "rounded-2xl px-3.5 py-2.5 select-text cursor-text",
                          isUser 
                            ? "bg-gradient-to-br from-[#C9A84C] to-[#B8973F] text-white rounded-tr-md shadow-md" 
                            : "bg-white text-black border border-[#C9A84C]/15 rounded-tl-md shadow-sm"
                        )}>
                          <p className="text-sm whitespace-pre-wrap select-text leading-relaxed">{msg.message}</p>
                          <p className={cn(
                            "text-[10px] mt-1 select-none",
                            isUser ? "text-white/70" : "text-black/40"
                          )}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {/* Copy Button */}
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(msg.message);
                            toast.success(t('chat.messageCopied') || 'Message copied');
                          }}
                          className={cn(
                            "flex items-center gap-1 mt-0.5 text-[10px] text-black/30 hover:text-[#C9A84C] transition-colors opacity-0 group-hover:opacity-100",
                            isUser ? "mr-1" : "ml-1"
                          )}
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex gap-2.5">
                    <Avatar className="h-7 w-7 border border-[#C9A84C]/10">
                      <AvatarImage src={selectedEmployeeData.avatar} />
                      <AvatarFallback className="bg-[#C9A84C]/10 text-[#C9A84C] text-[10px]">
                        {selectedEmployeeData.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white border border-[#C9A84C]/15 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                      <div className="flex gap-1 items-center h-4">
                        <span className="h-2 w-2 bg-[#C9A84C] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 bg-[#C9A84C] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-2 w-2 bg-[#C9A84C] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-3 sm:p-4 border-t border-[#C9A84C]/10 bg-white/80 backdrop-blur-sm">
              <div className="flex items-end gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 hover:bg-[#C9A84C]/10 hidden sm:flex">
                  <Paperclip className="h-4 w-4 text-black/40" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder={`Message ${selectedEmployeeData.name}...`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="bg-[#FDFBF7] border-[#C9A84C]/20 text-black placeholder:text-black/40 pr-10 focus-visible:ring-[#C9A84C]/30"
                  />
                  <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-[#C9A84C]/10 hidden sm:flex">
                    <Smile className="h-4 w-4 text-black/40" />
                  </Button>
                </div>
                <Button 
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || isTyping}
                  className="h-9 w-9 shrink-0 bg-gradient-to-r from-[#C9A84C] to-[#B8973F] hover:from-[#B8973F] hover:to-[#A78636] text-white shadow-sm"
                  size="icon"
                >
                  {isTyping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-black/30 mt-1.5 px-1">
                Press Enter to send · AI-powered responses · Encrypted
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-black/40">
            <div className="text-center">
              <div className="h-20 w-20 rounded-full bg-[#C9A84C]/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-10 w-10 text-[#C9A84C]/40" />
              </div>
              <h3 className="font-semibold text-black/60 text-lg">Select a Team Member</h3>
              <p className="text-sm mt-1 text-black/40">Choose someone from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeChatHub;
