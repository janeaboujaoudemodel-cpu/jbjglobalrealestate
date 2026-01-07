import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, Plus, Hash, AtSign, Smile, Paperclip, Settings,
  Users, Search, Bell, Phone, Video, MoreVertical, MessageSquare
} from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
  channelId: string;
  reactions?: { emoji: string; count: number }[];
}

interface Channel {
  id: string;
  name: string;
  type: "channel" | "dm";
  unread: number;
}

interface User {
  id: string;
  name: string;
  status: "online" | "away" | "offline";
  avatar?: string;
}

const TeamChat = () => {
  const [channels, setChannels] = useState<Channel[]>([
    { id: "general", name: "general", type: "channel", unread: 0 },
    { id: "announcements", name: "announcements", type: "channel", unread: 2 },
    { id: "random", name: "random", type: "channel", unread: 0 },
    { id: "sales", name: "sales", type: "channel", unread: 5 },
  ]);
  const [activeChannel, setActiveChannel] = useState("general");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      userId: "system",
      userName: "System",
      content: "Welcome to the team chat! This is the #general channel.",
      timestamp: new Date().toISOString(),
      channelId: "general"
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser] = useState<User>({ id: "me", name: "You", status: "online" });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const users: User[] = [
    { id: "1", name: "Ahmed Hassan", status: "online" },
    { id: "2", name: "Sara Ali", status: "away" },
    { id: "3", name: "Mohammed Khan", status: "online" },
    { id: "4", name: "Fatima Omar", status: "offline" },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      content: newMessage,
      timestamp: new Date().toISOString(),
      channelId: activeChannel
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  const addChannel = () => {
    const name = prompt("Enter channel name:");
    if (name) {
      const newChannel: Channel = {
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name: name.toLowerCase().replace(/\s+/g, "-"),
        type: "channel",
        unread: 0
      };
      setChannels([...channels, newChannel]);
      toast.success(`#${newChannel.name} created!`);
    }
  };

  const addReaction = (messageId: string, emoji: string) => {
    setMessages(messages.map(m => {
      if (m.id === messageId) {
        const existingReaction = m.reactions?.find(r => r.emoji === emoji);
        if (existingReaction) {
          return {
            ...m,
            reactions: m.reactions?.map(r => 
              r.emoji === emoji ? { ...r, count: r.count + 1 } : r
            )
          };
        }
        return {
          ...m,
          reactions: [...(m.reactions || []), { emoji, count: 1 }]
        };
      }
      return m;
    }));
  };

  const channelMessages = messages.filter(m => m.channelId === activeChannel);
  const activeChannelData = channels.find(c => c.id === activeChannel);

  const statusColors = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    offline: "bg-zinc-500"
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        {/* Workspace Header */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-lg">JJ Workspace</h1>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-800 border-zinc-700"
            />
          </div>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Channels</span>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={addChannel}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            {channels.filter(c => c.type === "channel").map((channel) => (
              <button
                key={channel.id}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm ${
                  activeChannel === channel.id 
                    ? "bg-zinc-700 text-white" 
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
                onClick={() => {
                  setActiveChannel(channel.id);
                  setChannels(channels.map(c => 
                    c.id === channel.id ? { ...c, unread: 0 } : c
                  ));
                }}
              >
                <span className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  {channel.name}
                </span>
                {channel.unread > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {channel.unread}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Direct Messages */}
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Direct Messages</span>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            {users.map((user) => (
              <button
                key={user.id}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <div className="relative">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-zinc-700">
                      {user.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${statusColors[user.status]}`} />
                </div>
                <span className="truncate">{user.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Channel Header */}
        <div className="h-14 border-b border-zinc-800 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-zinc-400" />
            <h2 className="font-semibold">{activeChannelData?.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Users className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {channelMessages.map((message) => (
              <div key={message.id} className="group flex gap-3 hover:bg-zinc-900/50 rounded-lg p-2 -mx-2">
                <Avatar className="h-9 w-9 mt-0.5">
                  <AvatarFallback className="bg-indigo-600 text-sm">
                    {message.userName.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-sm">{message.userName}</span>
                    <span className="text-xs text-zinc-500">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-sm">{message.content}</p>
                  
                  {/* Reactions */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {message.reactions.map((reaction, i) => (
                        <button
                          key={i}
                          className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 rounded-full px-2 py-0.5 text-sm"
                          onClick={() => addReaction(message.id, reaction.emoji)}
                        >
                          <span>{reaction.emoji}</span>
                          <span className="text-zinc-400">{reaction.count}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 -mt-8">
                    <div className="flex gap-1 bg-zinc-800 rounded-lg p-1 shadow-lg border border-zinc-700">
                      {["👍", "❤️", "😂", "🎉"].map((emoji) => (
                        <button
                          key={emoji}
                          className="hover:bg-zinc-700 rounded px-1.5 py-0.5"
                          onClick={() => addReaction(message.id, emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                      <button className="hover:bg-zinc-700 rounded px-1.5 py-0.5">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-4 py-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="w-4 h-4" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message #${activeChannelData?.name}`}
              className="flex-1 bg-transparent border-none focus-visible:ring-0"
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Smile className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <AtSign className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button size="icon" className="h-8 w-8 bg-indigo-600 hover:bg-indigo-700" onClick={sendMessage}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Members Sidebar */}
      <div className="w-60 bg-zinc-900 border-l border-zinc-800 p-4 hidden lg:block">
        <h3 className="text-sm font-semibold text-zinc-400 mb-4">Members — {users.length + 1}</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-indigo-600">You</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 bg-green-500" />
            </div>
            <span className="text-sm">{currentUser.name}</span>
          </div>
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-2 px-2 py-1.5">
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-zinc-700 text-xs">
                    {user.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 ${statusColors[user.status]}`} />
              </div>
              <span className="text-sm text-zinc-400">{user.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamChat;
