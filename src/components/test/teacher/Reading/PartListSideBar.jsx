import React, { useState } from "react";
import { Button, Dropdown, Input, Menu } from "antd";
import { PlusOutlined, MoreOutlined } from "@ant-design/icons";

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
    <div className="w-64 border-r bg-white p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg">Parts</h2>
        <Button
          size="small"
          icon={<PlusOutlined />}
          onClick={onCreate}
          loading={creating}
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {parts.length === 0 ? (
          <p className="text-gray-400 text-sm text-center mt-8">
            Không có Part nào
          </p>
        ) : (
          parts.map((p) => (
            <div
              key={p.idPart}
              className={`group flex justify-between items-center p-2 rounded-md border cursor-pointer ${
                selectedPart?.idPart === p.idPart
                  ? "bg-blue-50 border-blue-400"
                  : "hover:bg-gray-100 border-gray-200"
              }`}
              onClick={() => onSelect(p)}
            >
              {editingId === p.idPart ? (
                <Input
                  size="small"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onPressEnter={() => handleSaveEdit(p.idPart)}
                  onBlur={() => handleSaveEdit(p.idPart)}
                  autoFocus
                />
              ) : (
                <span className="truncate">{p.namePart}</span>
              )}

              {/* Menu ẩn hiện khi hover */}
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
                  className="opacity-0 group-hover:opacity-100 transition cursor-pointer"
                />
              </Dropdown>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PartListSidebar;
