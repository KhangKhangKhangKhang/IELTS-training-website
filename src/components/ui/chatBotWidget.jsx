import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  MessageCircle,
  X,
  Trash2,
  Send,
  Bot,
  User,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sendChat, chatHistory, clearHistory } from "@/services/apiChatBot";
import { useAuth } from "@/context/authContext";

const ChatBotWidget = () => {
  const { user, accessToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Xin chào 👋 Tôi là trợ lý ảo IELTS Training! Tôi có thể giúp gì cho bạn?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load chat history
  const loadChatHistory = async () => {
    if (!user?.idUser) return;
    try {
      const res = await chatHistory(user.idUser, accessToken);
      if (Array.isArray(res.messages) && res.messages.length > 0) {
        const mapped = res.messages.map((m) => ({
          sender: m.sender,
          text: m.message,
          timestamp: new Date(),
        }));
        setMessages(mapped);
      }
    } catch (err) {
      console.error("Không thể tải lịch sử chat:", err.response?.data || err);
    }
  };

  // Clear chat history
  const handleClear = async () => {
    if (!user?.idUser) return;
    try {
      await clearHistory(user.idUser, accessToken);
      setMessages([
        {
          sender: "bot",
          text: "Lịch sử chat đã được xoá sạch 🧹",
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error("Không thể xóa lịch sử chat:", err);
    }
  };

  // Send message
  const handleSend = async () => {
    if (!input.trim() || !user?.idUser || loading) return;

    const newMessage = {
      sender: "user",
      text: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendChat(
        { idUser: user.idUser, message: input },
        accessToken
      );

      // Simulate typing effect
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: res.reply || "Xin lỗi, tôi chưa hiểu câu hỏi của bạn.",
            timestamp: new Date(),
          },
        ]);
        setLoading(false);
        setIsTyping(false);
      }, 1500 + Math.random() * 1000);
    } catch (err) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "Xin lỗi, có lỗi xảy ra 😢 Vui lòng thử lại sau.",
            timestamp: new Date(),
          },
        ]);
        setLoading(false);
        setIsTyping(false);
      }, 1000);
    }
  };

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Load history when opening
  useEffect(() => {
    if (isOpen) loadChatHistory();
  }, [isOpen]);

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 z-[9999] group"
        whileHover={{
          scale: 1.1,
          rotate: [0, -5, 5, -5, 0],
        }}
        whileTap={{ scale: 0.9 }}
        animate={{
          y: isOpen ? 0 : [0, -8, 0],
        }}
        transition={{
          y: {
            duration: 2,
            repeat: isOpen ? 0 : Infinity,
            repeatType: "loop",
          },
        }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </motion.div>

        {/* Pulsing dot */}
        {!isOpen && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"
          />
        )}
      </motion.button>

      {/* Chat Popup */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[9998]"
            />

            {/* Chat Container */}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.8,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
                y: 20,
              }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
              }}
              className="fixed bottom-20 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-[9999]"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <motion.div
                      animate={{
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 5,
                      }}
                      className="relative"
                    >
                      <Bot size={28} />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-lg">IELTS Assistant</h3>
                      <div className="flex items-center space-x-1 text-sm text-blue-100">
                        <motion.div
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-2 h-2 bg-green-400 rounded-full"
                        />
                        <span>Online</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleClear}
                      title="Xoá lịch sử chat"
                      className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-80 bg-gradient-to-b from-gray-50 to-white">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                    className={`flex ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="flex items-end space-x-2 max-w-[85%]">
                      {msg.sender === "bot" && (
                        <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <Bot size={12} className="text-white" />
                        </div>
                      )}
                      <div>
                        <div
                          className={`p-3 rounded-2xl text-sm ${
                            msg.sender === "user"
                              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none"
                              : "bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200"
                          }`}
                        >
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>

                        <div
                          className={`text-xs text-gray-500 mt-1 ${
                            msg.sender === "user" ? "text-right" : "text-left"
                          }`}
                        >
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                      {msg.sender === "user" && (
                        <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                          <User size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-end space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Bot size={12} className="text-white" />
                      </div>
                      <div className="bg-gray-100 text-gray-800 p-3 rounded-2xl rounded-bl-none border border-gray-200">
                        <div className="flex space-x-1">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: 0,
                            }}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: 0.2,
                            }}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: 0.4,
                            }}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex space-x-2">
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="Nhập câu hỏi của bạn..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    disabled={loading}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </motion.button>
                </div>
                <div className="text-xs text-gray-500 text-center mt-2">
                  Nhấn Enter để gửi • Trợ lý ảo IELTS
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBotWidget;
