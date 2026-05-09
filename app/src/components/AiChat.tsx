import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const bookRecommendations: Record<string, string> = {
  fiction: "For fiction lovers, I recommend 'The Midnight Garden' - a beautifully woven tale of mystery and romance. 'Echoes of Tomorrow' offers a stunning futuristic narrative.",
  "non-fiction": "In non-fiction, 'Thinking Clearly' provides essential insights into decision-making psychology. 'The Art of Rest' explores the science of relaxation.",
  science: "Science enthusiasts should check out 'Quantum Worlds' for mind-bending physics concepts. 'The Nature Code' connects biology with natural patterns.",
  history: "History buffs will love 'Empires of Sand' - a sweeping account of ancient civilizations. 'The Silk Roads' offers a fascinating perspective on trade routes.",
  technology: "For tech readers, 'Code & Craft' bridges programming and artistry. 'Digital Minds' provides thought-provoking insights into AI.",
  children: "Young readers will adore 'The Little Explorer' - a delightful adventure story. 'Starlight Stories' offers magical bedtime tales.",
  "self-help": "Looking for personal growth? 'The 5 AM Club' transforms morning routines. 'Atomic Habits' provides practical strategies for lasting change.",
  mystery: "Mystery fans must read 'The Silent Witness' - a gripping Victorian-era whodunit. 'Shadow Play' delivers a masterful noir thriller.",
  fantasy: "Fantasy lovers, dive into 'Realm of Dragons' for epic world-building. 'The Crystal Throne' weaves a mesmerizing tale of magic.",
  romance: "For romance readers, 'Love in Paris' captures the magic of finding love abroad. 'The Coffee Shop Date' is a heartwarming love story.",
  recommend: "Here are some of our most loved books: 'The Midnight Garden' (Fiction), 'Quantum Worlds' (Science), 'The 5 AM Club' (Self-Help). What genre interests you most?",
  hello: "Hello! Welcome to BookHaven! I'm your AI book assistant. I can help you discover your next great read, suggest books by genre, or answer questions. What type of books do you enjoy?",
  thanks: "You're very welcome! Happy reading! If you need any more recommendations, I'm always here to help.",
  price: "Our books range from $9.99 to $34.99, with most titles priced between $14.99 and $24.99. We also offer free shipping on orders over $35!",
  shipping: "We offer free standard shipping on orders over $35! Standard delivery takes 3-5 business days. Express shipping (1-2 days) is available for $9.99.",
  default: "I'd be happy to help! Could you tell me more about what genres you enjoy? We have Fiction, Science, History, Self-Help, Mystery, Fantasy, Romance, and more.",
};

function getResponse(message: string): string {
  const lower = message.toLowerCase();
  for (const [key, response] of Object.entries(bookRecommendations)) {
    if (lower.includes(key)) return response;
  }
  return bookRecommendations.default;
}

export default function AiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your BookHaven AI assistant. I can help you find the perfect book, answer questions about our collection, or give reading recommendations. What are you looking for today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Simulate API delay for natural feel
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));

    const reply = getResponse(userMessage);
    const assistantMsg: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: reply,
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#fa5e50] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#e54d40] transition-colors"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[500px] bg-white rounded-2xl shadow-2xl border border-[#e5e5e0] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#fa5e50] text-white px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">BookHaven Assistant</h3>
                <p className="text-white/70 text-xs">AI-powered recommendations</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === "user"
                        ? "bg-[#fa5e50]/10"
                        : "bg-[#f4f4f0]"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="w-3.5 h-3.5 text-[#fa5e50]" />
                    ) : (
                      <Bot className="w-3.5 h-3.5 text-[#666666]" />
                    )}
                  </div>
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#fa5e50] text-white rounded-tr-sm"
                        : "bg-[#f4f4f0] text-[#1a1a1a] rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#f4f4f0] flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-[#666666]" />
                  </div>
                  <div className="bg-[#f4f4f0] px-3 py-2 rounded-xl rounded-tl-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-[#999] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-[#999] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-[#999] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-[#e5e5e0] p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about books..."
                  className="flex-1 px-3 py-2 text-sm border border-[#e5e5e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fa5e50]/30"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="btn-primary py-2 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
