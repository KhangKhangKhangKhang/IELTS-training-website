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
  ArrowLeftRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sendChat, chatHistory, clearHistory } from "@/services/apiChatBot";
import { useAuth } from "@/context/authContext";
import { useLocation } from "react-router-dom";

const ChatBotWidget = () => {
  const { user, accessToken } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // --- LOGIC VỊ TRÍ (CHỈ TRÁI HOẶC PHẢI) ---
  const [isRightSide, setIsRightSide] = useState(() => {
    const saved = localStorage.getItem("chatbotSide");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("chatbotSide", JSON.stringify(isRightSide));
  }, [isRightSide]);

  // --- LOGIC CHAT ---
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

  // Ẩn chatbot khi đang làm bài test
  const isOnTestPage = location.pathname.includes("/doTest");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

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
      console.error("Lỗi tải lịch sử:", err);
    }
  };

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
      console.error("Lỗi xoá lịch sử:", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !user?.idUser || loading) return;

    const newMessage = { sender: "user", text: input, timestamp: new Date() };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendChat(
        { idUser: user.idUser, message: input },
        accessToken
      );
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: res.reply || "Tôi chưa hiểu ý bạn.",
            timestamp: new Date(),
          },
        ]);
        setLoading(false);
        setIsTyping(false);
      }, 1000 + Math.random() * 1000);
    } catch (err) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "Lỗi kết nối 😢 Vui lòng thử lại.",
            timestamp: new Date(),
          },
        ]);
        setLoading(false);
        setIsTyping(false);
      }, 1000);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    if (isOpen) loadChatHistory();
  }, [isOpen]);

  // Xử lý kéo thả đổi bên
  const handleDragEnd = (event, info) => {
    const screenWidth = window.innerWidth;
    const dragX = info.point.x;
    if (dragX > screenWidth / 2) {
      setIsRightSide(true);
    } else {
      setIsRightSide(false);
    }
  };

  if (isOnTestPage) return null;

  return (
    <>
      {/* NÚT CHAT FLOATING */}
      <motion.button
        key={isRightSide ? "right-btn" : "left-btn"} // Reset component để tránh lỗi vị trí
        drag="x" // Chỉ kéo ngang
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        onClick={() => !loading && setIsOpen(!isOpen)}
        className={`fixed bottom-6 ${
          isRightSide ? "right-6" : "left-6"
        } bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl z-[9999] cursor-grab active:cursor-grabbing group`}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0, y: isOpen ? 0 : [0, -5, 0] }}
        transition={{
          y: { duration: 2, repeat: Infinity, repeatType: "loop" },
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div animate={{ rotate: isOpen ? 90 : 0 }}>
          {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </motion.div>

        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white"></span>
          </span>
        )}
      </motion.button>

      {/* CỬA SỔ CHAT */}
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

            {/* Main Chat Box */}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.9,
                y: 20,
                x: isRightSide ? 20 : -20,
              }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{
                opacity: 0,
                scale: 0.9,
                y: 20,
                x: isRightSide ? 20 : -20,
              }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`fixed bottom-24 ${
                isRightSide
                  ? "right-4 sm:right-6 origin-bottom-right"
                  : "left-4 sm:left-6 origin-bottom-left"
              } w-[90vw] sm:w-96 h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-[9999]`}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                      <Bot size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-md">IELTS Assistant</h3>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs text-blue-100">
                          Sẵn sàng hỗ trợ
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setIsRightSide(!isRightSide)}
                      title="Đổi phía hiển thị"
                      className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    >
                      <ArrowLeftRight size={18} />
                    </button>
                    <button
                      onClick={handleClear}
                      title="Xoá lịch sử chat"
                      className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors sm:hidden"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50 scroll-smooth">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 opacity-50">
                    <MessageCircle size={48} strokeWidth={1} />
                    <span className="text-sm">Chưa có tin nhắn nào</span>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex mb-4 ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex max-w-[85%] ${
                        msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                          msg.sender === "user"
                            ? "bg-gray-600 ml-2"
                            : "bg-gradient-to-br from-blue-500 to-purple-600 mr-2"
                        }`}
                      >
                        {msg.sender === "user" ? (
                          <User size={14} />
                        ) : (
                          <Bot size={14} />
                        )}
                      </div>

                      <div
                        className={`p-3 text-sm shadow-sm overflow-hidden ${
                          msg.sender === "user"
                            ? "bg-blue-600 text-white rounded-2xl rounded-tr-none"
                            : "bg-white text-gray-800 rounded-2xl rounded-tl-none border border-gray-100"
                        }`}
                      >
                        {/* --- SỬA LỖI Ở ĐÂY --- */}
                        {/* Đưa className ra thẻ div bọc ngoài, không để trong ReactMarkdown */}
                        <div
                          className={`prose prose-sm max-w-none break-words ${
                            msg.sender === "user" ? "prose-invert" : ""
                          }`}
                        >
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                        {/* ------------------- */}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start mb-4"
                  >
                    <div className="flex items-end">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mr-2 flex items-center justify-center">
                        <Bot size={14} className="text-white" />
                      </div>
                      <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex space-x-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75" />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150" />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-gray-100">
                <div className="relative flex items-center">
                  <input
                    className="w-full bg-gray-100 text-sm rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="Nhập câu hỏi IELTS..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    disabled={loading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="absolute right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
                <div className="text-[10px] text-center text-gray-400 mt-2">
                  Powered by IELTS AI • Double check information
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
