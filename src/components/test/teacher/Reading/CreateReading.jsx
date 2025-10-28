import React, { useState, useEffect } from "react";
import { Button, message, Spin } from "antd";
import { createPartAPI, getAllPartByIdAPI } from "@/services/apiTest";
import PartListSidebar from "./PartListSidebar";
import ReadingPartPanel from "./ReadingPartPanel";

const CreateReading = ({ idDe, exam }) => {
  const [allParts, setAllParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [creatingPart, setCreatingPart] = useState(false);

  // Lấy danh sách part theo idDe
  useEffect(() => {
    if (!idDe) {
      setIsLoading(false);
      return;
    }

    const fetchParts = async () => {
      try {
        setIsLoading(true);
        const res = await getAllPartByIdAPI(idDe);
        setAllParts(res?.data || []);
      } catch (err) {
        console.error(err);
        message.error("Không thể tải danh sách part");
      } finally {
        setIsLoading(false);
      }
    };
    fetchParts();
  }, [idDe]);

  // Tạo part mới
  const handleCreatePart = async () => {
    try {
      setCreatingPart(true);
      const payload = { idDe, namePart: `Part ${allParts.length + 1}` };
      const res = await createPartAPI(payload);
      const newPart = res?.data;
      if (!newPart?.idPart) throw new Error("API không trả về idPart");
      setAllParts((prev) => [...prev, newPart]);
      setSelectedPart(newPart);
      message.success("Tạo part thành công");
    } catch (err) {
      message.error("Tạo part thất bại");
      console.error(err);
    } finally {
      setCreatingPart(false);
    }
  };

  if (isLoading)
    return (
      <Spin className="block w-full h-full flex items-center justify-center mx-auto mt-10" />
    );

  return (
    <div className="flex h-[85vh] bg-gray-50 rounded-lg shadow">
      {/* Sidebar hiển thị danh sách part */}
      <PartListSidebar
        parts={allParts}
        selectedPart={selectedPart}
        onSelect={setSelectedPart}
        onCreate={handleCreatePart}
        creating={creatingPart}
      />

      {/* Nội dung bên phải */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!selectedPart ? (
          <div className="text-center text-gray-500 mt-20">
            {allParts.length === 0
              ? "Chưa có Part nào, hãy tạo mới."
              : "Chọn một Part để bắt đầu chỉnh sửa."}
          </div>
        ) : (
          <ReadingPartPanel idDe={idDe} part={selectedPart} />
        )}
      </div>
    </div>
  );
};

export default CreateReading;
