import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { allTeamMembers, TeamMember } from '@/config/team-members';
import { useEmployeeChat } from '@/hooks/useEmployeeChat';
import { cn } from '@/lib/utils';

interface EmployeeChatHubProps {
  className?: string;
}

const EmployeeChatHub: React.FC<EmployeeChatHubProps> = ({ className }) => {
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
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
      case 'away': return 'bg-gray-400';
      default: return 'bg-gray-300';
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
    <div className={cn("flex h-[700px] bg-background rounded-xl border border-border overflow-hidden", className)}>
      {/* Employee List Sidebar */}
      <div className="w-80 border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Employee Chat</h2>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Department Filter */}
        <div className="p-2 border-b border-border">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-1 pb-2">
              <Button
                variant={selectedDepartment === null ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedDepartment(null)}
                className="text-xs"
              >
                <Users className="h-3 w-3 mr-1" />
                All
              </Button>
              {departments.slice(0, 5).map(dept => (
                <Button
                  key={dept}
                  variant={selectedDepartment === dept ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedDepartment(dept || null)}
                  className="text-xs"
                >
                  {dept}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Employee List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredEmployees.map(employee => {
              const status = employeeStatuses.get(employee.id);
              const isSelected = selectedEmployee === employee.id;
              
              return (
                <button
                  key={employee.id}
                  onClick={() => setSelectedEmployee(employee.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                    isSelected 
                      ? "bg-primary/10 border border-primary/20" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={employee.avatar} alt={employee.name} />
                      <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                      getStatusColor(status?.status)
                    )} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{employee.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{employee.role}</p>
                  </div>
                  
                  {status?.is_typing && (
                    <div className="flex gap-0.5">
                      <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedEmployeeData ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedEmployeeData.avatar} alt={selectedEmployeeData.name} />
                  <AvatarFallback>{selectedEmployeeData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                  getStatusColor(employeeStatuses.get(selectedEmployee!)?.status)
                )} />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{selectedEmployeeData.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{selectedEmployeeData.role}</span>
                  <Circle className="h-1 w-1 fill-current" />
                  <span>{getStatusText(selectedEmployee!)}</span>
                </div>
              </div>
              
              <Badge variant="outline" className="text-xs">
                <Building2 className="h-3 w-3 mr-1" />
                {selectedEmployeeData.department}
              </Badge>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 && !loading && (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start a conversation with {selectedEmployeeData.name}</p>
                  </div>
                )}
                
                {messages.map(msg => {
                  const isUser = msg.sender_type === 'user';
                  
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-3 group",
                        isUser ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        {isUser ? (
                          <AvatarFallback className="bg-gold text-black">You</AvatarFallback>
                        ) : (
                          <>
                            <AvatarImage src={selectedEmployeeData.avatar} />
                            <AvatarFallback>{selectedEmployeeData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      
                      <div className="flex flex-col max-w-[70%]">
                        <div className={cn(
                          "rounded-lg p-3 select-text cursor-text",
                          isUser 
                            ? "bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black border border-gold/30 shadow-md rounded-tr-sm" 
                            : "bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black border border-gold/20 shadow-sm rounded-tl-sm"
                        )}>
                          <p className="text-sm whitespace-pre-wrap select-text">{msg.message}</p>
                          <p className="text-xs mt-1 text-black/60 select-none">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {/* Copy Button */}
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(msg.message);
                            toast.success('Message copied');
                          }}
                          className={cn(
                            "flex items-center gap-1 mt-1 text-[10px] text-muted-foreground hover:text-gold transition-colors opacity-0 group-hover:opacity-100",
                            isUser ? "self-end mr-1" : "self-start ml-1"
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
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedEmployeeData.avatar} />
                      <AvatarFallback>{selectedEmployeeData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex gap-1 items-center h-5">
                        <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder={`Message ${selectedEmployeeData.name}...`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || isTyping}
                >
                  {isTyping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send • {selectedEmployeeData.name} will be notified
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="font-medium text-lg">Select an Employee</h3>
              <p className="text-sm">Choose someone from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeChatHub;
