import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  BookOpen,
  X,
  ChevronRight,
  XCircle,
  CheckCircle,
  BookText,
  Users,
} from "lucide-react";
import { Tag } from "antd";
import {
  createGrammarCategoriesAPI,
  getGrammarCategoriesUserAPI,
  updateGrammarCategoriesAPI,
  deleteGrammarCategoriesAPI,
  getAllGrammarAPI,
  addGrammarToCategoryAPI,
  removeGrammarFromCategoryAPI,
  getGrammarByCategoriesUserAPI,
  getGrammarInCategories,
  createGrammarAPI,
  updateGrammarAPI,
  deleteGrammarAPI,
  createGrammarWithoutCategoryAPI,
} from "@/services/apiGrammar";
import { useAuth } from "@/context/authContext";

const Grammar = () => {
  const { user } = useAuth();

  const [grammarCategories, setGrammarCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({
    idUser: user?.idUser || null,
    name: "",
    description: "",
  });
  const [categoryToEdit, setCategoryToEdit] = useState(null);

  const [grammarItems, setGrammarItems] = useState([]);
  const [availableGrammars, setAvailableGrammars] = useState([]);
  const [showAddGrammarToCategory, setShowAddGrammarToCategory] =
    useState(false);
  const [loadingGrammar, setLoadingGrammar] = useState(false);

  // State cho quản lý grammar (admin/teacher)
  const [showGrammarManagement, setShowGrammarManagement] = useState(false);
  const [showAddGrammar, setShowAddGrammar] = useState(false);
  const [showEditGrammar, setShowEditGrammar] = useState(false);
  const [newGrammar, setNewGrammar] = useState({
    title: "",
    explanation: "",
    level: "Mid",
    commonMistakes: [],
    examples: [],
  });
  const [grammarToEdit, setGrammarToEdit] = useState(null);
  const [newMistake, setNewMistake] = useState({ wrong: "", right: "" });
  const [newExample, setNewExample] = useState({ sentence: "", note: "" });

  // State chung
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("user");

  const isAdminOrTeacher = user?.role === "ADMIN" || user?.role === "TEACHER";

  const getTypeColor = (type) => {
    const colors = {
      Low: "green",
      Mid: "orange",
      High: "red",
    };
    return colors[type] || "gray";
  };

  useEffect(() => {
    const fetchGrammarCategories = async () => {
      if (!user?.idUser) return;
      setLoadingCategories(true);
      setError(null);
      try {
        const res = await getGrammarCategoriesUserAPI(user.idUser);
        setGrammarCategories(res.data.data || res.data || []);
      } catch (err) {
        console.error("Failed to fetch grammar categories:", err);
        setError("Không thể tải danh sách chủ đề ngữ pháp");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchGrammarCategories();
  }, [user?.idUser]);

  useEffect(() => {
    const fetchAllGrammars = async () => {
      try {
        const res = await getAllGrammarAPI();
        setAvailableGrammars(res.data.data || res.data || []);
      } catch (err) {
        console.error("Failed to fetch available grammars:", err);
      }
    };

    fetchAllGrammars();
  }, [showGrammarManagement]);

  // --- XỬ LÝ DANH MỤC ---
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      alert("Tên chủ đề không được để trống");
      return;
    }
    try {
      const res = await createGrammarCategoriesAPI(newCategory);

      const newCategoryData = res.data?.data || res.data;
      if (newCategoryData) {
        setGrammarCategories((prev) => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return [...prevArray, newCategoryData];
        });
      }

      setShowAddCategory(false);
      setNewCategory({ name: "", description: "", idUser: user?.idUser });
    } catch (error) {
      console.error("Failed to create category:", error);
      setError(error.response?.data?.message || "Không thể tạo chủ đề mới");
    }
  };

  const handleEditCategory = async () => {
    if (!categoryToEdit || !categoryToEdit.name.trim()) {
      alert("Tên chủ đề không được để trống");
      return;
    }
    try {
      await updateGrammarCategoriesAPI(
        categoryToEdit,
        categoryToEdit.idGrammarCategory,
        user.idUser
      );
      setGrammarCategories((prev) =>
        prev.map((cat) =>
          cat.idGrammarCategory === categoryToEdit.idGrammarCategory
            ? categoryToEdit
            : cat
        )
      );
      setShowEditCategory(false);
      setCategoryToEdit(null);
    } catch (error) {
      console.error("Failed to update category:", error);
      setError(error.response?.data?.message || "Cập nhật thất bại.");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (
      window.confirm(
        "Bạn có chắc muốn xóa chủ đề này? Tất cả ngữ pháp bên trong cũng sẽ bị xóa."
      )
    ) {
      try {
        await deleteGrammarCategoriesAPI(categoryId, user.idUser);
        setGrammarCategories((prev) =>
          prev.filter((cat) => cat.idGrammarCategory !== categoryId)
        );
        setGrammarItems([]);
      } catch (error) {
        console.error("Failed to delete category:", error);
        setError(error.response?.data?.message || "Không thể xóa chủ đề này");
      }
    }
  };

  const handleSelectCategory = async (categoryId) => {
    const updatedCategories = grammarCategories?.map((cat) => ({
      ...cat,
      isSelected: cat.idGrammarCategory === categoryId,
    }));
    setGrammarCategories(updatedCategories);
    setLoadingGrammar(true);

    const selectedCat = grammarCategories.find(
      (cat) => cat.idGrammarCategory === categoryId
    );

    if (!selectedCat) {
      setError("Không tìm thấy chủ đề đã chọn.");
      setLoadingGrammar(false);
      return;
    }

    try {
      let rawItems = [];

      if (selectedCat.idUser) {
        const res = await getGrammarByCategoriesUserAPI(
          categoryId,
          user.idUser
        );
        rawItems = res.data?.data || res.data || [];
      } else {
        const res = await getGrammarInCategories(categoryId);
        rawItems = res.data?.data?.grammars || res.data?.grammars || [];
      }

      // Tìm hàm handleSelectCategory và sửa phần xử lý commonMistakes
      const processedItems = rawItems.map((item) => {
        const grammarData = item.grammar ? item.grammar : item;

        const mistakes =
          typeof grammarData.commonMistakes === "string" &&
            grammarData.commonMistakes
            ? JSON.parse(grammarData.commonMistakes)
            : grammarData.commonMistakes || [];

        // CHUYỂN ĐỔI CẤU TRÚC commonMistakes ĐỂ HIỂN THỊ ĐÚNG
        const convertedMistakes = mistakes.map((mistake) => ({
          wrong: mistake.mistake || mistake.wrong,
          right: mistake.correction || mistake.right,
        }));

        const examples =
          typeof grammarData.examples === "string" && grammarData.examples
            ? JSON.parse(grammarData.examples)
            : grammarData.examples || [];

        return {
          ...grammarData,
          commonMistakes: convertedMistakes,
          examples,
        };
      });

      setGrammarItems(processedItems);
    } catch (error) {
      console.error("Failed to fetch grammar items:", error);
      if (error.response?.status === 404) {
        setGrammarItems([]);
      } else {
        setError("Không thể tải danh sách ngữ pháp");
        setGrammarItems([]);
      }
    } finally {
      setLoadingGrammar(false);
    }
  };

  const handleAddGrammarToCategory = async (grammarId) => {
    const selectedCategory = grammarCategories?.find((cat) => cat.isSelected);
    if (!selectedCategory) {
      setError("Vui lòng chọn một chủ đề trước khi thêm.");
      return;
    }

    try {
      await addGrammarToCategoryAPI(
        selectedCategory.idGrammarCategory,
        grammarId,
        user.idUser
      );

      handleSelectCategory(selectedCategory.idGrammarCategory);
      setShowAddGrammarToCategory(false);
    } catch (error) {
      console.error("Failed to add grammar to category:", error);
      if (error.response?.data?.message?.includes("already in the category")) {
        setError("Ngữ pháp này đã có trong chủ đề.");
      } else if (error.response?.status === 404) {
        setError("Không tìm thấy chủ đề hoặc ngữ pháp");
      } else {
        setError(error.response?.data?.message || "Thêm ngữ pháp thất bại.");
      }
    }
  };

  const handleRemoveGrammarFromCategory = async (grammarId) => {
    const selectedCategory = grammarCategories?.find((cat) => cat.isSelected);
    if (!selectedCategory) {
      setError("Vui lòng chọn một chủ đề.");
      return;
    }

    if (window.confirm("Bạn có chắc muốn xóa điểm ngữ pháp này khỏi chủ đề?")) {
      try {
        await removeGrammarFromCategoryAPI(
          selectedCategory.idGrammarCategory,
          grammarId,
          user.idUser
        );

        setGrammarItems((prevItems) =>
          prevItems.filter((item) => item.idGrammar !== grammarId)
        );
      } catch (error) {
        console.error("Failed to remove grammar from category:", error);
        setError(error.response?.data?.message || "Xóa thất bại.");
      }
    }
  };

  // --- QUẢN LÝ GRAMMAR (ADMIN/TEACHER) ---
  const handleAddGrammar = async () => {
    if (!newGrammar.title.trim() || !newGrammar.explanation.trim()) {
      alert("Tiêu đề và giải thích không được để trống");
      return;
    }

    try {
      const grammarData = {
        title: newGrammar.title,
        explanation: newGrammar.explanation,
        level: newGrammar.level,

        commonMistakes: JSON.stringify(
          newGrammar.commonMistakes.map((mistake) => ({
            mistake: mistake.wrong,
            correction: mistake.right,
          }))
        ),
        examples: JSON.stringify(newGrammar.examples),
      };

      console.log("Data gửi lên API:", grammarData);

      await createGrammarWithoutCategoryAPI(grammarData, user.idUser);

      const res = await getAllGrammarAPI();
      setAvailableGrammars(res.data.data || res.data || []);

      setShowAddGrammar(false);
      setNewGrammar({
        title: "",
        explanation: "",
        level: "Mid",
        commonMistakes: [],
        examples: [],
      });
      setNewMistake({ wrong: "", right: "" });
      setNewExample({ sentence: "", note: "" });
    } catch (error) {
      console.error("Failed to create grammar:", error);
      console.error("Error response:", error.response?.data);
      setError(error.response?.data?.message || "Không thể tạo ngữ pháp mới");
    }
  };

  const handleEditGrammar = async () => {
    if (
      !grammarToEdit ||
      !grammarToEdit.title.trim() ||
      !grammarToEdit.explanation.trim()
    ) {
      alert("Tiêu đề và giải thích không được để trống");
      return;
    }

    try {
      // CHUẨN HÓA DỮ LIỆU CHO EDIT
      const grammarData = {
        title: grammarToEdit.title,
        explanation: grammarToEdit.explanation,
        level: grammarToEdit.level,
        commonMistakes: JSON.stringify(
          grammarToEdit.commonMistakes.map((mistake) => ({
            mistake: mistake.wrong, // Đổi từ 'wrong' thành 'mistake'
            correction: mistake.right, // Đổi từ 'right' thành 'correction'
          }))
        ),
        examples: JSON.stringify(grammarToEdit.examples),
      };

      console.log("Data gửi lên API (edit):", grammarData); // Debug

      await updateGrammarAPI(grammarData, grammarToEdit.idGrammar, user.idUser);

      const res = await getAllGrammarAPI();
      setAvailableGrammars(res.data.data || res.data || []);

      setShowEditGrammar(false);
      setGrammarToEdit(null);
    } catch (error) {
      console.error("Failed to update grammar:", error);
      console.error("Error response:", error.response?.data); // Debug chi tiết
      setError(error.response?.data?.message || "Cập nhật ngữ pháp thất bại");
    }
  };

  const handleDeleteGrammar = async (grammarId) => {
    if (window.confirm("Bạn có chắc muốn xóa điểm ngữ pháp này?")) {
      try {
        await deleteGrammarAPI(grammarId, user.idUser);

        const res = await getAllGrammarAPI();
        setAvailableGrammars(res.data.data || res.data || []);
      } catch (error) {
        console.error("Failed to delete grammar:", error);
        setError(error.response?.data?.message || "Xóa ngữ pháp thất bại");
      }
    }
  };

  const addMistake = () => {
    if (newMistake.wrong.trim() && newMistake.right.trim()) {
      if (showEditGrammar && grammarToEdit) {
        setGrammarToEdit({
          ...grammarToEdit,
          commonMistakes: [...grammarToEdit.commonMistakes, { ...newMistake }],
        });
      } else {
        setNewGrammar({
          ...newGrammar,
          commonMistakes: [...newGrammar.commonMistakes, { ...newMistake }],
        });
      }
      setNewMistake({ wrong: "", right: "" });
    }
  };

  const removeMistake = (index) => {
    if (showEditGrammar && grammarToEdit) {
      setGrammarToEdit({
        ...grammarToEdit,
        commonMistakes: grammarToEdit.commonMistakes.filter(
          (_, i) => i !== index
        ),
      });
    } else {
      setNewGrammar({
        ...newGrammar,
        commonMistakes: newGrammar.commonMistakes.filter((_, i) => i !== index),
      });
    }
  };

  const addExample = () => {
    if (newExample.sentence.trim()) {
      if (showEditGrammar && grammarToEdit) {
        setGrammarToEdit({
          ...grammarToEdit,
          examples: [...grammarToEdit.examples, { ...newExample }],
        });
      } else {
        setNewGrammar({
          ...newGrammar,
          examples: [...newGrammar.examples, { ...newExample }],
        });
      }
      setNewExample({ sentence: "", note: "" });
    }
  };

  const removeExample = (index) => {
    if (showEditGrammar && grammarToEdit) {
      setGrammarToEdit({
        ...grammarToEdit,
        examples: grammarToEdit.examples.filter((_, i) => i !== index),
      });
    } else {
      setNewGrammar({
        ...newGrammar,
        examples: newGrammar.examples.filter((_, i) => i !== index),
      });
    }
  };

  // --- RENDER LOGIC ---
  const selectedCategory = grammarCategories
    ? grammarCategories.find((cat) => cat?.isSelected)
    : null;

  const filteredGrammarItems = selectedCategory
    ? grammarItems.filter((item) => {
      const hasTitle = item && typeof item.title === "string";
      const hasExplanation = item && typeof item.explanation === "string";
      const lowerCaseSearchTerm = searchTerm.toLowerCase();

      if (!lowerCaseSearchTerm) {
        return true;
      }

      const titleMatches =
        hasTitle && item.title.toLowerCase().includes(lowerCaseSearchTerm);
      const explanationMatches =
        hasExplanation &&
        item.explanation.toLowerCase().includes(lowerCaseSearchTerm);

      return titleMatches || explanationMatches;
    })
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-xl mr-4">
                <BookOpen className="text-indigo-600 dark:text-indigo-400" size={28} />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                  Grammar IELTS
                </h1>
                <p className="text-gray-600 dark:text-slate-400 mt-1">
                  Quản lý và học ngữ pháp IELTS hiệu quả
                </p>
              </div>
            </div>

            {isAdminOrTeacher && (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setActiveTab("user");
                    setShowGrammarManagement(false);
                  }}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${activeTab === "user"
                    ? "bg-indigo-600 !text-white"
                    : "bg-gray-200 dark:bg-slate-700 !text-gray-700 dark:!text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600"
                    }`}
                >
                  Học Ngữ Pháp
                </button>
                <button
                  onClick={() => {
                    setActiveTab("management");
                    setShowGrammarManagement(true);
                  }}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center ${activeTab === "management"
                    ? "bg-green-600 !text-white"
                    : "bg-gray-200 dark:bg-slate-700 !text-gray-700 dark:!text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600"
                    }`}
                >
                  <Users size={18} className="mr-2" />
                  Quản Lý Ngữ Pháp
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 flex justify-between items-center shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <X size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* PHẦN QUẢN LÝ GRAMMAR CHO ADMIN/TEACHER */}
        {showGrammarManagement && isAdminOrTeacher ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Quản Lý Ngữ Pháp Hệ Thống
              </h2>
              <button
                onClick={() => setShowAddGrammar(true)}
                className="bg-green-600 hover:bg-green-700 !text-white px-4 py-3 rounded-xl flex items-center transition-all duration-200 hover:shadow-md font-medium"
              >
                <Plus size={20} className="mr-2" />
                Thêm Ngữ Pháp Mới
              </button>
            </div>

            <div className="space-y-4">
              {availableGrammars.length > 0 ? (
                availableGrammars.map((grammar, index) => (
                  <div
                    key={grammar.idGrammar}
                    className="border border-gray-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-md transition-all duration-200 bg-white dark:bg-slate-700 group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                            {index + 1}
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white ml-3">
                            {grammar.title}
                          </h3>
                          <div className="ml-4">
                            <Tag color={getTypeColor(grammar.level)}>
                              {grammar.level}
                            </Tag>
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
                          {grammar.explanation}
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => {
                            const processedGrammar = {
                              ...grammar,
                              commonMistakes:
                                typeof grammar.commonMistakes === "string"
                                  ? JSON.parse(grammar.commonMistakes)
                                  : grammar.commonMistakes || [],
                              examples:
                                typeof grammar.examples === "string"
                                  ? JSON.parse(grammar.examples)
                                  : grammar.examples || [],
                            };
                            if (
                              processedGrammar.commonMistakes &&
                              processedGrammar.commonMistakes.length > 0
                            ) {
                              processedGrammar.commonMistakes =
                                processedGrammar.commonMistakes.map(
                                  (mistake) => ({
                                    wrong: mistake.mistake || mistake.wrong,
                                    right: mistake.correction || mistake.right,
                                  })
                                );
                            }
                            setGrammarToEdit(processedGrammar);
                            setShowEditGrammar(true);
                          }}
                          className="text-gray-500 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Chỉnh sửa ngữ pháp"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteGrammar(grammar.idGrammar)}
                          className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Xóa ngữ pháp"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Hiển thị common mistakes và examples */}
                    {(grammar.commonMistakes || grammar.examples) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                        {grammar.commonMistakes &&
                          grammar.commonMistakes.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-semibold text-red-700 flex items-center">
                                <XCircle size={16} className="mr-2" /> Lỗi
                                thường gặp
                              </h4>
                              {/* Trong phần hiển thị common mistakes - SỬA ĐOẠN NÀY */}
                              {(typeof grammar.commonMistakes === "string"
                                ? JSON.parse(grammar.commonMistakes)
                                : grammar.commonMistakes
                              ).map((mistake, idx) => (
                                <React.Fragment key={idx}>
                                  <div className="bg-red-50 rounded-lg border border-red-100 p-4">
                                    <div className="flex items-center">
                                      <XCircle
                                        size={16}
                                        className="mr-2 text-red-500 flex-shrink-0"
                                      />
                                      <p className="text-sm text-red-700">
                                        {/* SỬA: mistake.wrong -> mistake.mistake */}
                                        {mistake.mistake || mistake.wrong}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                    <div className="flex items-center">
                                      <CheckCircle
                                        size={16}
                                        className="mr-2 text-green-500 flex-shrink-0"
                                      />
                                      <p className="text-sm text-green-700 font-medium">
                                        {/* SỬA: mistake.right -> mistake.correction */}
                                        {mistake.correction || mistake.right}
                                      </p>
                                    </div>
                                  </div>
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                        {grammar.examples && grammar.examples.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-blue-500 flex items-center">
                              <BookText size={16} className="mr-2" /> Ví dụ
                            </h4>
                            {(typeof grammar.examples === "string"
                              ? JSON.parse(grammar.examples)
                              : grammar.examples
                            ).map((example, idx) => (
                              <div
                                key={idx}
                                className="bg-blue-50 p-4 rounded-lg border border-blue-100"
                              >
                                <p className="text-sm text-gray-800 italic">
                                  "{example.sentence}"
                                </p>
                                {example.note && (
                                  <p className="text-xs text-gray-600 mt-2">
                                    {example.note}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-50 rounded-2xl p-8 max-w-md mx-auto">
                    <BookOpen
                      className="text-gray-400 mx-auto mb-4"
                      size={48}
                    />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Chưa có ngữ pháp nào
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Bắt đầu bằng cách thêm điểm ngữ pháp đầu tiên.
                    </p>
                    <button
                      onClick={() => setShowAddGrammar(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                    >
                      Thêm Ngữ Pháp
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* PHẦN NGƯỜI DÙNG BÌNH THƯỜNG */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Categories */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 sticky top-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Chủ đề ngữ pháp
                  </h2>
                  <button
                    onClick={() => setShowAddCategory(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 !text-white p-2 rounded-xl transition-all duration-200 hover:shadow-md"
                    title="Thêm chủ đề mới"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {grammarCategories?.map(
                    (cat) =>
                      cat && (
                        <div
                          key={cat.idGrammarCategory}
                          className={`group relative p-4 rounded-xl transition-all duration-200 cursor-pointer ${cat.isSelected
                            ? "bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-700 shadow-sm"
                            : "bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 border-2 border-transparent"
                            }`}
                          onClick={() =>
                            handleSelectCategory(cat.idGrammarCategory)
                          }
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <h3
                                className={`font-semibold truncate ${cat.isSelected
                                  ? "text-indigo-700 dark:text-indigo-400"
                                  : "text-gray-800 dark:text-white"
                                  }`}
                              >
                                {cat.name}
                              </h3>
                              {cat.description && (
                                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 line-clamp-2">
                                  {cat.description}
                                </p>
                              )}
                            </div>
                            <div className="flex space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCategoryToEdit(cat);
                                  setShowEditCategory(true);
                                }}
                                className="text-gray-500 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                                title="Chỉnh sửa chủ đề"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCategory(cat.idGrammarCategory);
                                }}
                                className="text-gray-500 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                                title="Xóa chủ đề"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          {cat.isSelected && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <ChevronRight
                                className="text-indigo-500"
                                size={16}
                              />
                            </div>
                          )}
                        </div>
                      )
                  )}

                  {grammarCategories?.length === 0 && !loadingCategories && (
                    <div className="text-center py-8">
                      <div className="bg-gray-100 dark:bg-slate-700 p-4 rounded-xl">
                        <BookOpen
                          className="text-gray-400 mx-auto mb-2"
                          size={32}
                        />
                        <p className="text-gray-500 dark:text-slate-400 text-sm">
                          Chưa có chủ đề nào
                        </p>
                        <button
                          onClick={() => setShowAddCategory(true)}
                          className="!text-indigo-600 dark:!text-indigo-400 hover:text-indigo-700 text-sm font-medium mt-2"
                        >
                          Thêm chủ đề đầu tiên
                        </button>
                      </div>
                    </div>
                  )}

                  {loadingCategories && (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content - Grammar Items */}
            <div className="lg:col-span-3">
              {selectedCategory ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mr-2">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-1">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedCategory.name}
                      </h2>
                      {selectedCategory.description && (
                        <p className="text-gray-600 dark:text-slate-400 mt-1">
                          {selectedCategory.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                      <div className="relative w-100 sm:flex-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Search className="text-gray-400" size={20} />
                        </div>
                        <input
                          type="text"
                          placeholder="Tìm kiếm cấu trúc ngữ pháp..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 dark:bg-slate-700 dark:text-white transition-all max-w-2xl"
                        />
                      </div>
                      <button
                        onClick={() => setShowAddGrammarToCategory(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 !text-white px-4 py-3 rounded-xl flex items-center justify-center transition-all duration-200 hover:shadow-md font-medium"
                      >
                        <Plus size={20} className="mr-2" />
                        Thêm ngữ pháp
                      </button>
                    </div>
                  </div>

                  {loadingGrammar ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : filteredGrammarItems.length > 0 ? (
                    <div className="space-y-4">
                      {filteredGrammarItems.map((item, index) => (
                        <div
                          key={item.idGrammar}
                          className="border border-gray-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-md transition-all duration-200 bg-white dark:bg-slate-700 group"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 px-3 py-1 rounded-full text-sm font-medium">
                                  {index + 1}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white ml-3">
                                  {item.title}
                                </h3>

                                <div className="ml-4">
                                  <Tag color={getTypeColor(item.level)}>
                                    {item.level}
                                  </Tag>
                                </div>
                              </div>
                              <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
                                {item.explanation}
                              </p>
                            </div>
                            <div className="flex space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() =>
                                  handleRemoveGrammarFromCategory(
                                    item.idGrammar
                                  )
                                }
                                className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                title="Xóa khỏi chủ đề"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>

                          {(item.commonMistakes || item.examples) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                              {item.commonMistakes &&
                                item.commonMistakes.length > 0 && (
                                  <div className="space-y-3">
                                    <h4 className="font-semibold text-red-700 flex items-center">
                                      <XCircle size={16} className="mr-2" /> Lỗi
                                      thường gặp
                                    </h4>
                                    {item.commonMistakes.map((mistake, idx) => (
                                      <React.Fragment key={idx}>
                                        <div className="bg-red-50  rounded-lg border border-red-100 p-7">
                                          <div className="flex items-center">
                                            <XCircle
                                              size={16}
                                              className="mr-2 text-red-500 flex-shrink-0"
                                            />
                                            <p className="text-sm text-red-700">
                                              {mistake.wrong}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="bg-green-50 p-7 rounded-lg border border-green-100">
                                          <div className="flex items-center">
                                            <CheckCircle
                                              size={16}
                                              className="mr-2 text-green-500 flex-shrink-0"
                                            />
                                            <p className="text-sm text-green-700 font-medium">
                                              {mistake.right}
                                            </p>
                                          </div>
                                        </div>
                                      </React.Fragment>
                                    ))}
                                  </div>
                                )}
                              {item.examples && item.examples.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-blue-500 flex items-center">
                                    <BookText size={16} className="mr-2" /> Ví
                                    dụ
                                  </h4>
                                  {item.examples.map((example, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-blue-50 p-4 rounded-lg border border-blue-100"
                                    >
                                      <p className="text-sm text-gray-800 italic">
                                        "{example.sentence}"
                                      </p>
                                      {example.note && (
                                        <p className="text-xs text-gray-600 mt-2">
                                          {example.note}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-gray-50 dark:bg-slate-700 rounded-2xl p-8 max-w-md mx-auto">
                        <BookOpen
                          className="text-gray-400 mx-auto mb-4"
                          size={48}
                        />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Chưa có ngữ pháp nào
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Thêm các điểm ngữ pháp có sẵn vào chủ đề này.
                        </p>
                        <button
                          onClick={() => setShowAddGrammarToCategory(true)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                        >
                          Thêm ngữ pháp
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center">
                  <BookOpen className="text-gray-400 mx-auto mb-4" size={64} />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Chọn một chủ đề ngữ pháp
                  </h3>
                  <p className="text-gray-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                    Chọn một chủ đề từ danh sách bên trái để xem và quản lý các
                    điểm ngữ pháp, hoặc tạo chủ đề mới.
                  </p>
                  <button
                    onClick={() => setShowAddCategory(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center"
                  >
                    <Plus size={20} className="mr-2" />
                    Tạo chủ đề mới
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Thêm Chủ đề */}
        {showAddCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Thêm chủ đề mới
                </h3>
                <button
                  onClick={() => setShowAddCategory(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Tên chủ đề *
                  </label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, name: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    placeholder="Ví dụ: Thì hiện tại, Câu điều kiện..."
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        description: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    placeholder="Mô tả ngắn về chủ đề này..."
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddCategory(false)}
                  className="px-6 py-3 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddCategory}
                  className="px-6 py-3 bg-indigo-600 !text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors"
                >
                  Thêm chủ đề
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Sửa Chủ đề */}
        {showEditCategory && categoryToEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Chỉnh sửa chủ đề
                </h3>
                <button
                  onClick={() => setShowEditCategory(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Tên chủ đề *
                  </label>
                  <input
                    type="text"
                    value={categoryToEdit.name}
                    onChange={(e) =>
                      setCategoryToEdit({
                        ...categoryToEdit,
                        name: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={categoryToEdit.description}
                    onChange={(e) =>
                      setCategoryToEdit({
                        ...categoryToEdit,
                        description: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditCategory(false)}
                  className="px-6 py-3 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleEditCategory}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Thêm Grammar vào Category */}
        {showAddGrammarToCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Thêm ngữ pháp vào chủ đề
                </h3>
                <button
                  onClick={() => setShowAddGrammarToCategory(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {availableGrammars.length > 0 ? (
                  availableGrammars.map((grammar) => (
                    <div
                      key={grammar.idGrammar}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {grammar.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {grammar.explanation}
                          </p>
                          <Tag
                            color={getTypeColor(grammar.level)}
                            className="mt-2"
                          >
                            {grammar.level}
                          </Tag>
                        </div>
                        <button
                          onClick={() =>
                            handleAddGrammarToCategory(grammar.idGrammar)
                          }
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Thêm vào chủ đề
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <BookOpen
                      className="text-gray-400 mx-auto mb-4"
                      size={48}
                    />
                    <p className="text-gray-600">
                      Hiện không có ngữ pháp nào khả dụng để thêm.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowAddGrammarToCategory(false)}
                  className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Thêm Grammar Mới (Admin/Teacher) */}
        {showAddGrammar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Thêm Ngữ Pháp Mới
                </h3>
                <button
                  onClick={() => setShowAddGrammar(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Tiêu đề *
                    </label>
                    <input
                      type="text"
                      value={newGrammar.title}
                      onChange={(e) =>
                        setNewGrammar({ ...newGrammar, title: e.target.value })
                      }
                      className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      placeholder="Ví dụ: Present Perfect Tense"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Cấp độ
                    </label>
                    <select
                      value={newGrammar.level}
                      onChange={(e) =>
                        setNewGrammar({ ...newGrammar, level: e.target.value })
                      }
                      className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    >
                      <option value="Low">Cơ bản</option>
                      <option value="Mid">Trung bình</option>
                      <option value="High">Nâng cao</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Giải thích *
                  </label>
                  <textarea
                    value={newGrammar.explanation}
                    onChange={(e) =>
                      setNewGrammar({
                        ...newGrammar,
                        explanation: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    placeholder="Giải thích chi tiết về cấu trúc ngữ pháp..."
                    rows="4"
                  />
                </div>

                {/* Common Mistakes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lỗi thường gặp
                  </label>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newMistake.wrong}
                        onChange={(e) =>
                          setNewMistake({
                            ...newMistake,
                            wrong: e.target.value,
                          })
                        }
                        className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Câu sai"
                      />
                      <input
                        type="text"
                        value={newMistake.right}
                        onChange={(e) =>
                          setNewMistake({
                            ...newMistake,
                            right: e.target.value,
                          })
                        }
                        className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Câu đúng"
                      />
                    </div>
                    <button
                      onClick={addMistake}
                      className="bg-gray-600 hover:bg-gray-700 !text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Thêm lỗi
                    </button>
                  </div>

                  {newGrammar.commonMistakes.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {newGrammar.commonMistakes.map((mistake, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="text-red-600 text-sm">
                              ❌ {mistake.wrong}
                            </div>
                            <div className="text-green-600 text-sm font-medium">
                              ✅ {mistake.right}
                            </div>
                          </div>
                          <button
                            onClick={() => removeMistake(index)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Examples */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ví dụ
                  </label>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newExample.sentence}
                        onChange={(e) =>
                          setNewExample({
                            ...newExample,
                            sentence: e.target.value,
                          })
                        }
                        className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Câu ví dụ"
                      />
                      <input
                        type="text"
                        value={newExample.note}
                        onChange={(e) =>
                          setNewExample({ ...newExample, note: e.target.value })
                        }
                        className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Ghi chú (tùy chọn)"
                      />
                    </div>
                    <button
                      onClick={addExample}
                      className="bg-gray-600 hover:bg-gray-700 !text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Thêm ví dụ
                    </button>
                  </div>

                  {newGrammar.examples.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {newGrammar.examples.map((example, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="text-gray-800 text-sm">
                              "{example.sentence}"
                            </div>
                            {example.note && (
                              <div className="text-gray-600 text-xs mt-1">
                                📝 {example.note}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeExample(index)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddGrammar(false)}
                  className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddGrammar}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition-colors"
                >
                  Thêm Ngữ Pháp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Sửa Grammar (Admin/Teacher) */}
        {showEditGrammar && grammarToEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Chỉnh Sửa Ngữ Pháp
                </h3>
                <button
                  onClick={() => setShowEditGrammar(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiêu đề *
                    </label>
                    <input
                      type="text"
                      value={grammarToEdit.title}
                      onChange={(e) =>
                        setGrammarToEdit({
                          ...grammarToEdit,
                          title: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cấp độ
                    </label>
                    <select
                      value={grammarToEdit.level}
                      onChange={(e) =>
                        setGrammarToEdit({
                          ...grammarToEdit,
                          level: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="Low">Cơ bản</option>
                      <option value="Mid">Trung bình</option>
                      <option value="High">Nâng cao</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giải thích *
                  </label>
                  <textarea
                    value={grammarToEdit.explanation}
                    onChange={(e) =>
                      setGrammarToEdit({
                        ...grammarToEdit,
                        explanation: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows="4"
                  />
                </div>

                {/* Common Mistakes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lỗi thường gặp
                  </label>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newMistake.wrong}
                        onChange={(e) =>
                          setNewMistake({
                            ...newMistake,
                            wrong: e.target.value,
                          })
                        }
                        className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Câu sai"
                      />
                      <input
                        type="text"
                        value={newMistake.right}
                        onChange={(e) =>
                          setNewMistake({
                            ...newMistake,
                            right: e.target.value,
                          })
                        }
                        className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Câu đúng"
                      />
                    </div>
                    <button
                      onClick={addMistake}
                      className="bg-gray-600 hover:bg-gray-700 !text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Thêm lỗi
                    </button>
                  </div>

                  {grammarToEdit.commonMistakes.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {grammarToEdit.commonMistakes.map((mistake, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="text-red-600 text-sm">
                              ❌ {mistake.wrong}
                            </div>
                            <div className="text-green-600 text-sm font-medium">
                              ✅ {mistake.right}
                            </div>
                          </div>
                          <button
                            onClick={() => removeMistake(index)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Examples */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ví dụ
                  </label>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newExample.sentence}
                        onChange={(e) =>
                          setNewExample({
                            ...newExample,
                            sentence: e.target.value,
                          })
                        }
                        className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Câu ví dụ"
                      />
                      <input
                        type="text"
                        value={newExample.note}
                        onChange={(e) =>
                          setNewExample({ ...newExample, note: e.target.value })
                        }
                        className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Ghi chú (tùy chọn)"
                      />
                    </div>
                    <button
                      onClick={addExample}
                      className="bg-gray-600 hover:bg-gray-700 !text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Thêm ví dụ
                    </button>
                  </div>

                  {grammarToEdit.examples.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {grammarToEdit.examples.map((example, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="text-gray-800 text-sm">
                              "{example.sentence}"
                            </div>
                            {example.note && (
                              <div className="text-gray-600 text-xs mt-1">
                                📝 {example.note}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeExample(index)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditGrammar(false)}
                  className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleEditGrammar}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition-colors"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Grammar;
