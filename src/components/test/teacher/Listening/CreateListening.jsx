import React, { useState, useEffect } from "react";
import { message, Spin } from "antd";
import {
  createPartAPI,
  getAllPartByIdAPI,
  updatePartAPI,
  deletePartAPI,
  getPartByIdAPI,
} from "@/services/apiTest";

import PartListSidebar from "../Reading/PartListSideBar";
import ListeningPartPanel from "./ListeningPartPanel";
import TestInfoEditor from "../TestInfoEditor";

const CreateListening = ({ idTest, exam, onExamUpdate }) => {
  const [allParts, setAllParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [selectedPartDetail, setSelectedPartDetail] = useState(null);
  const [partDetailsMap, setPartDetailsMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [creatingPart, setCreatingPart] = useState(false);

  // --- 1. DATA FETCHING ---
  useEffect(() => {
    if (!idTest) {
      setIsLoading(false);
      return;
    }
    fetchParts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const res = await getAllPartByIdAPI(idTest);
      if (res?.data) {
        setAllParts(res.data);
        await fetchAllDetails(res.data);
      }
    }
  };

  // --- 2. CRUD PARTS ---
  const handleCreatePart = async () => {
    try {
      setCreatingPart(true);
      const res = await createPartAPI({
        idTest,
        namePart: `Part ${allParts.length + 1}`,
      });
      if (res?.data) {
        const newPartsList = [...allParts, res.data];
        setAllParts(newPartsList);
        await handleSelectPart(res.data, true);
        message.success("Tạo part thành công");
      }
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
      if (selectedPart?.idPart === idPart)
        setSelectedPart({ ...selectedPart, namePart: newName });
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

  // --- 3. OFFSET ---
  const calculateOffset = () => {
    if (!allParts || !selectedPart) return 0;
    let offset = 0;
    for (const p of allParts) {
      if (p.idPart === selectedPart.idPart) break;
      const d = partDetailsMap[p.idPart];
      if (d?.groupOfQuestions) {
        offset += d.groupOfQuestions.reduce(
          (sum, g) => sum + (g.quantity || 0),
          0
        );
      }
    }
    return offset;
  };

  if (isLoading) return <Spin size="large" className="block mx-auto mt-20" />;

  return (
    <div className="flex flex-col h-[90vh] bg-gray-50 rounded-xl shadow border overflow-hidden">
      {/* HEADER: Chỉ render TestInfoEditor. 
          Nó tự quản lý việc hiển thị Audio ở chế độ thu gọn. */}
      <div className="bg-white z-20 relative">
        <TestInfoEditor exam={exam} onUpdate={onExamUpdate} />
      </div>

      {/* BODY */}
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

        <div className="flex-1 p-6 overflow-y-auto bg-gray-100 scroll-smooth">
          {!selectedPart ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="text-6xl mb-4">🎧</div>
              <p className="text-lg">Chọn Part để bắt đầu biên soạn.</p>
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
