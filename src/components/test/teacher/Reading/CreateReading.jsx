import React, { useState, useEffect, use } from "react";
import { Button, message, Spin } from "antd";
import {
  createPartAPI,
  getAllPartByIdAPI,
  updatePartAPI,
  deletePartAPI,
  getPartByIdAPI,
} from "@/services/apiTest";
import PartListSidebar from "./PartListSideBar";
import ReadingPartPanel from "./ReadingPartPanel";

const CreateReading = ({ idDe, exam }) => {
  const [allParts, setAllParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [creatingPart, setCreatingPart] = useState(false);
  const [passage, setPassage] = useState("");

  // Lấy danh sách part
  useEffect(() => {
    if (!idDe) {
      setIsLoading(false);
      return;
    }

    const fetchParts = async () => {
      try {
        setIsLoading(true);
        const res = await getAllPartByIdAPI(idDe);
        console.log("Fetched parts:", res);

        const parts = res?.data || [];
        setAllParts(parts);

        if (parts.length > 0) {
          const firstPartId = parts[0]?.idPart;
          const resDetail = await getPartByIdAPI(firstPartId);
          console.log("Part detail:", resDetail);

          // vì data là mảng nên phải lấy phần tử đầu tiên
          const firstPart = resDetail?.data?.[0];

          const passageContent = firstPart?.doanVans?.content || "";
          setPassage(passageContent);
          console.log("Passage content:", passage);
        }
      } catch (err) {
        console.error(err);
        message.error("Không thể tải danh sách part");
      } finally {
        setIsLoading(false);
      }
    };
    fetchParts();
  }, [idDe]);
  useEffect(() => {
    console.log("Updated passage state:", passage);
  }, [passage]);
  // Tạo part
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

  // Sửa tên part
  const handleRenamePart = async (idPart, newName) => {
    try {
      const res = await updatePartAPI(idPart, {
        idDe: idDe,
        namePart: newName,
      });
      if (res?.success || res?.message || res?.idPart) {
        setAllParts((prev) =>
          prev.map((p) =>
            p.idPart === idPart ? { ...p, namePart: newName } : p
          )
        );
        if (selectedPart?.idPart === idPart)
          setSelectedPart({ ...selectedPart, namePart: newName });
        message.success("Đã cập nhật tên part");
      }
    } catch (err) {
      console.error(err);
      message.error("Sửa tên thất bại");
    }
  };

  // Xóa part
  const handleDeletePart = async (idPart) => {
    try {
      const res = await deletePartAPI(idPart);
      setAllParts((prev) => prev.filter((p) => p.idPart !== idPart));
      if (selectedPart?.idPart === idPart) setSelectedPart(null);
      message.success("Xóa part thành công");
    } catch (err) {
      console.error(err);
      message.error("Xóa part thất bại");
    }
  };
  if (isLoading) return <Spin className="block mx-auto mt-10" />;

  return (
    <div className="flex h-[85vh] bg-gray-50 rounded-lg shadow">
      {/* Sidebar hiển thị danh sách part */}
      <PartListSidebar
        parts={allParts}
        selectedPart={selectedPart}
        onSelect={setSelectedPart}
        onCreate={handleCreatePart}
        onRename={handleRenamePart}
        onDelete={handleDeletePart}
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
          <ReadingPartPanel idDe={idDe} part={selectedPart} passage={passage} />
        )}
      </div>
    </div>
  );
};

export default CreateReading;
