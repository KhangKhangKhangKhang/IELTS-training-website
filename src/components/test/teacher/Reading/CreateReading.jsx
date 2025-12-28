import React, { useState, useEffect } from "react";
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
import TestInfoEditor from "../TestInfoEditor";

const CreateReading = ({ idTest, exam, onExamUpdate }) => {
  const [allParts, setAllParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [selectedPartDetail, setSelectedPartDetail] = useState(null);
  const [partDetailsMap, setPartDetailsMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [creatingPart, setCreatingPart] = useState(false);

  // Lấy danh sách part ban đầu
  useEffect(() => {
    if (!idTest) {
      setIsLoading(false);
      return;
    }
    fetchParts();
  }, [idTest]);

  const fetchParts = async () => {
    try {
      setIsLoading(true);
      const res = await getAllPartByIdAPI(idTest);
      const parts = res?.data || [];
      setAllParts(parts);

      // Pre-load chi tiết để tính toán số câu hỏi chính xác
      await fetchAllDetails(parts);

      // Nếu chưa chọn part nào, chọn cái đầu tiên
      if (parts.length > 0 && !selectedPart) {
        handleSelectPart(parts[0]);
      }
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách part");
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm tải chi tiết cho tất cả parts (để tính offset chính xác)
  const fetchAllDetails = async (parts) => {
    const details = await Promise.all(
      parts.map(async (p) => {
        try {
          const r = await getPartByIdAPI(p.idPart);
          return { idPart: p.idPart, detail: r?.data?.[0] || null };
        } catch (e) {
          return { idPart: p.idPart, detail: null };
        }
      })
    );
    const map = {};
    details.forEach((d) => {
      if (d && d.idPart) map[d.idPart] = d.detail;
    });
    setPartDetailsMap(map);
  };

  // Xử lý chọn part - forceUpdate = true sẽ bỏ qua cache và gọi API
  const handleSelectPart = async (part, forceUpdate = false) => {
    try {
      setSelectedPart(part);

      // Nếu có cache và không bắt buộc update thì dùng cache cho nhanh
      if (!forceUpdate && partDetailsMap[part.idPart]) {
        setSelectedPartDetail(partDetailsMap[part.idPart]);
        return;
      }

      // Gọi API lấy chi tiết part mới nhất
      const resDetail = await getPartByIdAPI(part.idPart);
      const partDetail = resDetail?.data?.[0];

      // Cập nhật State và Map
      setSelectedPartDetail(partDetail);
      setPartDetailsMap((prev) => ({ ...prev, [part.idPart]: partDetail }));
    } catch (err) {
      console.error("Lỗi khi lấy chi tiết part:", err);
    }
  };

  // Hàm này được truyền xuống con để gọi khi con thay đổi dữ liệu (thêm/xóa group)
  const refreshCurrentPartData = async () => {
    if (selectedPart) {
      await handleSelectPart(selectedPart, true);
      const res = await getAllPartByIdAPI(idTest);
      if (res?.data) {
        setAllParts(res.data);
        await fetchAllDetails(res.data);
      }
    }
  };

  // Tạo part
  const handleCreatePart = async () => {
    try {
      setCreatingPart(true);
      const payload = {
        idTest,
        namePart: `Part ${allParts.length + 1}`,
      };
      const res = await createPartAPI(payload);
      const newPart = res?.data;
      if (!newPart?.idPart) throw new Error("API không trả về idPart");

      const newPartsList = [...allParts, newPart];
      setAllParts(newPartsList);

      await handleSelectPart(newPart, true);
      message.success("Tạo part thành công");
    } catch (err) {
      message.error("Tạo part thất bại");
      console.error(err);
    } finally {
      setCreatingPart(false);
    }
  };

  const handleRenamePart = async (idPart, newName) => {
    try {
      await updatePartAPI(idPart, { idTest, namePart: newName });
      const updatedParts = allParts.map((p) =>
        p.idPart === idPart ? { ...p, namePart: newName } : p
      );
      setAllParts(updatedParts);

      if (selectedPart?.idPart === idPart) {
        setSelectedPart({ ...selectedPart, namePart: newName });
        if (selectedPartDetail) {
          setSelectedPartDetail({ ...selectedPartDetail, namePart: newName });
        }
      }
      message.success("Đã cập nhật tên part");
    } catch (err) {
      message.error("Sửa tên thất bại");
    }
  };

  const handleDeletePart = async (idPart) => {
    try {
      await deletePartAPI(idPart);
      const updatedParts = allParts.filter((p) => p.idPart !== idPart);
      setAllParts(updatedParts);

      const newMap = { ...partDetailsMap };
      delete newMap[idPart];
      setPartDetailsMap(newMap);

      if (selectedPart?.idPart === idPart) {
        setSelectedPart(null);
        setSelectedPartDetail(null);
      }
      message.success("Xóa part thành công");
    } catch (err) {
      message.error("Xóa part thất bại");
    }
  };

  // Tính toán questionOffset dựa trên Map đã được update
  const calculateOffset = () => {
    if (!allParts || allParts.length === 0 || !selectedPart) return 0;

    let offset = 0;
    for (const p of allParts) {
      if (p.idPart === selectedPart.idPart) break;

      const d = partDetailsMap[p.idPart];
      if (d && d.groupOfQuestions && d.groupOfQuestions.length) {
        offset += d.groupOfQuestions.reduce(
          (sum, g) => sum + (g.quantity || 0),
          0
        );
      }
    }
    return offset;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      <div className="flex flex-col h-screen">
        <TestInfoEditor exam={exam} onUpdate={onExamUpdate} />

        <div className="flex flex-1 overflow-hidden">
          <PartListSidebar
            parts={allParts}
            selectedPart={selectedPart}
            onSelect={(p) => handleSelectPart(p, false)}
            onCreate={handleCreatePart}
            onRename={handleRenamePart}
            onDelete={handleDeletePart}
            creating={creatingPart}
          />

          <div className="flex-1 p-6 overflow-y-auto bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            {!selectedPart ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-lg font-medium">
                  {allParts.length === 0
                    ? "Chưa có Part nào, hãy tạo mới."
                    : "Chọn một Part để bắt đầu chỉnh sửa."}
                </p>
              </div>
            ) : (
              <ReadingPartPanel
                idTest={idTest}
                part={selectedPart}
                partDetail={selectedPartDetail}
                onPartUpdate={refreshCurrentPartData}
                questionNumberOffset={calculateOffset()}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateReading;
