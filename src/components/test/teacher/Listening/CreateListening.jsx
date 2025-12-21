import React, { useState, useEffect } from "react";
import { message, Spin, Card } from "antd";
import { SoundOutlined } from "@ant-design/icons";
import {
  createPartAPI,
  getAllPartByIdAPI,
  updatePartAPI,
  deletePartAPI,
  getPartByIdAPI,
} from "@/services/apiTest";
import PartListSidebar from "../Reading/PartListSideBar"; // Tái sử dụng của Reading
import ListeningPartPanel from "./ListeningPartPanel"; // Component mới bên dưới
import TestInfoEditor from "../TestInfoEditor"; // Tái sử dụng

const CreateListening = ({ idTest, exam, onExamUpdate }) => {
  const [allParts, setAllParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [selectedPartDetail, setSelectedPartDetail] = useState(null);
  const [partDetailsMap, setPartDetailsMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [creatingPart, setCreatingPart] = useState(false);

  // Audio URL từ thông tin đề thi
  const audioSrc = exam?.audio || exam?.audioUrl;

  // --- 1. DATA FETCHING (Giống hệt Reading) ---
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
      await fetchAllDetails(parts);

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

  const handleSelectPart = async (part, forceUpdate = false) => {
    try {
      setSelectedPart(part);
      if (!forceUpdate && partDetailsMap[part.idPart]) {
        setSelectedPartDetail(partDetailsMap[part.idPart]);
        return;
      }
      const resDetail = await getPartByIdAPI(part.idPart);
      const partDetail = resDetail?.data?.[0];
      setSelectedPartDetail(partDetail);
      setPartDetailsMap((prev) => ({ ...prev, [part.idPart]: partDetail }));
    } catch (err) {
      console.error(err);
    }
  };

  const refreshCurrentPartData = async () => {
    if (selectedPart) {
      await handleSelectPart(selectedPart, true);
      // Refresh background để tính lại offset
      const res = await getAllPartByIdAPI(idTest);
      if (res?.data) {
        setAllParts(res.data);
        await fetchAllDetails(res.data);
      }
    }
  };

  // --- 2. CRUD PARTS (Giống hệt Reading) ---
  const handleCreatePart = async () => {
    try {
      setCreatingPart(true);
      const payload = { idTest, namePart: `Part ${allParts.length + 1}` };
      const res = await createPartAPI(payload);
      const newPart = res?.data;
      const newPartsList = [...allParts, newPart];
      setAllParts(newPartsList);
      await handleSelectPart(newPart, true);
      message.success("Tạo part thành công");
    } catch (err) {
      message.error("Tạo part thất bại");
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
      }
      message.success("Đổi tên thành công");
    } catch (err) {
      message.error("Lỗi đổi tên");
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

  // --- 3. CALCULATE OFFSET ---
  const calculateOffset = () => {
    if (!allParts || allParts.length === 0 || !selectedPart) return 0;
    let offset = 0;
    for (const p of allParts) {
      if (p.idPart === selectedPart.idPart) break;
      const d = partDetailsMap[p.idPart];
      if (d && d.groupOfQuestions) {
        offset += d.groupOfQuestions.reduce(
          (sum, g) => sum + (g.quantity || 0),
          0
        );
      }
    }
    return offset;
  };

  if (isLoading) return <Spin className="block mx-auto mt-10" />;

  return (
    <div className="flex flex-col h-[90vh] bg-gray-50 rounded-lg shadow">
      {/* HEADER: Thông tin đề + Audio Player */}
      <div className="bg-white border-b">
        <TestInfoEditor exam={exam} onUpdate={onExamUpdate} />

        {/* Audio Player cho Admin */}
        {audioSrc && (
          <div className="px-6 py-2 bg-blue-50 border-t flex items-center gap-4">
            <div className="flex items-center gap-2 text-blue-700 font-medium">
              <SoundOutlined /> Audio đề:
            </div>
            <audio controls className="h-8 w-96" src={audioSrc}>
              Trình duyệt không hỗ trợ audio.
            </audio>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR: Danh sách Part */}
        <PartListSidebar
          parts={allParts}
          selectedPart={selectedPart}
          onSelect={(p) => handleSelectPart(p, false)}
          onCreate={handleCreatePart}
          onRename={handleRenamePart}
          onDelete={handleDeletePart}
          creating={creatingPart}
        />

        {/* MAIN CONTENT: Listening Panel */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
          {!selectedPart ? (
            <div className="text-center text-gray-500 mt-20">
              {allParts.length === 0
                ? "Chưa có Part nào, hãy tạo mới."
                : "Chọn một Part để bắt đầu chỉnh sửa."}
            </div>
          ) : (
            <ListeningPartPanel
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
  );
};

export default CreateListening;
