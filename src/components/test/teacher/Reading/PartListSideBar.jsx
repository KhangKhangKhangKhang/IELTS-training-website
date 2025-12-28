import React, { useState } from "react";
import { Button, Dropdown, Input } from "antd";
import { PlusOutlined, MoreOutlined } from "@ant-design/icons";
import { Layers, FileText, Plus } from "lucide-react";

const PartListSidebar = ({
  parts,
  selectedPart,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  creating,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [tempName, setTempName] = useState("");

  const handleEdit = (part) => {
    setEditingId(part.idPart);
    setTempName(part.namePart);
  };

  const handleSaveEdit = async (idPart) => {
    if (!tempName.trim()) return;
    await onRename(idPart, tempName);
    setEditingId(null);
  };

  return (
    <div className="w-72 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Layers size={18} className="text-white" />
            </div>
            <h2 className="font-bold text-lg text-gray-800 dark:text-white">Parts</h2>
          </div>
          <button
            onClick={onCreate}
            disabled={creating}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            Thêm
          </button>
        </div>
      </div>

      {/* Parts List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {parts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
            <FileText size={40} className="mb-3 opacity-50" />
            <p className="text-sm text-center">
              Chưa có Part nào
            </p>
            <p className="text-xs text-center mt-1 opacity-75">
              Nhấn "Thêm" để tạo part mới
            </p>
          </div>
        ) : (
          parts.map((p, index) => (
            <div
              key={p.idPart}
              className={`group flex justify-between items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                selectedPart?.idPart === p.idPart
                  ? "bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500 shadow-md"
                  : "bg-gray-50 dark:bg-slate-700/50 border-transparent hover:bg-gray-100 dark:hover:bg-slate-700 hover:border-gray-200 dark:hover:border-slate-600"
              }`}
              onClick={() => onSelect(p)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  selectedPart?.idPart === p.idPart
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300"
                }`}>
                  {index + 1}
                </div>
                
                {editingId === p.idPart ? (
                  <Input
                    size="small"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onPressEnter={() => handleSaveEdit(p.idPart)}
                    onBlur={() => handleSaveEdit(p.idPart)}
                    autoFocus
                    className="w-32"
                  />
                ) : (
                  <span className={`font-medium truncate ${
                    selectedPart?.idPart === p.idPart
                      ? "text-blue-700 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-200"
                  }`}>
                    {p.namePart}
                  </span>
                )}
              </div>

              {/* Menu */}
              <Dropdown
                trigger={["click"]}
                menu={{
                  items: [
                    {
                      key: "edit",
                      label: "Đổi tên",
                      onClick: (e) => {
                        e.domEvent.stopPropagation();
                        handleEdit(p);
                      },
                    },
                    {
                      key: "delete",
                      label: "Xóa",
                      danger: true,
                      onClick: (e) => {
                        e.domEvent.stopPropagation();
                        onDelete(p.idPart);
                      },
                    },
                  ],
                }}
              >
                <MoreOutlined
                  onClick={(e) => e.stopPropagation()}
                  className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1"
                />
              </Dropdown>
            </div>
          ))
        )}
      </div>

      {/* Footer Stats */}
      {parts.length > 0 && (
        <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            <span className="font-semibold text-blue-600 dark:text-blue-400">{parts.length}</span> parts trong đề thi
          </div>
        </div>
      )}
    </div>
  );
};

export default PartListSidebar;
