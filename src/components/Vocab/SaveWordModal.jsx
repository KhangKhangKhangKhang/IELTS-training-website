import React, { useState, useEffect } from "react";
import { X, Star, FolderPlus, Check } from "lucide-react";
import { getTopicsByUserAPI, saveToCollectionAPI } from "@/services/apiVocab";
import { message } from "antd";

const SaveWordModal = ({ isOpen, onClose, word, user }) => {
  const [topics, setTopics] = useState([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState([]);
  const [newTopicName, setNewTopicName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen && user?.idUser) {
      loadTopics();
    }
  }, [isOpen, user]);

  const loadTopics = async () => {
    try {
      const res = await getTopicsByUserAPI(user.idUser);
      setTopics(res.data || []);
    } catch (err) {
      console.error("Failed to load topics:", err);
    }
  };

  const handleToggleTopic = (topicId) => {
    setSelectedTopicIds(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleSave = async () => {
    if (!word || !user?.idUser) return;

    setLoading(true);
    try {
      const topicId = selectedTopicIds[0] || null;
      await saveToCollectionAPI(user.idUser, word.idVocab, topicId);
      setSaved(true);
      message.success("Đã lưu từ vào bộ sưu tập!");

      setTimeout(() => {
        onClose();
        setSaved(false);
      }, 1000);
    } catch (err) {
      message.error("Không thể lưu từ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Star className="text-yellow-500" size={20} />
            Lưu từ vào bộ sưu tập
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-4">
          <p className="font-bold text-lg text-slate-800">{word?.word}</p>
          <p className="text-slate-500 text-sm">/{word?.phonetic}/</p>
          <p className="text-purple-600 text-sm mt-1">{word?.meaning}</p>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Chọn chủ đề:</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {topics.map(topic => (
              <label
                key={topic.idTopic}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedTopicIds.includes(topic.idTopic)}
                  onChange={() => handleToggleTopic(topic.idTopic)}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">{topic.nameTopic}</span>
              </label>
            ))}
            {topics.length === 0 && (
              <p className="text-sm text-slate-400 italic">Chưa có chủ đề nào</p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <FolderPlus size={16} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-700">Tạo chủ đề mới:</span>
          </div>
          <input
            type="text"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            placeholder="Tên chủ đề mới..."
            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saved}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 ${
              saved ? "bg-green-500" : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saved ? (
              <>
                <Check size={16} /> Đã lưu
              </>
            ) : (
              "Lưu"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveWordModal;