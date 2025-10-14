import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  BookOpen,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import {
  createTopicAPI,
  updateTopicAPI,
  deleteTopicAPI,
  createVocabAPI,
  getVocabAPI,
  deleteVocabAPI,
  updateVocabAPI,
  suggestVocabAPI,
} from "../../services/apiVocab";
import { useAuth } from "@/context/authContext";
import { getTopicsByUserAPI } from "@/services/apiVocab";

const Vocabulary = () => {
  const { user } = useAuth();
  const [topics, setTopics] = useState([]);
  const [vocabularies, setVocabularies] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [showEditTopic, setShowEditTopic] = useState(false);
  const [topicToEdit, setTopicToEdit] = useState(null);
  const [error, setError] = useState(null);
  const [newVocabulary, setNewVocabulary] = useState({
    word: "",
    loaiTuVung: "",
    phonetic: "",
    meaning: "",
    example: "",
    level: "Low",
  });
  const [showAddVocabulary, setShowAddVocabulary] = useState(false);
  const [showEditVocabulary, setShowEditVocabulary] = useState(false);
  const [vocabToEdit, setVocabToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // State cho tính năng suggest
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState(null);

  const [validationErrors, setValidationErrors] = useState({
    topic: "",
    vocabulary: "",
  });

  useEffect(() => {
    const fetchTopics = async () => {
      if (!user?.idUser) return;
      setLoadingTopics(true);
      setError(null);
      try {
        const res = await getTopicsByUserAPI(user.idUser);
        setTopics(res.data || []);
      } catch (err) {
        console.error("Failed to fetch topics:", err);
        setError("Không thể tải danh sách chủ đề");
      } finally {
        setLoadingTopics(false);
      }
    };

    fetchTopics();
  }, [user?.idUser]);

  // Effect cho suggest từ vựng - ĐÃ THÊM XỬ LÝ LỖI TIMEOUT
  useEffect(() => {
    if (!showAddVocabulary || newVocabulary.word.trim().length < 2) {
      setSuggestion(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSuggesting(true);
        const word = newVocabulary.word.trim();
        const res = await suggestVocabAPI(word);
        setSuggestion(res);
      } catch (error) {
        console.error("Failed to get suggestion:", error);
        // THÊM XỬ LÝ LỖI TIMEOUT
        if (
          error.code === "ECONNABORTED" ||
          error.message?.includes("timeout")
        ) {
          setError(
            "Kết nối AI bị timeout. Vui lòng thử lại sau hoặc nhập thủ công."
          );
        } else {
          setError("Không thể lấy gợi ý từ AI. Vui lòng nhập thủ công.");
        }
      } finally {
        setIsSuggesting(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [newVocabulary.word, showAddVocabulary]);

  // Hàm áp dụng gợi ý - CẬP NHẬT để bao gồm cả loại từ và level
  const applySuggestion = () => {
    if (suggestion) {
      setNewVocabulary((prev) => ({
        ...prev,
        loaiTuVung: suggestion.loaiTuVung || prev.loaiTuVung,
        phonetic: suggestion.phonetic || prev.phonetic,
        meaning: suggestion.meaning || prev.meaning,
        example: suggestion.example || prev.example,
        level: suggestion.level || prev.level,
      }));
      setSuggestion(null);
    }
  };

  // ============= CÁC HÀM XỬ LÝ KHÁC GIỮ NGUYÊN =============
  const handleAddTopic = async () => {
    if (!newTopic.trim()) {
      setValidationErrors({
        ...validationErrors,
        topic: "Vui lòng nhập tên chủ đề",
      });
      return;
    }

    try {
      const res = await createTopicAPI({
        nameTopic: newTopic,
        idUser: user.idUser,
      });
      setTopics((prev) => [...prev, res.data]);
      setShowAddTopic(false);
      setNewTopic("");
      setValidationErrors({ ...validationErrors, topic: "" });
    } catch (error) {
      console.error("Failed to create topic:", error);
      setError("Không thể tạo chủ đề mới");
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (
      !window.confirm(
        "Bạn có chắc muốn xóa chủ đề này? Tất cả từ vựng trong chủ đề cũng sẽ bị xóa."
      )
    ) {
      return;
    }

    try {
      await deleteTopicAPI(topicId);
      setTopics((prev) => prev.filter((t) => t.idTopic !== topicId));
    } catch (error) {
      console.error("Failed to delete topic:", error);
      setError("Không thể xóa chủ đề");
    }
  };

  const handleEditTopic = async () => {
    if (!topicToEdit) return;

    if (!topicToEdit.nameTopic.trim()) {
      setValidationErrors({
        ...validationErrors,
        topic: "Vui lòng nhập tên chủ đề",
      });
      return;
    }

    try {
      const res = await updateTopicAPI(topicToEdit.idTopic, {
        nameTopic: topicToEdit.nameTopic,
        idUser: user.idUser,
      });

      setTopics((prev) =>
        prev.map((t) =>
          t.idTopic === topicToEdit.idTopic
            ? { ...t, nameTopic: topicToEdit.nameTopic }
            : t
        )
      );
      setShowEditTopic(false);
      setTopicToEdit(null);
      setValidationErrors({ ...validationErrors, topic: "" });
    } catch (error) {
      console.error("Failed to update topic:", error);
      setError("Không thể cập nhật chủ đề");
    }
  };

  const handleSelectTopic = async (topicId) => {
    const updatedTopics = topics.map((topic) => ({
      ...topic,
      isSelected: topic.idTopic === topicId,
    }));
    setTopics(updatedTopics);
    try {
      const res = await getVocabAPI(topicId);
      setVocabularies(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch vocabularies:", err);
      setError("Không thể tải từ vựng trong chủ đề");
    }
  };

  const handleAddVocabulary = async () => {
    if (!selectedTopic) {
      setError("Vui lòng chọn một chủ đề trước khi thêm từ vựng");
      return;
    }
    if (!user?.idUser) {
      setError("Không thể xác định người dùng. Vui lòng đăng nhập lại.");
      return;
    }

    const vocabErrors = validateVocabulary(newVocabulary);
    if (vocabErrors) {
      setValidationErrors({ ...validationErrors, vocabulary: vocabErrors });
      return;
    }

    try {
      const res = await createVocabAPI({
        idUser: user.idUser,
        idTopic: selectedTopic.idTopic,
        word: newVocabulary.word,
        phonetic: newVocabulary.phonetic,
        meaning: newVocabulary.meaning,
        example: newVocabulary.example,
        loaiTuVung: newVocabulary.loaiTuVung,
        level: newVocabulary.level,
      });
      setVocabularies((prev) => [...prev, res.data]);
      setShowAddVocabulary(false);
      setSearchTerm("");
      setNewVocabulary({
        word: "",
        loaiTuVung: "",
        phonetic: "",
        meaning: "",
        example: "",
        level: "Low",
      });
      setSuggestion(null);
      setValidationErrors({ ...validationErrors, vocabulary: "" });
    } catch (error) {
      console.error(
        "Error adding vocabulary:",
        error.response?.data || error.message
      );
      setError(error.response?.data?.message || "Không thể thêm từ vựng");
    }
  };

  const handleDeleteVocabulary = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa từ vựng này?")) return;

    try {
      await deleteVocabAPI(id, user.idUser);
      setVocabularies((prev) => prev.filter((v) => v.idTuVung !== id));
    } catch (err) {
      console.error("Failed to delete vocabulary:", err);
      setError("Không thể xóa từ vựng");
    }
  };

  const handleEditVocabulary = async () => {
    if (!vocabToEdit) return;

    const vocabErrors = validateVocabulary(vocabToEdit);
    if (vocabErrors) {
      setValidationErrors({ ...validationErrors, vocabulary: vocabErrors });
      return;
    }

    try {
      const res = await updateVocabAPI(vocabToEdit.idTuVung, {
        idUser: user.idUser,
        idTopic: selectedTopic.idTopic,
        word: vocabToEdit.word,
        phonetic: vocabToEdit.phonetic,
        meaning: vocabToEdit.meaning,
        example: vocabToEdit.example,
        loaiTuVung: vocabToEdit.loaiTuVung,
        level: vocabToEdit.level,
      });

      setVocabularies((prev) =>
        prev.map((v) =>
          v.idTuVung === vocabToEdit.idTuVung ? { ...v, ...vocabToEdit } : v
        )
      );
      setShowEditVocabulary(false);
      setVocabToEdit(null);
      setValidationErrors({ ...validationErrors, vocabulary: "" });
    } catch (error) {
      console.error("Failed to update vocabulary:", error);
      setError("Không thể cập nhật từ vựng");
    }
  };

  const validateVocabulary = (vocab) => {
    const errors = [];
    if (!vocab.word.trim()) errors.push("từ vựng");
    if (!vocab.meaning.trim()) errors.push("nghĩa");
    if (!vocab.loaiTuVung.trim()) errors.push("loại từ");

    if (errors.length > 0) {
      return `Vui lòng nhập ${errors.join(", ")}`;
    }
    return null;
  };

  const resetValidationErrors = () => {
    setValidationErrors({ topic: "", vocabulary: "" });
  };

  const handleCloseAddVocabulary = () => {
    setShowAddVocabulary(false);
    setSuggestion(null);
    setIsSuggesting(false);
    resetValidationErrors();
  };

  const selectedTopic = topics.find((topic) => topic.isSelected);
  const filteredVocabularies = selectedTopic
    ? vocabularies.filter(
        (vocab) =>
          vocab.idTopic === selectedTopic.idTopic &&
          vocab.word.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-6 flex items-center">
          <BookOpen className="mr-3" /> Từ Vựng IELTS
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right text-red-800 font-bold"
            >
              ×
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-700">Chủ đề</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddTopic(true)}
                className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-full transition-colors"
                title="Thêm chủ đề mới"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <div key={topic.idTopic} className="relative group">
                <button
                  onClick={() => handleSelectTopic(topic.idTopic)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    topic.isSelected
                      ? "bg-slate-800 text-white"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  {topic.nameTopic}
                </button>

                <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTopicToEdit(topic);
                      setShowEditTopic(true);
                    }}
                    className="bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600 transition-colors"
                    title="Chỉnh sửa chủ đề"
                  >
                    <Edit size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTopic(topic.idTopic);
                    }}
                    className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                    title="Xóa chủ đề"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}

            {topics.length === 0 && (
              <p className="text-slate-500 text-sm">
                Chưa có chủ đề nào. Hãy thêm chủ đề mới!
              </p>
            )}
          </div>
        </div>

        {showAddTopic && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Thêm chủ đề mới</h3>
              <input
                type="text"
                value={newTopic}
                onChange={(e) => {
                  setNewTopic(e.target.value);
                  if (validationErrors.topic) {
                    setValidationErrors({ ...validationErrors, topic: "" });
                  }
                }}
                className={`w-full p-2 border rounded-md mb-1 ${
                  validationErrors.topic ? "border-red-500" : "border-slate-300"
                }`}
                placeholder="Tên chủ đề mới"
                autoFocus
                onKeyPress={(e) => e.key === "Enter" && handleAddTopic()}
              />
              {validationErrors.topic && (
                <p className="text-red-500 text-sm mb-3">
                  {validationErrors.topic}
                </p>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowAddTopic(false);
                    resetValidationErrors();
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddTopic}
                  className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700"
                >
                  Thêm
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditTopic && topicToEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Sửa chủ đề</h3>
              <input
                type="text"
                value={topicToEdit.nameTopic}
                onChange={(e) => {
                  setTopicToEdit({ ...topicToEdit, nameTopic: e.target.value });
                  if (validationErrors.topic) {
                    setValidationErrors({ ...validationErrors, topic: "" });
                  }
                }}
                className={`w-full p-2 border rounded-md mb-1 ${
                  validationErrors.topic ? "border-red-500" : "border-slate-300"
                }`}
                autoFocus
                onKeyPress={(e) => e.key === "Enter" && handleEditTopic()}
              />
              {validationErrors.topic && (
                <p className="text-red-500 text-sm mb-3">
                  {validationErrors.topic}
                </p>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowEditTopic(false);
                    resetValidationErrors();
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Hủy
                </button>
                <button
                  onClick={handleEditTopic}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedTopic && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-700">
                Từ vựng: {selectedTopic.nameTopic}
              </h2>
              <div className="flex space-x-4">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Tìm kiếm từ vựng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
                <button
                  onClick={() => setShowAddVocabulary(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
                >
                  <Plus size={18} className="mr-1" /> Thêm từ
                </button>
              </div>
            </div>

            {vocabularies.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Từ vựng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Loại từ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Phonetic
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Nghĩa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Ví dụ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredVocabularies.map((vocab, index) => (
                      <tr key={vocab.idTuVung || `temp-${index}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {vocab.word}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          {vocab.loaiTuVung}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          {vocab.level}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                          {vocab.phonetic}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {vocab.meaning}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {vocab.example}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setVocabToEdit(vocab);
                                setShowEditVocabulary(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Chỉnh sửa"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteVocabulary(vocab.idTuVung)
                              }
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Xóa"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <p>Chưa có từ vựng nào trong chủ đề này.</p>
                <button
                  onClick={() => setShowAddVocabulary(true)}
                  className="mt-4 text-slate-800 hover:text-slate-600 underline"
                >
                  Thêm từ vựng đầu tiên
                </button>
              </div>
            )}
          </div>
        )}

        {!selectedTopic && topics.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-slate-600">
              Vui lòng chọn một chủ đề để xem từ vựng.
            </p>
          </div>
        )}

        {/* Modal Add Vocabulary - ĐÃ CẬP NHẬT VỚI GỢI Ý ĐẦY ĐỦ */}
        {showAddVocabulary && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Sparkles className="mr-2 text-yellow-500" size={20} />
                Thêm từ vựng mới
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Từ vựng *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newVocabulary.word}
                      onChange={(e) => {
                        setNewVocabulary({
                          ...newVocabulary,
                          word: e.target.value,
                        });
                        if (validationErrors.vocabulary) {
                          setValidationErrors({
                            ...validationErrors,
                            vocabulary: "",
                          });
                        }
                      }}
                      className={`w-full p-2 border rounded-md pr-10 ${
                        validationErrors.vocabulary &&
                        !newVocabulary.word.trim()
                          ? "border-red-500"
                          : "border-slate-300"
                      }`}
                      placeholder="Nhập từ vựng..."
                      autoFocus
                    />
                    {isSuggesting && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                  {newVocabulary.word.length > 0 &&
                    newVocabulary.word.length < 2 && (
                      <p className="text-xs text-slate-500 mt-1">
                        Nhập ít nhất 2 ký tự để gợi ý
                      </p>
                    )}
                </div>

                {/* Hiển thị gợi ý - ĐÃ CẬP NHẬT VỚI LOẠI TỪ VÀ LEVEL */}
                {/* Hiển thị gợi ý - ĐÃ CẬP NHẬT VỚI LOẠI TỪ VÀ LEVEL */}
                {suggestion && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="flex items-start mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                      <AlertTriangle
                        className="text-yellow-500 mr-2 mt-0.5 flex-shrink-0"
                        size={16}
                      />
                      <p className="text-xs text-yellow-700">
                        <span className="font-medium">Lưu ý:</span> Gợi ý từ AI
                        có thể không chính xác 100%. Vui lòng kiểm tra lại thông
                        tin trước khi lưu.
                      </p>
                    </div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-blue-800">
                        💡 Gợi ý từ AI
                      </span>
                      <button
                        onClick={applySuggestion}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      >
                        Áp dụng tất cả
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {suggestion.loaiTuVung && (
                        <div>
                          <span className="text-xs text-blue-600 font-medium">
                            Loại từ:{" "}
                          </span>
                          <span>{suggestion.loaiTuVung}</span>
                        </div>
                      )}
                      {suggestion.level && (
                        <div>
                          <span className="text-xs text-blue-600 font-medium">
                            Level:{" "}
                          </span>
                          <span>{suggestion.level}</span>
                        </div>
                      )}
                    </div>

                    {suggestion.phonetic && (
                      <div className="mt-2">
                        <span className="text-xs text-blue-600 font-medium">
                          Phát âm:{" "}
                        </span>
                        <span className="text-sm">{suggestion.phonetic}</span>
                      </div>
                    )}

                    {suggestion.meaning && (
                      <div className="mt-2">
                        <span className="text-xs text-blue-600 font-medium">
                          Nghĩa:{" "}
                        </span>
                        <span className="text-sm">{suggestion.meaning}</span>
                      </div>
                    )}

                    {suggestion.example && (
                      <div className="mt-2">
                        <span className="text-xs text-blue-600 font-medium">
                          Ví dụ:{" "}
                        </span>
                        <span className="text-sm italic">
                          "{suggestion.example}"
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Hiển thị thông báo khi từ không hợp lệ hoặc timeout */}
                {newVocabulary.word.trim().length >= 2 &&
                  !isSuggesting &&
                  !suggestion && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <div className="flex items-center">
                        <AlertTriangle
                          className="text-yellow-500 mr-2"
                          size={40}
                        />
                        <p className="text-sm text-yellow-700">
                          Không tìm thấy gợi ý cho từ "
                          <span className="font-medium">
                            {newVocabulary.word}
                          </span>
                          ". Có thể từ này không tồn tại hoặc không hợp lệ. Vui
                          lòng kiểm tra lại chính tả hoặc nhập thủ công.
                        </p>
                      </div>
                    </div>
                  )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Loại từ *
                  </label>
                  <select
                    value={newVocabulary.loaiTuVung}
                    onChange={(e) => {
                      setNewVocabulary({
                        ...newVocabulary,
                        loaiTuVung: e.target.value,
                      });
                      if (validationErrors.vocabulary) {
                        setValidationErrors({
                          ...validationErrors,
                          vocabulary: "",
                        });
                      }
                    }}
                    className={`w-full p-2 border rounded-md ${
                      validationErrors.vocabulary &&
                      !newVocabulary.loaiTuVung.trim()
                        ? "border-red-500"
                        : "border-slate-300"
                    }`}
                  >
                    <option value="">Chọn loại từ</option>
                    <option value="NOUN">Noun</option>
                    <option value="VERB">Verb</option>
                    <option value="ADJECTIVE">Adjective</option>
                    <option value="ADVERB">Adverb</option>
                    <option value="PHRASE">Phrases</option>
                    <option value="IDIOM">Idiom</option>
                    <option value="PREPOSITION">Preposition</option>
                    <option value="CONJUNCTION">Conjunction</option>
                    <option value="INTERJECTION">Interjection</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Level
                  </label>
                  <select
                    value={newVocabulary.level}
                    onChange={(e) =>
                      setNewVocabulary({
                        ...newVocabulary,
                        level: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-md"
                  >
                    <option value="Low">Low</option>
                    <option value="Mid">Mid</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phonetic
                  </label>
                  <input
                    type="text"
                    value={newVocabulary.phonetic}
                    onChange={(e) =>
                      setNewVocabulary({
                        ...newVocabulary,
                        phonetic: e.target.value,
                      })
                    }
                    placeholder="/ɪɡˈzɑːmpəl/"
                    className="w-full p-2 border border-slate-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nghĩa *
                  </label>
                  <input
                    type="text"
                    value={newVocabulary.meaning}
                    onChange={(e) => {
                      setNewVocabulary({
                        ...newVocabulary,
                        meaning: e.target.value,
                      });
                      if (validationErrors.vocabulary) {
                        setValidationErrors({
                          ...validationErrors,
                          vocabulary: "",
                        });
                      }
                    }}
                    className={`w-full p-2 border rounded-md ${
                      validationErrors.vocabulary &&
                      !newVocabulary.meaning.trim()
                        ? "border-red-500"
                        : "border-slate-300"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ví dụ
                  </label>
                  <textarea
                    value={newVocabulary.example}
                    onChange={(e) =>
                      setNewVocabulary({
                        ...newVocabulary,
                        example: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-md"
                    rows="2"
                    placeholder="Nhập câu ví dụ..."
                  />
                </div>
              </div>

              {validationErrors.vocabulary && (
                <p className="text-red-500 text-sm mt-2">
                  {validationErrors.vocabulary}
                </p>
              )}

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={handleCloseAddVocabulary}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddVocabulary}
                  disabled={
                    !newVocabulary.word.trim() ||
                    !newVocabulary.meaning.trim() ||
                    !newVocabulary.loaiTuVung.trim()
                  }
                  className={`px-4 py-2 rounded-md ${
                    !newVocabulary.word.trim() ||
                    !newVocabulary.meaning.trim() ||
                    !newVocabulary.loaiTuVung.trim()
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                >
                  Thêm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Edit Vocabulary - GIỮ NGUYÊN */}
        {showEditVocabulary && vocabToEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Chỉnh sửa từ vựng</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Từ vựng *
                  </label>
                  <input
                    type="text"
                    value={vocabToEdit.word}
                    onChange={(e) => {
                      setVocabToEdit({ ...vocabToEdit, word: e.target.value });
                      if (validationErrors.vocabulary) {
                        setValidationErrors({
                          ...validationErrors,
                          vocabulary: "",
                        });
                      }
                    }}
                    className={`w-full p-2 border rounded-md ${
                      validationErrors.vocabulary && !vocabToEdit.word.trim()
                        ? "border-red-500"
                        : "border-slate-300"
                    }`}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Loại từ *
                  </label>
                  <select
                    value={vocabToEdit.loaiTuVung}
                    onChange={(e) => {
                      setVocabToEdit({
                        ...vocabToEdit,
                        loaiTuVung: e.target.value,
                      });
                      if (validationErrors.vocabulary) {
                        setValidationErrors({
                          ...validationErrors,
                          vocabulary: "",
                        });
                      }
                    }}
                    className={`w-full p-2 border rounded-md ${
                      validationErrors.vocabulary &&
                      !vocabToEdit.loaiTuVung.trim()
                        ? "border-red-500"
                        : "border-slate-300"
                    }`}
                  >
                    <option value="">-- Chọn loại từ --</option>
                    <option value="NOUN">Noun</option>
                    <option value="VERB">Verb</option>
                    <option value="ADJECTIVE">Adjective</option>
                    <option value="ADVERB">Adverb</option>
                    <option value="PHRASE">Phrases</option>
                    <option value="IDIOM">Idiom</option>
                    <option value="PREPOSITION">Preposition</option>
                    <option value="CONJUNCTION">Conjunction</option>
                    <option value="INTERJECTION">Interjection</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Level
                  </label>
                  <select
                    value={vocabToEdit.level || "Low"}
                    onChange={(e) =>
                      setVocabToEdit({
                        ...vocabToEdit,
                        level: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-md"
                  >
                    <option value="Low">Low</option>
                    <option value="Mid">Mid</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phonetic
                  </label>
                  <input
                    type="text"
                    value={vocabToEdit.phonetic}
                    onChange={(e) =>
                      setVocabToEdit({
                        ...vocabToEdit,
                        phonetic: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nghĩa *
                  </label>
                  <input
                    type="text"
                    value={vocabToEdit.meaning}
                    onChange={(e) => {
                      setVocabToEdit({
                        ...vocabToEdit,
                        meaning: e.target.value,
                      });
                      if (validationErrors.vocabulary) {
                        setValidationErrors({
                          ...validationErrors,
                          vocabulary: "",
                        });
                      }
                    }}
                    className={`w-full p-2 border rounded-md ${
                      validationErrors.vocabulary && !vocabToEdit.meaning.trim()
                        ? "border-red-500"
                        : "border-slate-300"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ví dụ
                  </label>
                  <textarea
                    value={vocabToEdit.example}
                    onChange={(e) =>
                      setVocabToEdit({
                        ...vocabToEdit,
                        example: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-md"
                    rows="2"
                  />
                </div>
              </div>

              {validationErrors.vocabulary && (
                <p className="text-red-500 text-sm mt-2">
                  {validationErrors.vocabulary}
                </p>
              )}

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => {
                    setShowEditVocabulary(false);
                    resetValidationErrors();
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Hủy
                </button>
                <button
                  onClick={handleEditVocabulary}
                  disabled={
                    !vocabToEdit.word.trim() ||
                    !vocabToEdit.meaning.trim() ||
                    !vocabToEdit.loaiTuVung.trim()
                  }
                  className={`px-4 py-2 rounded-md ${
                    !vocabToEdit.word.trim() ||
                    !vocabToEdit.meaning.trim() ||
                    !vocabToEdit.loaiTuVung.trim()
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-500"
                  }`}
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vocabulary;
