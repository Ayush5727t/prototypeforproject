import React, { useCallback, useRef, useState } from 'react';
import { X, Send, Image as ImageIcon, Trash2, Minimize2, Maximize2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string; // preview only
  timestamp: number;
}

interface AIChatSidebarProps {
  open: boolean;
  onClose: () => void;
}

// Pure frontend UI – no backend calls yet
export const AIChatSidebar: React.FC<AIChatSidebarProps> = ({ open, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'intro1', role: 'assistant', content: 'Hi! I am your farm AI assistant. Ask me about crops, soil or weather.', timestamp: Date.now() - 30000 },
    { id: 'intro2', role: 'assistant', content: 'You can also attach a field or pest image for future analysis (UI only now).', timestamp: Date.now() - 20000 }
  ]);
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const sendMessage = useCallback(() => {
    if (!input.trim() && !attachedImage) return;
    const newMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      imageUrl: attachedImage || undefined,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newMsg, {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'AI response placeholder (no backend wired yet).',
      timestamp: Date.now() + 10
    }]);
    setInput('');
    setAttachedImage(null);
  }, [input, attachedImage]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAttachedImage(url);
  };

  const removeImage = () => setAttachedImage(null);

  if (!open) return null;

  return (
    <div className={`fixed top-0 right-0 h-full w-full sm:w-[420px] z-50 transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm sm:hidden" onClick={onClose} />
      <div className="relative h-full w-full sm:w-[420px] bg-white border-l shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white">
          <div className="flex items-center space-x-2">
            <span className="font-semibold">AI Assistant</span>
            <button
              onClick={() => setCollapsed(c => !c)}
              className="p-1 rounded hover:bg-white/20 transition"
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/20 transition" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Collapsed placeholder */}
        {collapsed && (
          <div className="flex-1 flex flex-col items-center justify-center text-sm text-gray-500">
            <p className="px-4 text-center">Chat collapsed. Expand to continue the conversation.</p>
          </div>
        )}

        {/* Messages */}
        {!collapsed && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm" style={{ scrollbarWidth: 'thin' }}>
            {messages.map(m => (
              <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 shadow text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  {m.content || (m.imageUrl ? 'Image' : '')}
                  {m.imageUrl && (
                    <div className="mt-2">
                      <img src={m.imageUrl} alt="upload preview" className="max-h-40 rounded border" />
                    </div>
                  )}
                </div>
                <span className="mt-1 text-[10px] text-gray-400">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Composer */}
        {!collapsed && (
          <div className="border-t p-3 space-y-2">
            {attachedImage && (
              <div className="relative group inline-block">
                <img src={attachedImage} className="h-20 rounded border object-cover" />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-end space-x-2">
              <div className="flex-1 flex flex-col space-y-2">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  rows={2}
                  placeholder="Ask about crop health, soil, weather..."
                  className="w-full resize-none rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex items-center space-x-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center space-x-1 text-xs px-2 py-1 rounded border bg-white hover:bg-gray-50"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Image</span>
                  </button>
                </div>
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim() && !attachedImage}
                className="h-9 w-9 flex items-center justify-center rounded-full bg-emerald-600 text-white disabled:opacity-40 hover:bg-emerald-700 shadow"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400">Prototype UI – no AI backend connected.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChatSidebar;