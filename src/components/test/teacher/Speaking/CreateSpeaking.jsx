import React, { useState, useEffect } from "react";
import { message, Spin } from "antd";
import {
  createSpeakingTask,
  updateSpeakingTask,
  deleteSpeakingTask,
} from "@/services/apiSpeaking";
import { getDetailInTestAPI } from "@/services/apiDoTest"; // API lấy full test detail
import PartListSidebar from "../Reading/PartListSideBar";
import SpeakingPartPanel from "./SpeakingPartPanel";
import TestInfoEditor from "../TestInfoEditor";

const CreateSpeaking = ({ idTest, exam, onExamUpdate }) => {
  const [allParts, setAllParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [creatingPart, setCreatingPart] = useState(false);

  // 1. Fetch toàn bộ dữ liệu Test (bao gồm Tasks và Questions)
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
      // Dùng API getDetailInTestAPI để lấy cấu trúc lồng nhau sẵn
      const res = await getDetailInTestAPI(idTest);

      if (res?.data) {
        // Lấy mảng speakingTasks từ response
        const tasks = res.data.speakingTasks || [];

        // Map dữ liệu để khớp với Sidebar (cần idPart và namePart)
        const formattedParts = tasks
          .map((t) => ({
            ...t,
            idPart: t.idSpeakingTask, // Mapping ID cho Sidebar
            namePart: t.part || t.title, // Mapping tên hiển thị
          }))
          .sort((a, b) => {
            // Sort đơn giản theo tên Part (PART1 < PART2) hoặc createdAt
            return a.part.localeCompare(b.part);
          });

        setAllParts(formattedParts);

        // Logic giữ part đang chọn hoặc chọn part đầu tiên
        if (selectedPart) {
          const current = formattedParts.find(
            (p) => p.idPart === selectedPart.idPart
          );
          setSelectedPart(
            current || (formattedParts.length > 0 ? formattedParts[0] : null)
          );
        } else if (formattedParts.length > 0) {
          setSelectedPart(formattedParts[0]);
        } else {
          setSelectedPart(null);
        }
      }
    } catch (err) {
      console.error(err);
      message.error("Không thể tải dữ liệu đề thi");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Refresh dữ liệu (Được gọi từ Component con khi thêm/sửa câu hỏi)
  const refreshData = async () => {
    await fetchParts();
  };

  // 3. Xử lý chọn Part
  const handleSelectPart = (part) => {
    setSelectedPart(part);
  };

  // 4. Tạo Part mới (Create Speaking Task)
  const handleCreatePart = async () => {
    try {
      setCreatingPart(true);
      const nextPartNumber = allParts.length + 1;
      const partName = `PART ${nextPartNumber}`;

      const payload = {
        idTest: idTest,
        title: partName, // Title tạm thời giống tên Part
        part: partName,
      };

      await createSpeakingTask(payload);
      message.success(`Đã tạo ${partName}`);
      await fetchParts(); // Load lại để lấy ID mới nhất
    } catch (err) {
      message.error("Tạo phần thi thất bại");
      console.error(err);
    } finally {
      setCreatingPart(false);
    }
  };

  // 5. Đổi tên Part
  const handleRenamePart = async (idPart, newName) => {
    try {
      // idPart ở đây chính là idSpeakingTask
      await updateSpeakingTask(idPart, { part: newName, title: newName });
      message.success("Đã cập nhật tên phần thi");
      await fetchParts();
    } catch (err) {
      message.error("Sửa tên thất bại");
    }
  };

  // 6. Xóa Part
  const handleDeletePart = async (idPart) => {
    try {
      await deleteSpeakingTask(idPart);
      message.success("Xóa thành công");
      // Nếu xóa part đang chọn thì reset selected
      if (selectedPart?.idPart === idPart) {
        setSelectedPart(null);
      }
      await fetchParts();
    } catch (err) {
      message.error("Xóa thất bại");
    }
  };

  if (isLoading) return <Spin className="block mx-auto mt-10" size="large" />;

  return (
    <div className="flex flex-col h-[90vh] bg-gray-50 rounded-lg shadow">
      <TestInfoEditor exam={exam} onUpdate={onExamUpdate} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar quản lý Part */}
        <PartListSidebar
          parts={allParts}
          selectedPart={selectedPart}
          onSelect={handleSelectPart}
          onCreate={handleCreatePart}
          onRename={handleRenamePart}
          onDelete={handleDeletePart}
          creating={creatingPart}
          title="Danh sách Part"
        />

        {/* Panel chính quản lý câu hỏi trong Part */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
          {!selectedPart ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="text-6xl mb-4 opacity-20">🗣️</div>
              <p className="text-lg font-medium">
                Chọn hoặc tạo một Part để bắt đầu thêm câu hỏi
              </p>
            </div>
          ) : (
            <SpeakingPartPanel
              key={selectedPart.idSpeakingTask} // Force re-render khi đổi part
              task={selectedPart}
              onUpdate={refreshData}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateSpeaking;
