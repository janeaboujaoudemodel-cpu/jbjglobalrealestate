import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageSquare, Video, Phone, FileText, Users, 
  Send, Paperclip, ExternalLink, Hash, AtSign
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'away' | 'offline';
  avatar?: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  isMe?: boolean;
}

interface Channel {
  id: string;
  name: string;
  unread: number;
  type: 'channel' | 'dm';
}

const TEAM_MEMBERS: TeamMember[] = [
  { id: '1', name: 'Jane Abjowwe', role: 'Founder & CEO', status: 'online' },
  { id: '2', name: 'Jessica', role: 'HR Manager', status: 'online' },
  { id: '3', name: 'David Carter', role: 'Head of Recruitment', status: 'away' },
  { id: '4', name: 'Sales Team', role: 'Group', status: 'online' },
];

const CHANNELS: Channel[] = [
  { id: 'general', name: 'general', unread: 0, type: 'channel' },
  { id: 'sales', name: 'sales-team', unread: 3, type: 'channel' },
  { id: 'leads', name: 'hot-leads', unread: 1, type: 'channel' },
  { id: 'announcements', name: 'announcements', unread: 0, type: 'channel' },
];

const RECENT_FILES = [
  { id: '1', name: 'Q4_Sales_Report.pdf', type: 'pdf', size: '2.4 MB', date: '2 hours ago' },
  { id: '2', name: 'Lead_Import_Jan.xlsx', type: 'excel', size: '1.1 MB', date: 'Yesterday' },
  { id: '3', name: 'Property_Presentation.pptx', type: 'pptx', size: '8.5 MB', date: '3 days ago' },
];

const CRMCommunicationPanel = () => {
  const [activeTab, setActiveTab] = useState("chat");
  const [selectedChannel, setSelectedChannel] = useState("general");
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'System', message: 'Welcome to #general channel', timestamp: '09:00 AM' },
    { id: '2', sender: 'Jessica', message: 'Good morning team! New leads coming in from the website.', timestamp: '09:15 AM' },
    { id: '3', sender: 'You', message: 'Great! I\'ll follow up on them today.', timestamp: '09:20 AM', isMe: true },
  ]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'You',
      message: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    }]);
    setNewMessage("");
  };

  const startVideoCall = (member?: TeamMember) => {
    if (member) {
      toast.success(`Starting video call with ${member.name}...`);
    }
    window.open('/video-meeting', '_blank');
  };

  const startVoiceCall = (member: TeamMember) => {
    toast.success(`Calling ${member.name}...`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-amber-500';
      default: return 'bg-zinc-500';
    }
  };

  return (
    <Card className="border-border bg-card h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-white font-bold text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-gold" />
            Team Communication
          </div>
          <div className="flex items-center gap-2">
            <Link to="/video-meeting">
              <Button variant="outline" size="sm" className="h-7 text-xs border-gold/30 text-gold hover:bg-gold/10">
                <Video className="h-3 w-3 mr-1" />
                New Meeting
              </Button>
            </Link>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-muted/30 grid grid-cols-4 rounded-none border-b border-border">
            <TabsTrigger value="chat" className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold text-xs">
              <Hash className="h-3 w-3 mr-1" />
              Channels
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold text-xs">
              <Users className="h-3 w-3 mr-1" />
              Team
            </TabsTrigger>
            <TabsTrigger value="meetings" className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold text-xs">
              <Video className="h-3 w-3 mr-1" />
              Meetings
            </TabsTrigger>
            <TabsTrigger value="files" className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Files
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="m-0">
            <div className="flex h-[300px]">
              {/* Channels Sidebar */}
              <div className="w-1/3 border-r border-border p-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2 px-1">Channels</p>
                <div className="space-y-1">
                  {CHANNELS.map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel.id)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs hover:bg-muted/50 transition-colors ${
                        selectedChannel === channel.id ? 'bg-muted/70 text-white' : 'text-muted-foreground'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Hash className="h-3 w-3" />
                        {channel.name}
                      </span>
                      {channel.unread > 0 && (
                        <Badge className="h-4 px-1.5 text-[10px] bg-gold text-black">
                          {channel.unread}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 p-2">
                  <div className="space-y-3">
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex gap-2 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-muted">
                            {msg.sender[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`max-w-[70%] ${msg.isMe ? 'text-right' : ''}`}>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-medium text-foreground">{msg.sender}</span>
                            <span className="text-[9px] text-muted-foreground">{msg.timestamp}</span>
                          </div>
                          <p className={`text-xs p-2 rounded-lg ${
                            msg.isMe ? 'bg-gold/20 text-foreground' : 'bg-muted/50 text-foreground'
                          }`}>
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                {/* Message Input */}
                <div className="p-2 border-t border-border">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="h-8 text-xs bg-muted border-border"
                    />
                    <Button 
                      size="icon" 
                      className="h-8 w-8 bg-gold text-black hover:bg-gold/90"
                      onClick={sendMessage}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="m-0 p-3">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {TEAM_MEMBERS.map(member => (
                  <div 
                    key={member.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gold/20 text-gold text-xs">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${getStatusColor(member.status)}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{member.name}</p>
                        <p className="text-[10px] text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-green-500 hover:bg-green-500/10"
                        onClick={() => startVoiceCall(member)}
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-blue-500 hover:bg-blue-500/10"
                        onClick={() => startVideoCall(member)}
                      >
                        <Video className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-purple-500 hover:bg-purple-500/10"
                        onClick={() => toast.info(`Opening chat with ${member.name}`)}
                      >
                        <AtSign className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Meetings Tab */}
          <TabsContent value="meetings" className="m-0 p-3">
            <div className="space-y-3">
              <Button 
                className="w-full bg-gold text-black hover:bg-gold/90 font-semibold"
                onClick={() => startVideoCall()}
              >
                <Video className="h-4 w-4 mr-2" />
                Start Instant Meeting
              </Button>
              
              <div className="text-center py-6 text-muted-foreground">
                <Video className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No scheduled meetings</p>
                <p className="text-xs">Start a meeting or schedule one for later</p>
              </div>
              
              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground mb-2">Quick Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/video-meeting">
                    <Button variant="outline" size="sm" className="w-full text-xs h-8">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open Meeting Room
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs h-8"
                    onClick={() => toast.info("Schedule meeting feature coming soon")}
                  >
                    Schedule for Later
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="m-0 p-3">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Recent Files</p>
                {RECENT_FILES.map(file => (
                  <div 
                    key={file.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => toast.info(`Opening ${file.name}...`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-card border border-border">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-[10px] text-muted-foreground">{file.size} • {file.date}</p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
                
                <Button variant="outline" className="w-full mt-3 border-dashed">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Upload New File
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CRMCommunicationPanel;
