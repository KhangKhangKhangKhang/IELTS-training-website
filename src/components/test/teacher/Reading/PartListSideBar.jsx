import React from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const PartListSidebar = ({
  parts,
  selectedPart,
  onSelect,
  onCreate,
  creating,
}) => {
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
              onClick={() => onSelect(p)}
              className={`p-2 rounded-md cursor-pointer border ${
                selectedPart?.idPart === p.idPart
                  ? "bg-blue-50 border-blue-400"
                  : "hover:bg-gray-100 border-gray-200"
              }`}
            >
              {p.namePart || "Untitled Part"}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PartListSidebar;
