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
  const [isLoadingDetail, setIsLoadingDetail] = useState(false); // Thêm state loading riêng cho detail

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

      // Pre-load chi tiết (nếu cần tính offset)
      await fetchAllDetails(parts);

      if (parts.length > 0 && !selectedPart) {
        // Chọn part đầu tiên nhưng gọi hàm chuẩn để load detail
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
      
      // QUAN TRỌNG: Reset detail về null ngay lập tức để UI không hiện dữ liệu cũ
      // Nếu có cache và không forceUpdate thì set luôn, ngược lại thì null để hiện loading
      if (!forceUpdate && partDetailsMap[part.idPart]) {
        setSelectedPartDetail(partDetailsMap[part.idPart]);
        return; 
      } else {
        setSelectedPartDetail(null); 
        setIsLoadingDetail(true);
      }

      const resDetail = await getPartByIdAPI(part.idPart);
      // API trả về data là mảng 1 phần tử, ta lấy phần tử đầu tiên
      const partDetail = resDetail?.data?.[0];

      setSelectedPartDetail(partDetail);
      setPartDetailsMap((prev) => ({ ...prev, [part.idPart]: partDetail }));
    } catch (err) {
      console.error("Lỗi khi lấy chi tiết part:", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const refreshCurrentPartData = async () => {
    if (selectedPart) {
      await handleSelectPart(selectedPart, true);
      // Update lại danh sách tổng để đảm bảo đồng bộ
      const res = await getAllPartByIdAPI(idTest);
      if (res?.data) {
        setAllParts(res.data);
        // Không cần await fetchAllDetails ở đây nếu thấy chậm, 
        // chỉ cần update cái map của part hiện tại là đủ cho offset kế tiếp
        await fetchAllDetails(res.data); 
      }
    }
  };

  const handleCreatePart = async () => {
    try {
      setCreatingPart(true);
      const payload = {
        idTest,
        namePart: `Part ${allParts.length + 1}`,
      };
      const res = await createPartAPI(payload);
      const newPart = res?.data;
      if (!newPart?.idPart) throw new Error("API lỗi");

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
      message.success("Đã cập nhật tên");
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

  const calculateOffset = () => {
    if (!allParts || allParts.length === 0 || !selectedPart) return 0;
    let offset = 0;
    for (const p of allParts) {
      if (p.idPart === selectedPart.idPart) break;
      const d = partDetailsMap[p.idPart];
      if (d && d.groupOfQuestions) {
        offset += d.groupOfQuestions.reduce((sum, g) => sum + (g.quantity || 0), 0);
      }
    }
    return offset;
  };

  if (isLoading) return <Spin className="block mx-auto mt-10" />;

  return (
    <div className="flex flex-col h-[90vh] bg-gray-50 rounded-lg shadow">
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

        <div className="flex-1 p-6 overflow-y-auto">
          {!selectedPart ? (
            <div className="text-center text-gray-500 mt-20">
              {allParts.length === 0
                ? "Chưa có Part nào, hãy tạo mới."
                : "Chọn một Part để bắt đầu chỉnh sửa."}
            </div>
          ) : (
            // QUAN TRỌNG: Thêm key={selectedPart.idPart}
            // Việc này ép React phải hủy component cũ và tạo mới hoàn toàn
            // -> State bên trong ReadingPartPanel sẽ được reset sạch sẽ
            <ReadingPartPanel
              key={selectedPart.idPart} 
              idTest={idTest}
              part={selectedPart}
              partDetail={selectedPartDetail}
              isLoading={isLoadingDetail} // Truyền thêm props loading
              onPartUpdate={refreshCurrentPartData}
              questionNumberOffset={calculateOffset()}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateReading;