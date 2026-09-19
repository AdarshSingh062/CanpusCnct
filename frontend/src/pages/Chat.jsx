import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Send } from 'lucide-react';
import { chatApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Avatar from '../components/Avatar';
import { Loader } from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { format } from 'date-fns';

export default function Chat() {
  const { user } = useAuth();
  const { socket, onlineUserIds } = useSocket();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(location.state?.conversationId || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    chatApi.conversations().then((res) => {
      setConversations(res.data.data);
      setLoading(false);
      if (!activeId && res.data.data.length) setActiveId(res.data.data[0]._id);
    });
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!activeId) return;
    chatApi.messages(activeId).then((res) => setMessages(res.data.data));
    socket?.emit('conversation:join', activeId);
    socket?.emit('message:read', { conversationId: activeId });
    return () => socket?.emit('conversation:leave', activeId);
  }, [activeId, socket]);

  useEffect(() => {
    if (!socket) return;
    const onNew = (msg) => { if (msg.conversation === activeId) setMessages((prev) => [...prev, msg]); };
    const onTypingStart = ({ conversationId }) => { if (conversationId === activeId) setTypingUser(true); };
    const onTypingStop = ({ conversationId }) => { if (conversationId === activeId) setTypingUser(false); };
    socket.on('message:new', onNew);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    return () => {
      socket.off('message:new', onNew);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
    };
  }, [socket, activeId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;
    socket.emit('message:send', { conversationId: activeId, text }, (res) => {
      if (res.success) setText('');
    });
  };

  const handleTyping = () => {
    socket?.emit('typing:start', { conversationId: activeId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket?.emit('typing:stop', { conversationId: activeId }), 1500);
  };

  if (loading) return <Loader />;

  const activeConvo = conversations.find((c) => c._id === activeId);
  const otherParticipant = activeConvo?.participants.find((p) => p._id !== user._id);

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-[var(--color-line)] bg-white">
      <div className="w-72 shrink-0 overflow-y-auto border-r border-[var(--color-line)]">
        {conversations.length === 0 ? (
          <EmptyState title="No conversations" description="Start a chat from a marketplace listing or a user's profile." />
        ) : (
          conversations.map((c) => {
            const other = c.participants.find((p) => p._id !== user._id);
            const isOnline = onlineUserIds.has(other?._id);
            return (
              <button
                key={c._id}
                onClick={() => setActiveId(c._id)}
                className={`flex w-full items-center gap-3 border-b border-[var(--color-line)] px-4 py-3 text-left hover:bg-gray-50 ${activeId === c._id ? 'bg-gray-50' : ''}`}
              >
                <div className="relative">
                  <Avatar user={other} />
                  {isOnline && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[var(--color-teal)]" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{other?.name}</p>
                  <p className="truncate text-xs text-gray-400">{c.lastMessage?.text || 'No messages yet'}</p>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="flex flex-1 flex-col">
        {activeConvo ? (
          <>
            <div className="flex items-center gap-3 border-b border-[var(--color-line)] px-4 py-3">
              <Avatar user={otherParticipant} size={32} />
              <div>
                <p className="text-sm font-medium">{otherParticipant?.name}</p>
                <p className="text-xs text-gray-400">{onlineUserIds.has(otherParticipant?._id) ? 'Online' : 'Offline'}</p>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m) => {
                const mine = m.sender._id === user._id;
                return (
                  <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-[var(--color-navy)] text-white' : 'bg-gray-100 text-[var(--color-ink)]'}`}>
                      {m.text}
                      <p className={`mt-1 text-[10px] ${mine ? 'text-white/60' : 'text-gray-400'}`}>{format(new Date(m.createdAt), 'h:mm a')}</p>
                    </div>
                  </div>
                );
              })}
              {typingUser && <p className="text-xs italic text-gray-400">typing…</p>}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="flex gap-2 border-t border-[var(--color-line)] p-3">
              <input
                value={text}
                onChange={(e) => { setText(e.target.value); handleTyping(); }}
                placeholder="Type a message…"
                className="flex-1 rounded-full border border-[var(--color-line)] px-4 py-2 text-sm focus:border-[var(--color-navy)] focus:outline-none"
              />
              <button type="submit" className="rounded-full bg-[var(--color-navy)] p-2.5 text-white">
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <EmptyState title="Select a conversation" />
        )}
      </div>
    </div>
  );
}
