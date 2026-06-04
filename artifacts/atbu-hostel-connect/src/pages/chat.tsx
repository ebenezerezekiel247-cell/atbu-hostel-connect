import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Hash, Lock, Shield, Building2, MessageSquare, ChevronLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useListChannels,
  useGetChannelMessages,
  useSendMessage,
  getGetChannelMessagesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { Channel } from "@workspace/api-client-react";

const channelTypeIcon = (type: string) => {
  switch (type) {
    case "hostel_rep": return <Shield className="w-3.5 h-3.5" />;
    case "admin": return <Lock className="w-3.5 h-3.5" />;
    case "hostel_specific": return <Building2 className="w-3.5 h-3.5" />;
    default: return <Hash className="w-3.5 h-3.5" />;
  }
};

const channelTypeBadge = (type: string) => {
  switch (type) {
    case "hostel_rep": return "Rep";
    case "admin": return "Admin";
    case "hostel_specific": return "Hostel";
    default: return null;
  }
};

function ChannelItem({ channel, active, onClick }: { channel: Channel; active: boolean; onClick: () => void }) {
  return (
    <button
      data-testid={`channel-item-${channel.id}`}
      onClick={onClick}
      className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${
        active ? "bg-primary/10 text-primary" : "hover:bg-muted/60 text-foreground"
      }`}
    >
      <span className={`mt-0.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`}>
        {channelTypeIcon(channel.type)}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium truncate">{channel.name}</span>
          {channelTypeBadge(channel.type) && (
            <Badge variant="outline" className="text-xs px-1 py-0 h-4 shrink-0">
              {channelTypeBadge(channel.type)}
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{channel.memberCount} members</div>
      </div>
    </button>
  );
}

function MessagesPane({
  channelId,
  channelName,
  onBackToChannels,
}: {
  channelId: string;
  channelName: string;
  onBackToChannels: () => void;
}) {
  const user = useCurrentUser();
  const qc = useQueryClient();
  const { data: messages, isLoading } = useGetChannelMessages(channelId, {
    query: { queryKey: getGetChannelMessagesQueryKey(channelId) },
  });
  const sendMessage = useSendMessage();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const content = text.trim();
    if (!content) return;
    setText("");
    sendMessage.mutate(
      { channelId, data: { content, senderId: user.id } },
      { onSuccess: () => qc.invalidateQueries({ queryKey: getGetChannelMessagesQueryKey(channelId) }) }
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          {/* Back button — only visible on mobile */}
          <button
            onClick={onBackToChannels}
            className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Back to channels"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
          <h2 className="font-semibold text-foreground truncate">{channelName}</h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`flex gap-3 ${i % 2 === 1 ? "flex-row-reverse" : ""}`}>
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className="space-y-1.5 max-w-xs">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className={`h-10 ${i % 2 === 1 ? "w-48" : "w-64"} rounded-xl`} />
              </div>
            </div>
          ))
        ) : messages && messages.length > 0 ? (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMine = msg.senderId === user.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2.5 ${isMine ? "flex-row-reverse" : ""}`}
                  data-testid={`message-${msg.id}`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {msg.senderName.charAt(0)}
                  </div>
                  <div className={`max-w-[75%] lg:max-w-md ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                    <div className={`flex items-center gap-1.5 mb-1 ${isMine ? "flex-row-reverse" : ""}`}>
                      <span className="text-xs font-medium text-foreground">{msg.senderName}</span>
                      <span className="text-xs text-muted-foreground capitalize">{msg.senderRole.replace("_", " ")}</span>
                    </div>
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMine
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted text-foreground rounded-tl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Be the first to start the conversation</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-border shrink-0">
        <div className="flex gap-2">
          <Input
            data-testid="message-input"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={`Message #${channelName}...`}
            className="flex-1"
          />
          <Button
            data-testid="send-message-btn"
            onClick={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            size="icon"
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const { data: channels, isLoading } = useListChannels();
  const [activeId, setActiveId] = useState<string | null>(null);
  // Mobile: "channels" shows the sidebar, "messages" shows the chat
  const [mobilePane, setMobilePane] = useState<"channels" | "messages">("channels");

  const activeChannel = channels?.find(c => c.id === activeId) ?? channels?.[0];

  const handleChannelClick = (id: string) => {
    setActiveId(id);
    setMobilePane("messages");
  };

  return (
    <div className="h-full flex overflow-hidden" data-testid="chat-page">
      {/* Channel sidebar
          Desktop: always visible (w-64, border-r)
          Mobile: full-width when mobilePane === "channels", hidden otherwise */}
      <aside
        className={`
          border-r border-border flex flex-col
          md:flex md:w-64 md:shrink-0
          ${mobilePane === "channels" ? "flex w-full" : "hidden"}
        `}
      >
        <div className="px-4 py-4 border-b border-border shrink-0">
          <h1 className="font-bold text-foreground">Channels</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Campus communication hub</p>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-3 py-2.5 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            : channels?.map(ch => (
                <ChannelItem
                  key={ch.id}
                  channel={ch}
                  active={(activeChannel?.id ?? channels?.[0]?.id) === ch.id}
                  onClick={() => handleChannelClick(ch.id)}
                />
              ))}
        </div>
      </aside>

      {/* Messages pane
          Desktop: always visible (flex-1)
          Mobile: full-width when mobilePane === "messages", hidden otherwise */}
      <div
        className={`
          flex-1 overflow-hidden
          ${mobilePane === "messages" ? "flex flex-col" : "hidden md:block"}
        `}
      >
        {activeChannel ? (
          <MessagesPane
            channelId={activeChannel.id}
            channelName={activeChannel.name}
            onBackToChannels={() => setMobilePane("channels")}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <Menu className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3 md:hidden" />
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3 hidden md:block" />
            <p className="text-muted-foreground text-sm">
              {isLoading ? "Loading channels..." : "Select a channel to start chatting"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
