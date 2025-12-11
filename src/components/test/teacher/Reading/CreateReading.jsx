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

const CreateReading = ({ idTest, exam }) => {
  const [allParts, setAllParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [selectedPartDetail, setSelectedPartDetail] = useState(null);
  const [partDetailsMap, setPartDetailsMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [creatingPart, setCreatingPart] = useState(false);

  // Lấy danh sách part
  useEffect(() => {
    if (!idTest) {
      setIsLoading(false);
      return;
    }

    const fetchParts = async () => {
      try {
        setIsLoading(true);
        const res = await getAllPartByIdAPI(idTest);
        console.log("Fetched parts:", res);

        const parts = res?.data || [];
        setAllParts(parts);

        if (parts.length > 0) {
          // Lấy chi tiết cho tất cả các part để tính offset số câu
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

          // Tự động chọn part đầu tiên và lấy chi tiết (from map)
          setSelectedPart(parts[0]);
          setSelectedPartDetail(map[parts[0].idPart] || null);
        }
      } catch (err) {
        console.error(err);
        message.error("Không thể tải danh sách part");
      } finally {
        setIsLoading(false);
      }
    };
    fetchParts();
  }, [idTest]);

  // Xử lý chọn part và lấy chi tiết
  const handleSelectPart = async (part) => {
    try {
      setSelectedPart(part);

      // If we already fetched details map use it, otherwise request
      if (partDetailsMap[part.idPart]) {
        setSelectedPartDetail(partDetailsMap[part.idPart]);
        return;
      }

      // Gọi API lấy chi tiết part
      const resDetail = await getPartByIdAPI(part.idPart);
      console.log("Part detail:", resDetail);

      const partDetail = resDetail?.data?.[0];
      setSelectedPartDetail(partDetail);
      setPartDetailsMap((prev) => ({ ...prev, [part.idPart]: partDetail }));
    } catch (err) {
      console.error("Lỗi khi lấy chi tiết part:", err);
      message.error("Không thể tải chi tiết part");
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

      setAllParts((prev) => [...prev, newPart]);
      await handleSelectPart(newPart); // Chọn part mới tạo
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
        idTest: idTest,
        namePart: newName,
      });
      if (res?.success || res?.message || res?.idPart) {
        setAllParts((prev) =>
          prev.map((p) =>
            p.idPart === idPart ? { ...p, namePart: newName } : p
          )
        );
        if (selectedPart?.idPart === idPart) {
          setSelectedPart({ ...selectedPart, namePart: newName });
          // Cập nhật lại selectedPartDetail nếu đang chọn
          if (selectedPartDetail) {
            setSelectedPartDetail({
              ...selectedPartDetail,
              namePart: newName,
            });
          }
        }
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
      if (selectedPart?.idPart === idPart) {
        setSelectedPart(null);
        setSelectedPartDetail(null);
      }
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
        onSelect={handleSelectPart}
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
          <ReadingPartPanel
            idTest={idTest}
            part={selectedPart}
            partDetail={selectedPartDetail}
            onPartUpdate={handleSelectPart} // Truyền callback để refresh data
            // compute questionNumberOffset by summing quantities of previous parts
            questionNumberOffset={(() => {
              try {
                if (!allParts || allParts.length === 0 || !selectedPart)
                  return 0;
                let offset = 0;
                for (const p of allParts) {
                  if (p.idPart === selectedPart.idPart) break;
                  const d = partDetailsMap[p.idPart];
                  if (d && d.groupOfQuestions && d.groupOfQuestions.length) {
                    offset += d.groupOfQuestions.reduce(
                      (s, g) => s + (g.quantity || 0),
                      0
                    );
                  }
                }
                return offset;
              } catch (e) {
                return 0;
              }
            })()}
          />
        )}
      </div>
    </div>
  );
};

export default CreateReading;
