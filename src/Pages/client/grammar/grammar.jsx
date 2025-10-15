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
} from "lucide-react";
import { Tag } from "antd";
import {
  createGrammarCategoriesAPI,
  getGrammarCategoriesUserAPI,
  updateGrammarCategoriesAPI,
  deleteGrammarCategoriesAPI,
  createGrammarAPI,
  getAllGrammarAPI,
  updateGrammarAPI,
  deleteGrammarAPI,
} from "@/services/apiGrammar";
import { useAuth } from "@/context/authContext";

const initialGrammarItemState = {
  title: "",
  explanation: "",
  level: "Low",
  commonMistakes: [{ wrong: "", right: "", explanation: "" }],
  examples: [{ sentence: "", note: "" }],
};

const Grammar = () => {
  const { user } = useAuth();

  // State cho danh mục ngữ pháp
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

  // State cho các điểm ngữ pháp
  const [grammarItems, setGrammarItems] = useState([]);
  const [showAddGrammarItem, setShowAddGrammarItem] = useState(false);
  const [showEditGrammarItem, setShowEditGrammarItem] = useState(false);
  const [newGrammarItem, setNewGrammarItem] = useState(initialGrammarItemState);
  const [grammarItemToEdit, setGrammarItemToEdit] = useState(null);

  // State chung
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingGrammar, setLoadingGrammar] = useState(false);

  const getTypeColor = (type) => {
    const colors = {
      Low: "green",
      Mid: "orange",
      High: "red",
    };
    return colors[type] || "gray";
  };

  // Fetch danh mục ngữ pháp
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

  // --- XỬ LÝ DANH MỤC ---
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      alert("Tên chủ đề không được để trống");
      return;
    }
    try {
      const res = await createGrammarCategoriesAPI(newCategory);
      setGrammarCategories((prev) => [...prev, res.data.data]);
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

  // Hiển thị grammar items theo danh mục
  const handleSelectCategory = async (categoryId) => {
    const updatedCategories = grammarCategories.map((cat) => ({
      ...cat,
      isSelected: cat.idGrammarCategory === categoryId,
    }));
    setGrammarCategories(updatedCategories);
    setLoadingGrammar(true);
    try {
      const res = await getAllGrammarAPI(categoryId);
      const rawItems = res.data.data || res.data || [];
      const processedItems = rawItems.map((item) => {
        const mistakes =
          typeof item.commonMistakes === "string" && item.commonMistakes
            ? JSON.parse(item.commonMistakes)
            : item.commonMistakes || [];
        const examples =
          typeof item.examples === "string" && item.examples
            ? JSON.parse(item.examples)
            : item.examples || [];
        return { ...item, commonMistakes: mistakes, examples };
      });
      setGrammarItems(processedItems);
    } catch (error) {
      console.error("Failed to fetch grammar items:", error);
      setError("Không thể tải danh sách ngữ pháp");
      setGrammarItems([]);
    } finally {
      setLoadingGrammar(false);
    }
  };

  // --- XỬ LÝ ĐIỂM NGỮ PHÁP ---
  // Thêm mới
  const handleNewItemChange = (index, field, value, type) => {
    setNewGrammarItem((prevState) => {
      const updatedItems = [...prevState[type]];
      updatedItems[index][field] = value;
      return { ...prevState, [type]: updatedItems };
    });
  };

  const addNewItem = (type) => {
    const newItem =
      type === "commonMistakes"
        ? { wrong: "", right: "", explanation: "" }
        : { sentence: "", note: "" };
    setNewGrammarItem((prevState) => ({
      ...prevState,
      [type]: [...prevState[type], newItem],
    }));
  };

  const removeNewItem = (index, type) => {
    if (newGrammarItem[type].length <= 1) return;
    const updatedItems = newGrammarItem[type].filter((_, i) => i !== index);
    setNewGrammarItem({ ...newGrammarItem, [type]: updatedItems });
  };

  const handleAddGrammarItem = async () => {
    const selectedCategory = grammarCategories.find((cat) => cat.isSelected);
    if (!selectedCategory) {
      setError("Vui lòng chọn một chủ đề trước khi thêm.");
      return;
    }
    if (!newGrammarItem.title.trim() || !newGrammarItem.explanation.trim()) {
      alert("Cấu trúc và Giải thích là bắt buộc.");
      return;
    }
    const payload = {
      ...newGrammarItem,
      idGrammarCategory: selectedCategory.idGrammarCategory,
      commonMistakes: JSON.stringify(
        newGrammarItem.commonMistakes.filter((m) => m.wrong || m.right)
      ),
      examples: JSON.stringify(
        newGrammarItem.examples.filter((e) => e.sentence || e.note)
      ),
    };

    try {
      const res = await createGrammarAPI(payload, user.idUser);
      const responseData = res.data.data || res.data;

      if (!responseData) {
        throw new Error("Không nhận được dữ liệu từ server");
      }

      const newItem = {
        ...responseData,
        commonMistakes:
          typeof responseData.commonMistakes === "string"
            ? JSON.parse(responseData.commonMistakes || "[]")
            : responseData.commonMistakes || [],
        examples:
          typeof responseData.examples === "string"
            ? JSON.parse(responseData.examples || "[]")
            : responseData.examples || [],
      };

      setGrammarItems((prevItems) => [...prevItems, newItem]);
      setShowAddGrammarItem(false);
      setNewGrammarItem(initialGrammarItemState);
    } catch (error) {
      console.error("Failed to create grammar item:", error);
      setError(error.response?.data?.message || "Thêm ngữ pháp thất bại.");
    }
  };

  // Chỉnh sửa
  const handleEditItemChange = (index, field, value, type) => {
    setGrammarItemToEdit((prevState) => {
      const updatedItems = [...prevState[type]];
      updatedItems[index][field] = value;
      return { ...prevState, [type]: updatedItems };
    });
  };

  const addEditItem = (type) => {
    const newItem =
      type === "commonMistakes"
        ? { wrong: "", right: "", explanation: "" }
        : { sentence: "", note: "" };
    setGrammarItemToEdit((prevState) => ({
      ...prevState,
      [type]: [...prevState[type], newItem],
    }));
  };

  const removeEditItem = (index, type) => {
    if (grammarItemToEdit[type].length <= 1) return;
    const updatedItems = grammarItemToEdit[type].filter((_, i) => i !== index);
    setGrammarItemToEdit({ ...grammarItemToEdit, [type]: updatedItems });
  };

  const handleEditGrammarItem = async () => {
    if (!grammarItemToEdit) return;
    if (
      !grammarItemToEdit.title.trim() ||
      !grammarItemToEdit.explanation.trim()
    ) {
      alert("Cấu trúc và Giải thích là bắt buộc.");
      return;
    }

    let grammarId = grammarItemToEdit.idGrammar;

    if (typeof grammarId === "object") {
      grammarId = grammarId.idGrammar || grammarId.id || "";
    }

    grammarId = String(grammarId).trim();
    console.log("Final grammarId to use:", grammarId);

    if (!grammarId || grammarId === "undefined" || grammarId === "null") {
      setError("Không tìm thấy ID hợp lệ của điểm ngữ pháp");
      return;
    }

    const payload = {
      title: grammarItemToEdit.title,
      explanation: grammarItemToEdit.explanation,
      level: grammarItemToEdit.level,
      idGrammarCategory: grammarItemToEdit.idGrammarCategory,
      commonMistakes: JSON.stringify(
        grammarItemToEdit.commonMistakes.filter((m) => m.wrong || m.right)
      ),
      examples: JSON.stringify(
        grammarItemToEdit.examples.filter((e) => e.sentence || e.note)
      ),
    };

    try {
      const res = await updateGrammarAPI(payload, grammarId, user.idUser);

      const responseData = res.data.data || res.data;

      if (!responseData) {
        throw new Error("Không nhận được dữ liệu từ server");
      }

      const updatedItem = {
        ...responseData,
        commonMistakes:
          typeof responseData.commonMistakes === "string"
            ? JSON.parse(responseData.commonMistakes || "[]")
            : responseData.commonMistakes || [],
        examples:
          typeof responseData.examples === "string"
            ? JSON.parse(responseData.examples || "[]")
            : responseData.examples || [],
      };

      setGrammarItems((prevItems) =>
        prevItems.map((item) => {
          const itemId = item.idGrammar?.idGrammar || item.idGrammar;
          return String(itemId) === grammarId ? updatedItem : item;
        })
      );
      setShowEditGrammarItem(false);
      setGrammarItemToEdit(null);
    } catch (error) {
      console.error("Failed to update grammar item:", error);
      setError(error.response?.data?.message || "Cập nhật thất bại.");
    }
  };

  const handleDeleteGrammarItem = async (itemId) => {
    if (window.confirm("Bạn có chắc muốn xóa điểm ngữ pháp này?")) {
      try {
        await deleteGrammarAPI(itemId, user.idUser);
        setGrammarItems((prevItems) =>
          prevItems.filter((item) => item.idGrammar !== itemId)
        );
      } catch (error) {
        console.error("Failed to delete grammar item:", error);
        setError(error.response?.data?.message || "Xóa thất bại.");
      }
    }
  };

  // --- RENDER LOGIC ---
  const selectedCategory = grammarCategories.find((cat) => cat.isSelected);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <div className="bg-indigo-100 p-3 rounded-xl mr-4">
              <BookOpen className="text-indigo-600" size={28} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Grammar IELTS
              </h1>
              <p className="text-gray-600 mt-1">
                Quản lý và học ngữ pháp IELTS hiệu quả
              </p>
            </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Chủ đề ngữ pháp
                </h2>
                <button
                  onClick={() => setShowAddCategory(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition-all duration-200 hover:shadow-md"
                  title="Thêm chủ đề mới"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {grammarCategories.map((cat) => (
                  <div
                    key={cat.idGrammarCategory}
                    className={`group relative p-4 rounded-xl transition-all duration-200 cursor-pointer ${
                      cat.isSelected
                        ? "bg-indigo-50 border-2 border-indigo-200 shadow-sm"
                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                    }`}
                    onClick={() => handleSelectCategory(cat.idGrammarCategory)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-semibold truncate ${
                            cat.isSelected ? "text-indigo-700" : "text-gray-800"
                          }`}
                        >
                          {cat.name}
                        </h3>
                        {cat.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
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
                        <ChevronRight className="text-indigo-500" size={16} />
                      </div>
                    )}
                  </div>
                ))}

                {grammarCategories.length === 0 && !loadingCategories && (
                  <div className="text-center py-8">
                    <div className="bg-gray-100 p-4 rounded-xl">
                      <BookOpen
                        className="text-gray-400 mx-auto mb-2"
                        size={32}
                      />
                      <p className="text-gray-500 text-sm">
                        Chưa có chủ đề nào
                      </p>
                      <button
                        onClick={() => setShowAddCategory(true)}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mt-2"
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
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mr-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-1">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedCategory.name}
                    </h2>
                    {selectedCategory.description && (
                      <p className="text-gray-600 mt-1">
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
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 transition-all max-w-2xl"
                      />
                    </div>
                    <button
                      onClick={() => setShowAddGrammarItem(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl flex items-center justify-center transition-all duration-200 hover:shadow-md font-medium"
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
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 bg-white group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                                {index + 1}
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 ml-3">
                                {item.title}
                              </h3>

                              <div className="ml-4">
                                <Tag color={getTypeColor(item.level)}>
                                  {item.level}
                                </Tag>
                              </div>
                            </div>
                            <p className="text-gray-700 leading-relaxed">
                              {item.explanation}
                            </p>
                          </div>
                          <div className="flex space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setGrammarItemToEdit({
                                  ...initialGrammarItemState,
                                  ...item,
                                });
                                setShowEditGrammarItem(true);
                              }}
                              className="text-gray-500 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteGrammarItem(item.idGrammar)
                              }
                              className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Xóa"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>

                        {(item.commonMistakes || item.examples) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
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
                                  <BookText size={16} className="mr-2" /> Ví dụ
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
                    <div className="bg-gray-50 rounded-2xl p-8 max-w-md mx-auto">
                      <BookOpen
                        className="text-gray-400 mx-auto mb-4"
                        size={48}
                      />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Chưa có ngữ pháp nào
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Bắt đầu thêm các điểm ngữ pháp đầu tiên vào chủ đề này.
                      </p>
                      <button
                        onClick={() => setShowAddGrammarItem(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                      >
                        Thêm ngữ pháp
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <BookOpen className="text-gray-400 mx-auto mb-4" size={64} />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Chọn một chủ đề ngữ pháp
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
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

        {/* Modal Thêm Chủ đề */}
        {showAddCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Thêm chủ đề mới
                </h3>
                <button
                  onClick={() => setShowAddCategory(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên chủ đề *
                  </label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, name: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ví dụ: Thì hiện tại, Câu điều kiện..."
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Mô tả ngắn về chủ đề này..."
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddCategory(false)}
                  className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddCategory}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors"
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
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Chỉnh sửa chủ đề
                </h3>
                <button
                  onClick={() => setShowEditCategory(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditCategory(false)}
                  className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors"
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

        {/* Modal Thêm điểm ngữ pháp */}
        {showAddGrammarItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Thêm điểm ngữ pháp mới
                </h3>
                <button
                  onClick={() => setShowAddGrammarItem(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cấu trúc ngữ pháp *
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Present Perfect"
                      value={newGrammarItem.title}
                      onChange={(e) =>
                        setNewGrammarItem({
                          ...newGrammarItem,
                          title: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cấp độ (Level)
                    </label>
                    <select
                      value={newGrammarItem.level}
                      onChange={(e) =>
                        setNewGrammarItem({
                          ...newGrammarItem,
                          level: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Mid">Mid</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giải thích *
                  </label>
                  <textarea
                    placeholder="Giải thích chi tiết về cấu trúc này..."
                    value={newGrammarItem.explanation}
                    onChange={(e) =>
                      setNewGrammarItem({
                        ...newGrammarItem,
                        explanation: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="4"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Lỗi thường gặp */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800">
                      Lỗi thường gặp
                    </h4>
                    {newGrammarItem.commonMistakes.map((mistake, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 p-4 rounded-lg space-y-2 relative border"
                      >
                        {newGrammarItem.commonMistakes.length > 1 && (
                          <button
                            onClick={() =>
                              removeNewItem(index, "commonMistakes")
                            }
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                          >
                            <X size={16} />
                          </button>
                        )}
                        <input
                          type="text"
                          placeholder="Câu sai (wrong)"
                          value={mistake.wrong}
                          onChange={(e) =>
                            handleNewItemChange(
                              index,
                              "wrong",
                              e.target.value,
                              "commonMistakes"
                            )
                          }
                          className="w-full p-2 border border-gray-200 rounded"
                        />
                        <input
                          type="text"
                          placeholder="Câu đúng (right)"
                          value={mistake.right}
                          onChange={(e) =>
                            handleNewItemChange(
                              index,
                              "right",
                              e.target.value,
                              "commonMistakes"
                            )
                          }
                          className="w-full p-2 border border-gray-200 rounded"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => addNewItem("commonMistakes")}
                      className="text-sm text-indigo-600 font-medium"
                    >
                      + Thêm lỗi sai
                    </button>
                  </div>

                  {/* Ví dụ */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800">Ví dụ</h4>
                    {newGrammarItem.examples.map((example, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 p-4 rounded-lg space-y-2 relative border"
                      >
                        {newGrammarItem.examples.length > 1 && (
                          <button
                            onClick={() => removeNewItem(index, "examples")}
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                          >
                            <X size={16} />
                          </button>
                        )}
                        <input
                          type="text"
                          placeholder="Câu ví dụ (sentence)"
                          value={example.sentence}
                          onChange={(e) =>
                            handleNewItemChange(
                              index,
                              "sentence",
                              e.target.value,
                              "examples"
                            )
                          }
                          className="w-full p-2 border border-gray-200 rounded"
                        />
                        <textarea
                          placeholder="Ghi chú (note)"
                          value={example.note}
                          onChange={(e) =>
                            handleNewItemChange(
                              index,
                              "note",
                              e.target.value,
                              "examples"
                            )
                          }
                          className="w-full p-2 border border-gray-200 rounded"
                          rows="2"
                        ></textarea>
                      </div>
                    ))}
                    <button
                      onClick={() => addNewItem("examples")}
                      className="text-sm text-indigo-600 font-medium"
                    >
                      + Thêm ví dụ
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={() => setShowAddGrammarItem(false)}
                  className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddGrammarItem}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Thêm ngữ pháp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Sửa điểm ngữ pháp */}
        {showEditGrammarItem && grammarItemToEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Chỉnh sửa điểm ngữ pháp
                </h3>
                <button
                  onClick={() => setShowEditGrammarItem(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cấu trúc ngữ pháp *
                    </label>
                    <input
                      type="text"
                      value={grammarItemToEdit.title}
                      onChange={(e) =>
                        setGrammarItemToEdit({
                          ...grammarItemToEdit,
                          title: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cấp độ (Level)
                    </label>
                    <select
                      value={grammarItemToEdit.level}
                      onChange={(e) =>
                        setGrammarItemToEdit({
                          ...grammarItemToEdit,
                          level: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Mid">Mid</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giải thích *
                  </label>
                  <textarea
                    value={grammarItemToEdit.explanation}
                    onChange={(e) =>
                      setGrammarItemToEdit({
                        ...grammarItemToEdit,
                        explanation: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="4"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Lỗi thường gặp */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800">
                      Lỗi thường gặp
                    </h4>
                    {grammarItemToEdit.commonMistakes.map((mistake, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 p-4 rounded-lg space-y-2 relative border"
                      >
                        {grammarItemToEdit.commonMistakes.length > 1 && (
                          <button
                            onClick={() =>
                              removeEditItem(index, "commonMistakes")
                            }
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                          >
                            <X size={16} />
                          </button>
                        )}
                        <input
                          type="text"
                          placeholder="Câu sai (wrong)"
                          value={mistake.wrong}
                          onChange={(e) =>
                            handleEditItemChange(
                              index,
                              "wrong",
                              e.target.value,
                              "commonMistakes"
                            )
                          }
                          className="w-full p-2 border border-gray-200 rounded"
                        />
                        <input
                          type="text"
                          placeholder="Câu đúng (right)"
                          value={mistake.right}
                          onChange={(e) =>
                            handleEditItemChange(
                              index,
                              "right",
                              e.target.value,
                              "commonMistakes"
                            )
                          }
                          className="w-full p-2 border border-gray-200 rounded"
                        />
                        <textarea
                          placeholder="Giải thích (explanation)"
                          value={mistake.explanation}
                          onChange={(e) =>
                            handleEditItemChange(
                              index,
                              "explanation",
                              e.target.value,
                              "commonMistakes"
                            )
                          }
                          className="w-full p-2 border border-gray-200 rounded"
                          rows="2"
                        ></textarea>
                      </div>
                    ))}
                    <button
                      onClick={() => addEditItem("commonMistakes")}
                      className="text-sm text-indigo-600 font-medium"
                    >
                      + Thêm lỗi sai
                    </button>
                  </div>

                  {/* Ví dụ */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800">Ví dụ</h4>
                    {grammarItemToEdit.examples.map((example, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 p-4 rounded-lg space-y-2 relative border"
                      >
                        {grammarItemToEdit.examples.length > 1 && (
                          <button
                            onClick={() => removeEditItem(index, "examples")}
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                          >
                            <X size={16} />
                          </button>
                        )}
                        <input
                          type="text"
                          placeholder="Câu ví dụ (sentence)"
                          value={example.sentence}
                          onChange={(e) =>
                            handleEditItemChange(
                              index,
                              "sentence",
                              e.target.value,
                              "examples"
                            )
                          }
                          className="w-full p-2 border border-gray-200 rounded"
                        />
                        <textarea
                          placeholder="Ghi chú (note)"
                          value={example.note}
                          onChange={(e) =>
                            handleEditItemChange(
                              index,
                              "note",
                              e.target.value,
                              "examples"
                            )
                          }
                          className="w-full p-2 border border-gray-200 rounded"
                          rows="2"
                        ></textarea>
                      </div>
                    ))}
                    <button
                      onClick={() => addEditItem("examples")}
                      className="text-sm text-indigo-600 font-medium"
                    >
                      + Thêm ví dụ
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={() => setShowEditGrammarItem(false)}
                  className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleEditGrammarItem}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Lưu thay đổi
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
