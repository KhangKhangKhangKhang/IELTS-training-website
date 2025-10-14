import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import {
  createGrammarCategoriesAPI,
  getGrammarCategoriesUserAPI,
  updateGrammarCategoriesAPI,
  deleteGrammarCategoriesAPI,
  createGrammarAPI,
  getAllGrammarAPI,
  updateGrammarAPI,
  deleteGrammarAPI,
} from "../../services/apiGrammar";
import { useAuth } from "@/context/authContext";

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
  const [newGrammarItem, setNewGrammarItem] = useState({
    structure: "",
    explanation: "",
    example: "",
  });
  const [grammarItemToEdit, setGrammarItemToEdit] = useState(null);

  // State chung
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [validationErrors, setValidationErrors] = useState({
    category: "",
    grammarItem: "",
  });

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

  //Add category
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      setValidationErrors((prev) => ({
        ...prev,
        category: "Tên chủ đề không được để trống",
      }));
      return;
    }

    try {
      const res = await createGrammarCategoriesAPI(newCategory);

      setGrammarCategories((prev) => [...prev, res.data]);
      setShowAddCategory(false);
      setNewCategory({ name: "", description: "" });
      setValidationErrors((prev) => ({ ...prev, category: "" }));
    } catch (error) {
      console.error("Failed to create category:", error);
      setError("Không thể tạo chủ đề mới");
    }
  };

  const handleEditCategory = async () => {
    if (!categoryToEdit || !categoryToEdit.name.trim()) {
      setValidationErrors((prev) => ({
        ...prev,
        category: "Tên chủ đề không được để trống",
      }));
      return;
    }

    const dataToUpdate = {
      idUser: user.idUser,
      name: categoryToEdit.name,
      description: categoryToEdit.description,
    };

    try {
      await updateGrammarCategoriesAPI(
        dataToUpdate,
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

  // Delete category
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
      } catch (error) {
        console.error("Failed to delete category:", error);
        setError("Không thể xóa chủ đề này");
      }
    }
  };

  const handleSelectCategory = async (categoryId) => {
    const updatedCategories = grammarCategories.map((cat) => ({
      ...cat,
      isSelected: cat.idGrammarCategory === categoryId,
    }));
    setGrammarCategories(updatedCategories);

    try {
      const res = await getAllGrammarAPI(categoryId);
      setGrammarItems(res.data.data || res.data || []);
    } catch (error) {
      console.error("Failed to fetch grammar items:", error);
      setError("Không thể tải danh sách ngữ pháp");
    }
    console.log("Selected category:", categoryId);
  };

  const handleAddGrammarItem = async () => {
    // TODO: Thêm logic gọi createGrammarAPI
    console.log("Adding grammar item:", newGrammarItem);
    // Sau khi thành công:
    // setGrammarItems(prev => [...prev, newItemDataFromServer]);
    // setShowAddGrammarItem(false);
    // setNewGrammarItem({ structure: "", explanation: "", example: "" });
  };

  const handleEditGrammarItem = async () => {
    // TODO: Thêm logic gọi updateGrammarAPI
    console.log("Editing grammar item:", grammarItemToEdit);
    // Sau khi thành công:
    // setGrammarItems(prev => prev.map(item => item.id === grammarItemToEdit.id ? updatedData : item));
    // setShowEditGrammarItem(false);
    // setGrammarItemToEdit(null);
  };

  const handleDeleteGrammarItem = async (itemId) => {
    // TODO: Thêm logic gọi deleteGrammarAPI
    if (window.confirm("Bạn có chắc muốn xóa điểm ngữ pháp này?")) {
      console.log("Deleting grammar item:", itemId);
      // Sau khi thành công:
      // setGrammarItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  // Các hàm tiện ích
  const resetValidationErrors = () => {
    setValidationErrors({ category: "", grammarItem: "" });
  };

  const selectedCategory = grammarCategories.find((cat) => cat.isSelected);
  const filteredGrammarItems = selectedCategory
    ? grammarItems.filter(
        (item) =>
          item.structure.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.explanation.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-6 flex items-center">
          <BookOpen className="mr-3" /> Grammar IELTS
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

        {/* Phần quản lý chủ đề Ngữ pháp */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-700">
              Chủ đề Ngữ pháp
            </h2>
            <button
              onClick={() => setShowAddCategory(true)}
              className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-full transition-colors"
              title="Thêm chủ đề mới"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {grammarCategories &&
              grammarCategories
                .filter((cat) => cat && cat.idGrammarCategory)
                .map((cat) => (
                  <div key={cat.idGrammarCategory} className="relative group">
                    <button
                      onClick={() =>
                        handleSelectCategory(cat.idGrammarCategory)
                      }
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        cat.isSelected
                          ? "bg-slate-800 text-white"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      {cat.name}
                    </button>
                    <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCategoryToEdit(cat);
                          setShowEditCategory(true);
                        }}
                        className="bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600"
                        title="Chỉnh sửa chủ đề"
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(cat.idGrammarCategory);
                        }}
                        className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        title="Xóa chủ đề"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
            {grammarCategories.length === 0 && !loadingCategories && (
              <p className="text-slate-500 text-sm">
                Chưa có chủ đề nào. Hãy thêm chủ đề mới!
              </p>
            )}
            {loadingCategories && (
              <p className="text-slate-500 text-sm">Đang tải...</p>
            )}
          </div>
        </div>

        {/* Modal Thêm Chủ đề Ngữ pháp */}
        {showAddCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">
                Thêm chủ đề ngữ pháp mới
              </h3>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({
                    ...newCategory,
                    name: e.target.value,
                  })
                }
                className="w-full p-2 border rounded-md mb-3 border-slate-300"
                placeholder="Tên chủ đề (ví dụ: Tenses, Modals)"
                autoFocus
              />
              <textarea
                value={newCategory.description}
                onChange={(e) =>
                  setNewCategory({
                    ...newCategory,
                    description: e.target.value,
                  })
                }
                className="w-full p-2 border rounded-md mb-3 border-slate-300"
                placeholder="Mô tả ngắn (tùy chọn)"
                rows="2"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowAddCategory(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700"
                >
                  Thêm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Sửa Chủ đề Ngữ pháp */}
        {showEditCategory && categoryToEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">
                Sửa chủ đề ngữ pháp
              </h3>
              <input
                type="text"
                value={categoryToEdit.name}
                onChange={(e) =>
                  setCategoryToEdit({
                    ...categoryToEdit,
                    name: e.target.value,
                  })
                }
                className="w-full p-2 border rounded-md mb-3 border-slate-300"
                autoFocus
              />
              <textarea
                value={categoryToEdit.description}
                onChange={(e) =>
                  setCategoryToEdit({
                    ...categoryToEdit,
                    description: e.target.value,
                  })
                }
                className="w-full p-2 border rounded-md mb-3 border-slate-300"
                rows="2"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowEditCategory(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Hủy
                </button>
                <button
                  onClick={handleEditCategory}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phần hiển thị danh sách các điểm ngữ pháp */}
        {selectedCategory && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-700">
                Ngữ pháp: {selectedCategory.nameCategories}
              </h2>
              <div className="flex space-x-4">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Tìm kiếm cấu trúc..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
                <button
                  onClick={() => setShowAddGrammarItem(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
                >
                  <Plus size={18} className="mr-1" /> Thêm ngữ pháp
                </button>
              </div>
            </div>

            {grammarItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider w-1/4">
                        Cấu trúc
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider w-1/3">
                        Giải thích
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider w-1/3">
                        Ví dụ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredGrammarItems.map((item) => (
                      <tr key={item.idGrammar}>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {item.structure}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {item.explanation}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700 italic">
                          "{item.example}"
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setGrammarItemToEdit(item);
                                setShowEditGrammarItem(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Chỉnh sửa"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteGrammarItem(item.idGrammar)
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
                <p>Chưa có điểm ngữ pháp nào trong chủ đề này.</p>
                <button
                  onClick={() => setShowAddGrammarItem(true)}
                  className="mt-4 text-slate-800 hover:text-slate-600 underline"
                >
                  Thêm điểm ngữ pháp đầu tiên
                </button>
              </div>
            )}
          </div>
        )}

        {!selectedCategory && grammarCategories.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-slate-600">
              Vui lòng chọn một chủ đề để xem các điểm ngữ pháp.
            </p>
          </div>
        )}

        {/* Modal Thêm điểm ngữ pháp */}
        {showAddGrammarItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                Thêm điểm ngữ pháp mới
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cấu trúc *
                  </label>
                  <input
                    type="text"
                    value={newGrammarItem.structure}
                    onChange={(e) =>
                      setNewGrammarItem({
                        ...newGrammarItem,
                        structure: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-md"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Giải thích *
                  </label>
                  <textarea
                    value={newGrammarItem.explanation}
                    onChange={(e) =>
                      setNewGrammarItem({
                        ...newGrammarItem,
                        explanation: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-md"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ví dụ
                  </label>
                  <textarea
                    value={newGrammarItem.example}
                    onChange={(e) =>
                      setNewGrammarItem({
                        ...newGrammarItem,
                        example: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-md"
                    rows="2"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowAddGrammarItem(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddGrammarItem}
                  className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700"
                >
                  Thêm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Sửa điểm ngữ pháp */}
        {showEditGrammarItem && grammarItemToEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                Chỉnh sửa điểm ngữ pháp
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cấu trúc *
                  </label>
                  <input
                    type="text"
                    value={grammarItemToEdit.structure}
                    onChange={(e) =>
                      setGrammarItemToEdit({
                        ...grammarItemToEdit,
                        structure: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-md"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
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
                    className="w-full p-2 border border-slate-300 rounded-md"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ví dụ
                  </label>
                  <textarea
                    value={grammarItemToEdit.example}
                    onChange={(e) =>
                      setGrammarItemToEdit({
                        ...grammarItemToEdit,
                        example: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-md"
                    rows="2"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowEditGrammarItem(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Hủy
                </button>
                <button
                  onClick={handleEditGrammarItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
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

export default Grammar;
