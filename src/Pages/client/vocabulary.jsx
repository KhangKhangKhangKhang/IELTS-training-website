import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Sparkles,
  AlertTriangle,
  ArrowLeft,
  X,
  CheckCircle2,
  Clock,
  Calendar,
  BookOpen,
  Star,
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
  getVocabStatsAPI,
  getDailySessionAPI,
  getTopicsByUserAPI,
  submitReviewAPI,
  getAllVocabByUserAPI,
} from "../../services/apiVocab";
import { useAuth } from "@/context/authContext";
import FlashcardModal from "@/components/Vocab/FlashcardModal";
import FillInPractice from "@/components/Vocab/FillInPractice";
import MultipleChoicePractice from "@/components/Vocab/MultipleChoicePractice";

// === Color/icon pools (BE doesn't store these) ===
const TOPIC_COLOR_POOL = [
  "from-[#6366f1] to-[#a855f7]",
  "from-[#06b6d4] to-[#0891b2]",
  "from-[#fb7185] to-[#e11d48]",
  "from-[#a855f7] to-[#7e22ce]",
  "from-[#f59e0b] to-[#d97706]",
  "from-[#10b981] to-[#059669]",
];
const TOPIC_ICON_POOL = ["📚", "🌱", "💼", "🏥", "✈️", "🌍", "🎓", "💻", "🎨", "⚽"];

const LEVEL_STYLE = {
  High: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  Mid: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  Low: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
};

const STATUS_META = {
  mastered: { label: "✓ Đã thuộc", tone: "bg-[#d1fae5] text-[#047857]" },
  review: { label: "Đang ôn", tone: "bg-[#fef3c7] text-[#b45309]" },
  learning: { label: "Đang học", tone: "bg-[#fef3c7] text-[#b45309]" },
  new: { label: "Mới", tone: "bg-[#eef2ff] text-[#4338ca]" },
};

// === Modal: Tính năng đang phát triển ===
const ComingSoonModal = ({ isOpen, onClose, featureName }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center text-3xl mb-4 shadow-[0_4px_0_#b45309]">
          🚧
        </div>
        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">
          {featureName || "Tính năng này"}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          đang được phát triển. Vui lòng quay lại sau!
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-white font-extrabold uppercase tracking-wide text-sm shadow-[0_4px_0_#4338ca] active:translate-y-[2px] active:shadow-[0_2px_0_#4338ca] transition-all"
        >
          Đã hiểu
        </button>
      </div>
    </div>
  );
};

// === Topic CRUD modal ===
const TopicModal = ({ mode, value, onChange, onClose, onSubmit, error }) => {
  if (!value) return null;
  const isEdit = mode === "edit";
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-800 dark:text-white">
            {isEdit ? "Sửa chủ đề" : "Thêm chủ đề mới"}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X size={22} />
          </button>
        </div>
        <input
          type="text"
          value={value.nameTopic}
          onChange={(e) => onChange({ ...value, nameTopic: e.target.value })}
          onKeyPress={(e) => e.key === "Enter" && onSubmit()}
          placeholder="Tên chủ đề (vd: Environment, Education...)"
          autoFocus
          className={`w-full p-3 rounded-2xl border-2 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#6366f1] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.18)] transition-all ${
            error ? "border-red-500" : "border-slate-200 dark:border-slate-600"
          }`}
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white font-bold rounded-2xl"
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            className="px-5 py-2.5 bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-white rounded-2xl font-extrabold uppercase tracking-wide text-xs shadow-[0_3px_0_#4338ca] active:translate-y-[1px] active:shadow-[0_2px_0_#4338ca] transition-all"
          >
            {isEdit ? "Lưu" : "Thêm"}
          </button>
        </div>
      </div>
    </div>
  );
};

// === Vocab CRUD modal (share add/edit) ===
const VocabFormModal = ({
  mode,
  value,
  setValue,
  onClose,
  onSubmit,
  error,
  isSuggesting,
  suggestion,
  onApplySuggestion,
}) => {
  if (!value) return null;
  const isEdit = mode === "edit";
  const update = (patch) => setValue({ ...value, ...patch });
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            {isEdit ? <Edit size={20} className="text-indigo-500" /> : <Sparkles size={20} className="text-amber-500" />}
            {isEdit ? "Chỉnh sửa từ vựng" : "Thêm từ vựng mới"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={22} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Từ vựng *
            </label>
            <div className="relative">
              <input
                type="text"
                value={value.word}
                onChange={(e) => update({ word: e.target.value })}
                placeholder="Nhập từ vựng..."
                autoFocus
                className="w-full p-3 pr-10 rounded-2xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#6366f1] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.18)] transition-all"
              />
              {isSuggesting && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#6366f1]"></div>
                </div>
              )}
            </div>
          </div>

          {suggestion && (
            <div className="bg-gradient-to-br from-[#eef2ff] to-[#f3e8ff] border-2 border-[#a855f7]/30 rounded-2xl p-4">
              <div className="flex items-start gap-2 mb-3 p-2 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="text-amber-500 mt-0.5 flex-shrink-0" size={14} />
                <p className="text-[11px] text-amber-700 leading-tight">Gợi ý AI có thể không chính xác 100%.</p>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-extrabold text-[#4338ca]">💡 Gợi ý từ AI</span>
                <button
                  onClick={onApplySuggestion}
                  className="text-[10px] font-extrabold uppercase tracking-wide bg-[#6366f1] text-white px-2.5 py-1 rounded-lg hover:brightness-110"
                >
                  Áp dụng tất cả
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {suggestion.VocabType && <div><span className="text-[#4338ca] font-bold">Loại:</span> {suggestion.VocabType}</div>}
                {suggestion.level && <div><span className="text-[#4338ca] font-bold">Level:</span> {suggestion.level}</div>}
                {suggestion.phonetic && <div className="col-span-2"><span className="text-[#4338ca] font-bold">Phát âm:</span> {suggestion.phonetic}</div>}
                {suggestion.meaning && <div className="col-span-2"><span className="text-[#4338ca] font-bold">Nghĩa:</span> {suggestion.meaning}</div>}
                {suggestion.example && <div className="col-span-2"><span className="text-[#4338ca] font-bold">Ví dụ:</span> <em>"{suggestion.example}"</em></div>}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Loại từ *
            </label>
            <select
              value={value.VocabType}
              onChange={(e) => update({ VocabType: e.target.value })}
              className="w-full p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#6366f1] transition-all"
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
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["Low", "Mid", "High"].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => update({ level: l })}
                  className={`py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-wide border-2 transition-all ${
                    value.level === l
                      ? l === "High"
                        ? "bg-red-500 text-white border-red-500 shadow-[0_3px_0_#b91c1c]"
                        : l === "Mid"
                        ? "bg-amber-500 text-white border-amber-500 shadow-[0_3px_0_#b45309]"
                        : "bg-green-500 text-white border-green-500 shadow-[0_3px_0_#047857]"
                      : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Phonetic
            </label>
            <input
              type="text"
              value={value.phonetic}
              onChange={(e) => update({ phonetic: e.target.value })}
              placeholder="/ɪɡˈzɑːmpəl/"
              className="w-full p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#6366f1] transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Nghĩa *
            </label>
            <input
              type="text"
              value={value.meaning}
              onChange={(e) => update({ meaning: e.target.value })}
              placeholder="Nghĩa tiếng Việt..."
              className="w-full p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#6366f1] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Ví dụ
            </label>
            <textarea
              value={value.example}
              onChange={(e) => update({ example: e.target.value })}
              rows={2}
              placeholder="Câu ví dụ minh họa..."
              className="w-full p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#6366f1] transition-all resize-none"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white font-bold rounded-2xl">
            Hủy
          </button>
          <button
            onClick={onSubmit}
            disabled={!value.word.trim() || !value.meaning.trim() || !value.VocabType.trim()}
            className={`px-5 py-2.5 rounded-2xl font-extrabold uppercase tracking-wide text-xs transition-all ${
              !value.word.trim() || !value.meaning.trim() || !value.VocabType.trim()
                ? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-white shadow-[0_3px_0_#4338ca] active:translate-y-[1px] active:shadow-[0_2px_0_#4338ca]"
            }`}
          >
            {isEdit ? "Lưu" : "Thêm"}
          </button>
        </div>
      </div>
    </div>
  );
};

// === Main ===
const Vocabulary = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const practiceMode = searchParams.get("mode");

  // === Tab state ===
  const [tab, setTab] = useState("practice"); // 'practice' | 'saved' | 'topics'

  // === Data state ===
  const [topics, setTopics] = useState([]);
  const [vocabularies, setVocabularies] = useState([]);
  const [savedVocabularies, setSavedVocabularies] = useState([]); // flat list for "Saved" tab
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [vocabStats, setVocabStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [dailySession, setDailySession] = useState(null);
  const [loadingDaily, setLoadingDaily] = useState(false);

  // Realtime practice progress used to come from Zustand here. Removed —
  // Zustand subscription triggered vocabulary.jsx re-renders during the
  // practice quiz, which raced with MultipleChoicePractice/FillInPractice
  // state updates and broke "Tiếp theo" navigation. The realtime cards in
  // the tab are now hidden; users see their progress in the quiz summary
  // at the end of each session.

  // === Modal state ===
  const [showFlashcard, setShowFlashcard] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [showEditTopic, setShowEditTopic] = useState(false);
  const [topicToEdit, setTopicToEdit] = useState(null);
  const [newTopic, setNewTopic] = useState("");
  const [showAddVocabulary, setShowAddVocabulary] = useState(false);
  const [showEditVocabulary, setShowEditVocabulary] = useState(false);
  const [vocabToEdit, setVocabToEdit] = useState(null);
  const [newVocabulary, setNewVocabulary] = useState({
    word: "", VocabType: "", phonetic: "", meaning: "", example: "", level: "Low",
  });
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [savedSearch, setSavedSearch] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [validationErrors, setValidationErrors] = useState({ topic: "", vocabulary: "" });
  const [comingSoon, setComingSoon] = useState(null);

  const handleBackFromPractice = async () => {
    setSearchParams({});
    // Refetch daily session to update progress count (0/20 → 1/20, etc.)
    if (user?.idUser) {
      try {
        const res = await getDailySessionAPI(user.idUser, 15);
        setDailySession(res.data || res);
      } catch (err) {
        console.error("Failed to refetch daily session:", err);
      }
    }
  };

  // === Fetch topics ===
  useEffect(() => {
    if (!user?.idUser) return;
    (async () => {
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
    })();
  }, [user?.idUser]);

  // === Fetch stats ===
  useEffect(() => {
    if (!user?.idUser) return;
    (async () => {
      setLoadingStats(true);
      try {
        const res = await getVocabStatsAPI(user.idUser);
        setVocabStats(res.data || res);
      } catch (err) {
        console.error("Failed to fetch vocab stats:", err);
      } finally {
        setLoadingStats(false);
      }
    })();
  }, [user?.idUser]);

  // === Fetch daily session (for Practice tab preview) ===
  useEffect(() => {
    if (!user?.idUser) return;
    (async () => {
      setLoadingDaily(true);
      try {
        const res = await getDailySessionAPI(user.idUser, 15);
        setDailySession(res.data || res);
      } catch (err) {
        console.error("Failed to fetch daily session:", err);
      } finally {
        setLoadingDaily(false);
      }
    })();
  }, [user?.idUser]);

  // === Fetch saved vocabularies (flat list of all user vocab) — single call ===
  // Replaces previous N+1 loop of getVocabAPI per topic.
  // Also re-runs on `vocab-saved` event so SaveWordModal saves show up immediately.
  const loadSavedVocabularies = useCallback(async () => {
    if (!user?.idUser) return;
    setLoadingSaved(true);
    try {
      const res = await getAllVocabByUserAPI(user.idUser);
      const list = res?.data ?? res;
      const arr = Array.isArray(list) ? list : [];
      // Attach topicName for display in "Saved" tab.
      const topicMap = new Map(topics.map((t) => [t.idTopic, t.nameTopic]));
      const enriched = arr.map((v) => ({
        ...v,
        topicName: topicMap.get(v.idTopic) || null,
      }));
      setSavedVocabularies(enriched);
    } catch (err) {
      console.error("Failed to fetch saved vocabularies:", err);
      setSavedVocabularies([]);
    } finally {
      setLoadingSaved(false);
    }
  }, [user?.idUser, topics]);

  useEffect(() => {
    loadSavedVocabularies();
  }, [loadSavedVocabularies]);

  // Listen for vocab-saved event from SaveWordModal (dispatched in VocabDaily / FillInPractice)
  // and re-fetch the flat list so the new word shows up in "Saved" tab without reload.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onVocabSaved = () => {
      loadSavedVocabularies();
    };
    window.addEventListener("vocab-saved", onVocabSaved);
    return () => window.removeEventListener("vocab-saved", onVocabSaved);
  }, [loadSavedVocabularies]);

  // === AI suggest effect ===
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
        if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
          setError("Kết nối AI bị timeout. Vui lòng thử lại hoặc nhập thủ công.");
        } else {
          setError("Không thể lấy gợi ý từ AI. Vui lòng nhập thủ công.");
        }
      } finally {
        setIsSuggesting(false);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [newVocabulary.word, showAddVocabulary]);

  const applySuggestion = () => {
    if (suggestion) {
      setNewVocabulary((prev) => ({
        ...prev,
        VocabType: suggestion.VocabType || prev.VocabType,
        phonetic: suggestion.phonetic || prev.phonetic,
        meaning: suggestion.meaning || prev.meaning,
        example: suggestion.example || prev.example,
        level: suggestion.level || prev.level,
      }));
      setSuggestion(null);
    }
  };

  // === Topic CRUD ===
  const handleAddTopic = async () => {
    if (!newTopic.trim()) {
      setValidationErrors({ ...validationErrors, topic: "Vui lòng nhập tên chủ đề" });
      return;
    }
    try {
      const res = await createTopicAPI({ nameTopic: newTopic, idUser: user.idUser });
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
    if (!window.confirm("Bạn có chắc muốn xóa chủ đề này? Tất cả từ vựng trong chủ đề cũng sẽ bị xóa.")) return;
    try {
      await deleteTopicAPI(topicId);
      setTopics((prev) => prev.filter((t) => t.idTopic !== topicId));
      if (topics.find((t) => t.idTopic === topicId)?.isSelected) setVocabularies([]);
    } catch (error) {
      console.error("Failed to delete topic:", error);
      setError("Không thể xóa chủ đề");
    }
  };

  const handleEditTopic = async () => {
    if (!topicToEdit) return;
    if (!topicToEdit.nameTopic.trim()) {
      setValidationErrors({ ...validationErrors, topic: "Vui lòng nhập tên chủ đề" });
      return;
    }
    try {
      await updateTopicAPI(topicToEdit.idTopic, { nameTopic: topicToEdit.nameTopic, idUser: user.idUser });
      setTopics((prev) => prev.map((t) => (t.idTopic === topicToEdit.idTopic ? { ...t, nameTopic: topicToEdit.nameTopic } : t)));
      setShowEditTopic(false);
      setTopicToEdit(null);
      setValidationErrors({ ...validationErrors, topic: "" });
    } catch (error) {
      console.error("Failed to update topic:", error);
      setError("Không thể cập nhật chủ đề");
    }
  };

  const handleSelectTopic = async (topicId) => {
    const updatedTopics = topics.map((topic) => ({ ...topic, isSelected: topic.idTopic === topicId }));
    setTopics(updatedTopics);
    try {
      const res = await getVocabAPI(topicId);
      setVocabularies(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch vocabularies:", err);
      setError("Không thể tải từ vựng trong chủ đề");
    }
  };

  // === Vocab CRUD ===
  const handleAddVocabulary = async () => {
    if (!topics.find((t) => t.isSelected)) {
      setError("Vui lòng chọn một chủ đề trước khi thêm từ vựng");
      return;
    }
    if (!user?.idUser) {
      setError("Không thể xác định người dùng. Vui lòng đăng nhập lại.");
      return;
    }
    const errors = [];
    if (!newVocabulary.word.trim()) errors.push("từ vựng");
    if (!newVocabulary.meaning.trim()) errors.push("nghĩa");
    if (!newVocabulary.VocabType.trim()) errors.push("loại từ");
    if (errors.length > 0) {
      setValidationErrors({ ...validationErrors, vocabulary: `Vui lòng nhập ${errors.join(", ")}` });
      return;
    }
    const selectedTopic = topics.find((t) => t.isSelected);
    try {
      const res = await createVocabAPI({
        idUser: user.idUser, idTopic: selectedTopic.idTopic,
        word: newVocabulary.word, phonetic: newVocabulary.phonetic,
        meaning: newVocabulary.meaning, example: newVocabulary.example,
        VocabType: newVocabulary.VocabType, level: newVocabulary.level,
      });
      setVocabularies((prev) => [...prev, res.data]);
      setShowAddVocabulary(false);
      setSearchTerm("");
      setNewVocabulary({ word: "", VocabType: "", phonetic: "", meaning: "", example: "", level: "Low" });
      setSuggestion(null);
      setValidationErrors({ ...validationErrors, vocabulary: "" });
    } catch (error) {
      console.error("Error adding vocabulary:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Không thể thêm từ vựng");
    }
  };

  const handleDeleteVocabulary = async (idVocab) => {
    if (!window.confirm("Bạn có chắc muốn xóa từ vựng này?")) return;
    try {
      await deleteVocabAPI(idVocab, user.idUser);
      setVocabularies((prev) => prev.filter((v) => v.idVocab !== idVocab));
    } catch (err) {
      console.error("Failed to delete vocabulary:", err);
      setError("Không thể xóa từ vựng");
    }
  };

  const handleEditVocabulary = async () => {
    if (!vocabToEdit) return;
    const errors = [];
    if (!vocabToEdit.word.trim()) errors.push("từ vựng");
    if (!vocabToEdit.meaning.trim()) errors.push("nghĩa");
    if (!vocabToEdit.VocabType.trim()) errors.push("loại từ");
    if (errors.length > 0) {
      setValidationErrors({ ...validationErrors, vocabulary: `Vui lòng nhập ${errors.join(", ")}` });
      return;
    }
    const selectedTopic = topics.find((t) => t.isSelected);
    try {
      await updateVocabAPI(vocabToEdit.idVocab, {
        idUser: user.idUser, idTopic: selectedTopic.idTopic,
        word: vocabToEdit.word, phonetic: vocabToEdit.phonetic,
        meaning: vocabToEdit.meaning, example: vocabToEdit.example,
        VocabType: vocabToEdit.VocabType, level: vocabToEdit.level,
      });
      setVocabularies((prev) => prev.map((v) => (v.idVocab === vocabToEdit.idVocab ? { ...v, ...vocabToEdit } : v)));
      setShowEditVocabulary(false);
      setVocabToEdit(null);
      setValidationErrors({ ...validationErrors, vocabulary: "" });
    } catch (error) {
      console.error("Failed to update vocabulary:", error);
      setError("Không thể cập nhật từ vựng");
    }
  };

  const resetValidationErrors = () => setValidationErrors({ topic: "", vocabulary: "" });
  const handleCloseAddVocabulary = () => {
    setShowAddVocabulary(false);
    setSuggestion(null);
    setIsSuggesting(false);
    resetValidationErrors();
  };

  const handleStartFlashcard = () => {
    if (vocabularies.length === 0) {
      alert("Chủ đề này chưa có từ vựng để ôn tập!");
      return;
    }
    setShowFlashcard(true);
  };

  const handleReviewAnswer = async (idVocab, quality) => {
    if (!user?.idUser) return;
    try {
      await submitReviewAPI(idVocab, user.idUser, quality);
      // Refetch daily session để lấy từ tiếp theo
      const res = await getDailySessionAPI(user.idUser, 15);
      setDailySession(res.data || res);
    } catch (err) {
      console.error("Failed to submit review:", err);
    }
  };

  const selectedTopic = topics.find((t) => t.isSelected);
  const filteredVocabularies = selectedTopic
    ? vocabularies.filter((v) => v.word?.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const filteredSavedVocabularies = useMemo(
    () => savedVocabularies.filter((v) => {
      const q = savedSearch.toLowerCase();
      return !q || v.word?.toLowerCase().includes(q) || v.meaning?.toLowerCase().includes(q);
    }),
    [savedVocabularies, savedSearch]
  );

  // === Compute derived stats ===
  const totalLearned = (vocabStats?.tier1Progress?.mastered || 0) + (vocabStats?.tier2Progress?.mastered || 0);
  const totalAvailable = (vocabStats?.tier1Progress?.total || 0) + (vocabStats?.tier2Progress?.total || 0);
  const overallPct = totalAvailable > 0 ? Math.round((totalLearned / totalAvailable) * 100) : 0;
  const dueCount = dailySession?.dueCount || 0;
  const newCount = dailySession?.newCount || 0;

  // === Practice mode (full-screen routes) — chỉ truy cập từ tab Luyện tập ===
  if (practiceMode === "fill") {
    return <PracticeWrapper onBack={handleBackFromPractice}><FillInPractice count={20} onComplete={handleBackFromPractice} /></PracticeWrapper>;
  }
  if (practiceMode === "multiple") {
    return <PracticeWrapper onBack={handleBackFromPractice}><MultipleChoicePractice count={20} onComplete={handleBackFromPractice} /></PracticeWrapper>;
  }
  if (practiceMode === "review") {
    return <PracticeWrapper onBack={handleBackFromPractice}><FillInPractice count={20} onComplete={handleBackFromPractice} /></PracticeWrapper>;
  }

  return (
    <div className="min-h-screen bg-[#fafafc] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-6 transition-colors">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* === Hero 2-col: gradient + 3 stat cards === */}
        <section className="grid md:grid-cols-[1fr_auto_auto_auto] gap-4">
          {/* Hero gradient card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#fb7185] rounded-3xl p-6 text-white shadow-[0_4px_0_#4338ca]">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/15 rounded-full blur-3xl" />
            <div className="relative flex items-center gap-5">
              <div className="text-5xl sm:text-6xl flex-none">📚</div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-90 mb-1">Vocabulary của bạn</div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl sm:text-5xl font-black" style={{ fontFamily: "Nunito, sans-serif" }}>
                    {!loadingStats ? savedVocabularies.length : "..."}
                  </span>
                  <span className="text-xs sm:text-sm font-bold opacity-80">từ vựng đã thêm</span>
                </div>
                <div className="text-xs opacity-80">
                  {topics.length} chủ đề · {savedVocabularies.length} từ
                </div>
              </div>
            </div>
          </div>
          {/* 3 stat cards dọc (data thật từ API) */}
          <StatCard icon="✓" tone="bg-[#d1fae5] text-[#047857]" value={totalLearned} label="Đã thuộc" loading={loadingStats} />
          <StatCard icon="📚" tone="bg-[#eef2ff] text-[#4338ca]" value={topics.length} label="Chủ đề" loading={loadingTopics} />
          <StatCard icon="📝" tone="bg-[#fef3c7] text-[#b45309]" value={savedVocabularies.length} label="Từ vựng" loading={loadingSaved} />
        </section>

        {/* === Tab pill (3 tabs: Practice / Saved / Topics) === */}
        <div className="flex items-center gap-1 bg-[#f1f1f6] dark:bg-slate-800 rounded-2xl p-1 w-fit">
          {[
            { id: "practice", label: "🎮 Luyện tập" },
            { id: "saved", label: "🔖 Đã lưu" },
            { id: "topics", label: "📂 Chủ đề" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-extrabold uppercase tracking-wide transition-all ${
                tab === t.id
                  ? "bg-white dark:bg-slate-700 text-[#6366f1] shadow-[0_2px_0_#e6e6ed]"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* === TAB: Luyện tập === */}
        {tab === "practice" && (
          <div className="space-y-5">
            {/* Daily session card với flashcard 3D */}
            <section className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-[0_3px_0_#e6e6ed] p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#fb7185] mb-0.5">📅 Phiên hôm nay</div>
                  <h2 className="text-lg font-black text-slate-800 dark:text-white" style={{ fontFamily: "Nunito, sans-serif" }}>
                    Daily · {loadingDaily ? "..." : `${dueCount + newCount} từ`}
                  </h2>
                </div>
              </div>

              {dailySession?.words?.length > 0 ? (
                <FeaturedFlashcard
                  word={dailySession.words[0]}
                  onAnswer={(quality) => handleReviewAnswer(dailySession.words[0].idVocab, quality)}
                />
              ) : (
                <div className="h-72 flex flex-col items-center justify-center text-slate-400">
                  <BookOpen size={48} className="mb-2" />
                  <p className="text-sm">{loadingDaily ? "Đang tải..." : "Chưa có từ cho hôm nay"}</p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  <span>Tiến độ:</span>
                  <span className="font-extrabold text-slate-800 dark:text-white">
                    0 / {dueCount + newCount}
                  </span>
                </div>
                <button
                  onClick={() => navigate("/vocab-daily")}
                  className="font-extrabold text-[#6366f1] hover:underline uppercase tracking-wide"
                >
                  Bắt đầu phiên →
                </button>
              </div>
            </section>

            {/* 5 practice modes grid (1 hàng trên lg) */}
            <section>
              <h2 className="text-lg font-black text-slate-800 dark:text-white mb-3" style={{ fontFamily: "Nunito, sans-serif" }}>
                Chế độ luyện tập
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <PracticeModeCard icon="✍️" title="Điền từ" desc="Điền từ vào câu hoàn chỉnh từ ngữ cảnh." count="15 câu · 6 phút" gradient="from-[#06b6d4] to-[#0891b2]" accent="bg-[#06b6d4]" onClick={() => navigate("/vocabulary?mode=fill")} />
                <PracticeModeCard icon="📝" title="Trắc nghiệm" desc="Chọn đáp án đúng trong 4 lựa chọn." count="20 câu · 8 phút" gradient="from-[#a855f7] to-[#7e22ce]" accent="bg-[#a855f7]" onClick={() => navigate("/vocabulary?mode=multiple")} />
                <PracticeModeCard icon="👂" title="Listening" desc="Nghe và viết lại từ. Cải thiện cả phát âm." gradient="from-[#fb7185] to-[#e11d48]" accent="bg-[#fb7185]" comingSoon onClick={() => setComingSoon("Listening")} />
                <PracticeModeCard icon="🔗" title="Matching" desc="Nối từ với nghĩa hoặc định nghĩa." gradient="from-[#f59e0b] to-[#d97706]" accent="bg-[#f59e0b]" comingSoon onClick={() => setComingSoon("Matching")} />
              </div>
            </section>

            {/* Realtime practice results section removed — Zustand subscription
                was causing re-render races during the quiz. */}
          </div>
        )}

        {/* === TAB: Đã lưu === */}
        {tab === "saved" && (
          <section className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border-2 border-slate-200 dark:border-slate-700 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white" style={{ fontFamily: "Nunito, sans-serif" }}>
                  🔖 Từ bạn đã lưu
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {loadingSaved ? "Đang tải..." : `${filteredSavedVocabularies.length} từ`}
                </p>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Sắp xếp / tìm..."
                    value={savedSearch}
                    onChange={(e) => setSavedSearch(e.target.value)}
                    className="w-full sm:w-56 pl-9 pr-4 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#6366f1] transition-all"
                  />
                </div>
                <button
                  onClick={() => { setTab("topics"); }}
                  className="px-4 py-2.5 bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-white rounded-2xl font-extrabold uppercase tracking-wide text-xs flex items-center gap-1.5 shadow-[0_3px_0_#4338ca] active:translate-y-[1px] active:shadow-[0_2px_0_#4338ca] transition-all"
                >
                  <Plus size={16} /> Thêm từ
                </button>
              </div>
            </div>

            {loadingSaved ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6366f1]"></div>
              </div>
            ) : filteredSavedVocabularies.length > 0 ? (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredSavedVocabularies.map((vocab) => {
                  const meta = STATUS_META[vocab.status] || STATUS_META.new;
                  return (
                    <div key={vocab.idVocab} className="group p-3 sm:p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-[#6366f1]/40 hover:bg-[#fafafc] dark:hover:bg-slate-700/30 transition-all">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-base font-black text-slate-800 dark:text-white" style={{ fontFamily: "Nunito, sans-serif" }}>{vocab.word}</span>
                            {vocab.phonetic && <span className="text-xs font-mono text-slate-500">{vocab.phonetic}</span>}
                            {vocab.VocabType && (
                              <span className="px-2 py-0.5 rounded-md bg-[#eef2ff] text-[#4338ca] text-[10px] font-extrabold uppercase tracking-wide">{vocab.VocabType}</span>
                            )}
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${meta.tone}`}>{meta.label}</span>
                            {vocab.topicName && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200">{vocab.topicName}</span>
                            )}
                          </div>
                          <div className="text-sm text-slate-700 dark:text-slate-300 mb-0.5">{vocab.meaning}</div>
                          {vocab.example && <div className="text-xs text-slate-500 italic line-clamp-1">"{vocab.example}"</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon="🔖"
                title={savedSearch ? "Không tìm thấy từ vựng" : "Chưa có từ nào"}
                desc={savedSearch ? "Thử từ khóa khác" : "Tạo từ vựng trong tab Chủ đề để bắt đầu"}
                cta="+ Tạo từ vựng"
                onCta={() => setTab("topics")}
              />
            )}
          </section>
        )}

        {/* === TAB: Chủ đề === */}
        {tab === "topics" && (
          <div className="space-y-5">
            <section className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border-2 border-slate-200 dark:border-slate-700 p-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-800 dark:text-white" style={{ fontFamily: "Nunito, sans-serif" }}>
                    📂 Chủ đề ({topics.length})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Click để xem từ vựng trong chủ đề</p>
                </div>
                <button
                  onClick={() => setShowAddTopic(true)}
                  className="px-4 py-2.5 bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-white rounded-2xl font-extrabold uppercase tracking-wide text-xs flex items-center gap-1.5 shadow-[0_3px_0_#4338ca] active:translate-y-[1px] active:shadow-[0_2px_0_#4338ca] transition-all"
                >
                  <Plus size={16} /> Thêm
                </button>
              </div>

              {topics.length === 0 ? (
                <EmptyState
                  icon="📂"
                  title="Chưa có chủ đề nào"
                  desc="Tạo chủ đề đầu tiên để bắt đầu thêm từ vựng"
                  cta="+ Thêm chủ đề"
                  onCta={() => setShowAddTopic(true)}
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {topics.map((topic, i) => (
                    <TopicCard
                      key={topic.idTopic}
                      topic={topic}
                      color={TOPIC_COLOR_POOL[i % TOPIC_COLOR_POOL.length]}
                      icon={TOPIC_ICON_POOL[i % TOPIC_ICON_POOL.length]}
                      onClick={() => handleSelectTopic(topic.idTopic)}
                      onEdit={(e) => { e.stopPropagation(); setTopicToEdit(topic); setShowEditTopic(true); }}
                      onDelete={(e) => { e.stopPropagation(); handleDeleteTopic(topic.idTopic); }}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Vocabularies in selected topic */}
            {selectedTopic && (
              <section className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border-2 border-slate-200 dark:border-slate-700 p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-800 dark:text-white" style={{ fontFamily: "Nunito, sans-serif" }}>
                      📖 {selectedTopic.nameTopic}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{vocabularies.length} từ vựng</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-56 pl-9 pr-4 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#6366f1] transition-all"
                      />
                    </div>
                    <button
                      onClick={() => setShowAddVocabulary(true)}
                      className="px-4 py-2.5 bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-white rounded-2xl font-extrabold uppercase tracking-wide text-xs flex items-center gap-1.5 shadow-[0_3px_0_#4338ca] active:translate-y-[1px] active:shadow-[0_2px_0_#4338ca] transition-all"
                    >
                      <Plus size={16} /> Thêm
                    </button>
                    <button
                      onClick={handleStartFlashcard}
                      className="px-4 py-2.5 bg-gradient-to-br from-[#f59e0b] to-[#d97706] text-white rounded-2xl font-extrabold uppercase tracking-wide text-xs flex items-center gap-1.5 shadow-[0_3px_0_#b45309] active:translate-y-[1px] active:shadow-[0_2px_0_#b45309] transition-all"
                    >
                      <Sparkles size={16} /> Ôn tập
                    </button>
                  </div>
                </div>

                {filteredVocabularies.length > 0 ? (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {filteredVocabularies.map((vocab) => (
                      <VocabRow
                        key={vocab.idVocab}
                        vocab={vocab}
                        onEdit={() => { setVocabToEdit(vocab); setShowEditVocabulary(true); }}
                        onDelete={() => handleDeleteVocabulary(vocab.idVocab)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="📝"
                    title={searchTerm ? "Không tìm thấy từ vựng" : "Chưa có từ vựng nào"}
                    desc={searchTerm ? "Thử từ khóa khác" : "Thêm từ vựng đầu tiên vào chủ đề này"}
                    cta="+ Thêm từ vựng"
                    onCta={() => setShowAddVocabulary(true)}
                  />
                )}
              </section>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-2xl flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {/* === Modals === */}
      {showAddTopic && (
        <TopicModal
          mode="add"
          value={{ nameTopic: newTopic }}
          onChange={(v) => { setNewTopic(v.nameTopic); if (validationErrors.topic) setValidationErrors({ ...validationErrors, topic: "" }); }}
          onClose={() => { setShowAddTopic(false); setNewTopic(""); resetValidationErrors(); }}
          onSubmit={handleAddTopic}
          error={validationErrors.topic}
        />
      )}
      {showEditTopic && topicToEdit && (
        <TopicModal
          mode="edit"
          value={topicToEdit}
          onChange={(v) => { setTopicToEdit(v); if (validationErrors.topic) setValidationErrors({ ...validationErrors, topic: "" }); }}
          onClose={() => { setShowEditTopic(false); setTopicToEdit(null); resetValidationErrors(); }}
          onSubmit={handleEditTopic}
          error={validationErrors.topic}
        />
      )}

      {showAddVocabulary && (
        <VocabFormModal
          mode="add"
          value={newVocabulary}
          setValue={setNewVocabulary}
          onClose={handleCloseAddVocabulary}
          onSubmit={handleAddVocabulary}
          error={validationErrors.vocabulary}
          isSuggesting={isSuggesting}
          suggestion={suggestion}
          onApplySuggestion={applySuggestion}
        />
      )}

      {showEditVocabulary && vocabToEdit && (
        <VocabFormModal
          mode="edit"
          value={vocabToEdit}
          setValue={setVocabToEdit}
          onClose={() => { setShowEditVocabulary(false); setVocabToEdit(null); resetValidationErrors(); }}
          onSubmit={handleEditVocabulary}
          error={validationErrors.vocabulary}
          isSuggesting={false}
          suggestion={null}
          onApplySuggestion={() => {}}
        />
      )}

      <FlashcardModal isOpen={showFlashcard} onClose={() => setShowFlashcard(false)} vocabularies={vocabularies} user={user} submitReview={true} />
      <ComingSoonModal isOpen={!!comingSoon} featureName={comingSoon ? `Chế độ ${comingSoon}` : null} onClose={() => setComingSoon(null)} />
    </div>
  );
};

// === Helper components ===

const PracticeWrapper = ({ children, onBack }) => (
  <div className="min-h-screen bg-[#fafafc] dark:from-slate-900 dark:to-slate-900 p-4 sm:p-6">
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-[#6366f1] hover:text-[#4338ca] mb-4 font-bold text-sm">
        <ArrowLeft size={20} /> Quay lại
      </button>
      <div className="bg-white rounded-3xl shadow-[0_3px_0_#e6e6ed] border-2 border-slate-200 overflow-hidden">
        {children}
      </div>
    </div>
  </div>
);

// === Featured Flashcard 3D với 4 button Khó/Tạm/Ổn/Dễ (giống MagicPath) ===
const FeaturedFlashcard = ({ word, onAnswer }) => {
  const [flipped, setFlipped] = useState(false);
  if (!word) return null;
  return (
    <div className="relative w-full" style={{ perspective: "1200px" }}>
      <div
        className="relative w-full h-72 cursor-pointer transition-transform duration-500"
        style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        onClick={() => setFlipped((f) => !f)}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#fb7185] text-white p-6 shadow-[0_5px_0_#4338ca] flex flex-col items-center justify-center text-center overflow-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold uppercase tracking-wider">
            {word.VocabType || "Word"}
          </div>
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold uppercase tracking-wider">
            {word.isNew ? "Mới" : "Ôn"}
          </div>
          <h2 className="text-4xl sm:text-5xl font-black mb-2" style={{ fontFamily: "Nunito, sans-serif" }}>{word.word}</h2>
          {word.phonetic && <div className="text-base font-mono opacity-90 mb-3">{word.phonetic}</div>}
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Bấm để lật thẻ</div>
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-[0_5px_0_#e6e6ed] p-6 flex flex-col"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1] mb-1">Nghĩa</div>
          <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mb-3" style={{ fontFamily: "Nunito, sans-serif" }}>
            {word.meaning}
          </div>
          {word.example && (
            <>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6366f1] mb-1">Ví dụ</div>
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic p-3 bg-[#fafafc] dark:bg-slate-700 rounded-2xl border-l-4 border-[#6366f1]">
                "{word.example}"
              </div>
            </>
          )}
          <div className="mt-auto text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">Bấm để lật lại</div>
        </div>
      </div>

      {/* 4 button Khó/Tạm/Ổn/Dễ (chỉ hiện khi flipped)
          SM-2 safe: chỉ gửi quality 3,4,5 (BE sẽ reset interval nếu < 3).
          Khó/Tạm đều map về 3 để tránh reset, vẫn hiển thị khác nhau cho UX. */}
      {flipped && (
        <div className="grid grid-cols-4 gap-2 mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); onAnswer(3); setFlipped(false); }}
            className="px-2 py-2 rounded-2xl bg-white border-2 border-[#fb7185] text-[#e11d48] font-extrabold text-[10px] uppercase tracking-wide shadow-[0_2px_0_#fb7185]/30 hover:bg-[#fff1f2] transition-all"
          >😣 Khó</button>
          <button
            onClick={(e) => { e.stopPropagation(); onAnswer(3); setFlipped(false); }}
            className="px-2 py-2 rounded-2xl bg-white border-2 border-[#f59e0b] text-[#b45309] font-extrabold text-[10px] uppercase tracking-wide shadow-[0_2px_0_#f59e0b]/30 hover:bg-[#fef3c7] transition-all"
          >🤔 Tạm</button>
          <button
            onClick={(e) => { e.stopPropagation(); onAnswer(4); setFlipped(false); }}
            className="px-2 py-2 rounded-2xl bg-white border-2 border-[#06b6d4] text-[#0e7490] font-extrabold text-[10px] uppercase tracking-wide shadow-[0_2px_0_#06b6d4]/30 hover:bg-[#cffafe] transition-all"
          >😊 Ổn</button>
          <button
            onClick={(e) => { e.stopPropagation(); onAnswer(5); setFlipped(false); }}
            className="px-2 py-2 rounded-2xl bg-white border-2 border-[#10b981] text-[#047857] font-extrabold text-[10px] uppercase tracking-wide shadow-[0_2px_0_#10b981]/30 hover:bg-[#d1fae5] transition-all"
          >🤩 Dễ</button>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, value, label, tone, loading }) => (
  <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-[0_3px_0_#e6e6ed] p-4 flex flex-col items-center text-center">
    <div className={`w-10 h-10 rounded-xl ${tone} flex items-center justify-center text-base font-black mb-2`}>{icon}</div>
    <div className="text-2xl font-black text-slate-800 dark:text-white" style={{ fontFamily: "Nunito, sans-serif" }}>
      {loading ? "..." : value}
    </div>
    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">
      {label}
    </div>
  </div>
);

const PracticeModeCard = ({ icon, title, desc, count, gradient, accent, onClick, comingSoon }) => (
  <button
    onClick={onClick}
    disabled={comingSoon}
    className={`relative bg-white dark:bg-slate-800 rounded-3xl border-2 ${
      comingSoon ? "border-slate-200 opacity-60" : "border-slate-200 hover:border-[#6366f1]/40 hover:shadow-[0_5px_0_#e6e6ed] hover:-translate-y-1"
    } shadow-[0_3px_0_#e6e6ed] p-5 cursor-pointer transition-all text-left overflow-hidden`}
  >
    {comingSoon && (
      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-extrabold uppercase tracking-wide">
        Soon
      </div>
    )}
    <div className={`absolute -top-10 -right-10 w-32 h-32 ${accent} rounded-full opacity-20 blur-2xl pointer-events-none`} />
    <div className="relative">
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-[0_3px_0_rgba(0,0,0,0.15)] flex items-center justify-center text-2xl mb-3`}>
        {icon}
      </div>
      <h3 className="text-base font-black text-slate-800 dark:text-white mb-1" style={{ fontFamily: "Nunito, sans-serif" }}>{title}</h3>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3 min-h-[2.5em]">{desc}</p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-extrabold text-[#6366f1] uppercase tracking-wide">{count || ""}</span>
        {!comingSoon && <span className="text-[#6366f1] text-lg">→</span>}
      </div>
    </div>
  </button>
);

const TopicCard = ({ topic, color, icon, count = 0, onClick, onEdit, onDelete }) => {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`w-full p-5 rounded-3xl border-2 ${
          topic.isSelected
            ? "border-[#6366f1] bg-[#eef2ff] dark:bg-indigo-900/30 shadow-[0_3px_0_#4338ca]"
            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#6366f1]/40 hover:shadow-[0_5px_0_#e6e6ed] hover:-translate-y-1 shadow-[0_3px_0_#e6e6ed]"
        } transition-all text-left`}
      >
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} text-white shadow-[0_3px_0_rgba(0,0,0,0.15)] flex items-center justify-center text-xl flex-none`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-slate-800 dark:text-white truncate" style={{ fontFamily: "Nunito, sans-serif" }}>
              {topic.nameTopic}
            </div>
            {topic.isSelected && (
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#4338ca] mt-1 flex items-center gap-1">
                <CheckCircle2 size={10} /> Đang chọn
              </div>
            )}
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-slate-800 dark:text-white" style={{ fontFamily: "Nunito, sans-serif" }}>{count}</span>
          <span className="text-[10px] text-slate-500 font-bold">từ trong chủ đề</span>
        </div>
      </button>
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button onClick={onEdit} className="w-6 h-6 rounded-full bg-[#6366f1] text-white flex items-center justify-center hover:brightness-110" title="Sửa">
          <Edit size={11} />
        </button>
        <button onClick={onDelete} className="w-6 h-6 rounded-full bg-[#fb7185] text-white flex items-center justify-center hover:brightness-110" title="Xóa">
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
};

const VocabRow = ({ vocab, onEdit, onDelete }) => (
  <div className="group p-3 sm:p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-[#6366f1]/40 hover:bg-[#fafafc] dark:hover:bg-slate-700/30 transition-all">
    <div className="flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-base font-black text-slate-800 dark:text-white" style={{ fontFamily: "Nunito, sans-serif" }}>{vocab.word}</span>
          {vocab.phonetic && <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{vocab.phonetic}</span>}
          {vocab.VocabType && (
            <span className="px-2 py-0.5 rounded-md bg-[#eef2ff] text-[#4338ca] text-[10px] font-extrabold uppercase tracking-wide">{vocab.VocabType}</span>
          )}
          {vocab.level && (
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${LEVEL_STYLE[vocab.level] || LEVEL_STYLE.Low}`}>
              {vocab.level}
            </span>
          )}
        </div>
        <div className="text-sm text-slate-700 dark:text-slate-300 mb-0.5">{vocab.meaning}</div>
        {vocab.example && <div className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-1">"{vocab.example}"</div>}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-none">
        <button onClick={onEdit} className="w-7 h-7 rounded-lg bg-[#eef2ff] text-[#6366f1] flex items-center justify-center hover:bg-[#6366f1] hover:text-white transition-colors" title="Sửa">
          <Edit size={14} />
        </button>
        <button onClick={onDelete} className="w-7 h-7 rounded-lg bg-[#fff1f2] text-[#e11d48] flex items-center justify-center hover:bg-[#fb7185] hover:text-white transition-colors" title="Xóa">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  </div>
);

const EmptyState = ({ icon, title, desc, cta, onCta }) => (
  <div className="text-center py-10">
    <div className="text-5xl mb-3">{icon}</div>
    <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1" style={{ fontFamily: "Nunito, sans-serif" }}>{title}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{desc}</p>
    {cta && (
      <button onClick={onCta} className="px-5 py-2.5 bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-white rounded-2xl font-extrabold uppercase tracking-wide text-xs shadow-[0_3px_0_#4338ca] active:translate-y-[1px] active:shadow-[0_2px_0_#4338ca] transition-all">
        {cta}
      </button>
    )}
  </div>
);

export default Vocabulary;
