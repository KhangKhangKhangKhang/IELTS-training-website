// src/components/test/teacher/Reading/CreateReading.jsx
import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { InputNumber, Select, Button, message } from "antd";
import "antd/dist/reset.css"; // đảm bảo import đúng phiên bản antd
import {
  createPartAPI,
  createPassageAPI,
  createGroupOfQuestionsAPI,
  getAllPartByIdAPI,
  getPartByIdAPI,
} from "@/services/apiTest";
import QuestionTypeRenderer from "@/components/test/teacher/QuestionRender"; // optional: render form theo type

const { Option } = Select;

const loaiCauHoiOptions = [
  { value: "MCQ", label: "Multiple choice" },
  { value: "TFNG", label: "True / False / Not Given" },
  { value: "FILL_BLANK", label: "Fill in the blanks" },
  { value: "YES_NO_NOT_GIVEN", label: "Yes / No / Not Given" },
  { value: "SHORT_ANSWER", label: "Short answer" },
  { value: "LABELING", label: "Labeling" },
  { value: "MATCHING", label: "Matching" },
  { value: "OTHER", label: "Other" },
];

const CreateReading = ({ idDe, exam }) => {
  // step state
  const [creatingPart, setCreatingPart] = useState(false);
  const [partData, setPartData] = useState({
    title: "",
    order: 1,
    description: "",
  });
  const [createdPart, setCreatedPart] = useState(null); // { idPart, ... }
  // passage
  const [passageContent, setPassageContent] = useState("");
  const [passageSavedId, setPassageSavedId] = useState(null);
  // group
  const [groupType, setGroupType] = useState(null);
  const [groupQuantity, setGroupQuantity] = useState(3);
  const [createdGroupId, setCreatedGroupId] = useState(null);
  const [creatingGroup, setCreatingGroup] = useState(false);
  // Thêm 3 state này vào đầu component CreateReading
  const [allParts, setAllParts] = useState([]); // Lưu danh sách các part của đề thi
  const [selectedPart, setSelectedPart] = useState(null); // Lưu part đang được chọn để sửa
  const [isLoading, setIsLoading] = useState(true); // Cờ báo đang tải dữ liệu
  /* ---------- Create Part (chung API) ---------- */
  useEffect(() => {
    // Chỉ gọi API khi có idDe
    if (!idDe) {
      setIsLoading(false);
      return;
    }

    const fetchParts = async () => {
      try {
        setIsLoading(true);
        const res = await getAllPartByIdAPI(idDe);
        // Giả sử API trả về một mảng các part trong res.data hoặc res.data.parts
        // Bạn cần điều chỉnh key 'data' cho đúng với cấu trúc API thật
        setAllParts(res?.data || []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách part:", error);
        message.error("Không thể tải được dữ liệu của đề thi.");
        setAllParts([]); // Đảm bảo allParts là mảng khi có lỗi
      } finally {
        setIsLoading(false);
      }
    };

    fetchParts();
  }, [idDe]);

  const handleCreatePart = async () => {
    try {
      setCreatingPart(true);
      const payload = { idDe, namePart: partData.title };
      const res = await createPartAPI(payload);

      // Giả sử API trả về toàn bộ object part vừa tạo trong res.data
      const newPart = res?.data;
      if (!newPart || !newPart.idPart) {
        throw new Error("API tạo part không trả về dữ liệu hợp lệ");
      }

      // Cập nhật state
      setAllParts((prevParts) => [...prevParts, newPart]);
      setSelectedPart(newPart);

      message.success("Tạo Part thành công");
    } catch (err) {
      // ... xử lý lỗi
    } finally {
      setCreatingPart(false);
    }
  };
  /* ---------- Save Passage (only for Reading) ---------- */
  const handleSavePassage = async () => {
    if (!createdPart?.idPart)
      return message.warning("Chưa có part để lưu passage");
    try {
      const res = await createPassageAPI(createdPart.idPart, {
        content: passageContent,
      });
      const idPassage = res?.idPassage || res?.id;
      if (!idPassage)
        throw new Error("createPassageAPI phải trả về { idPassage }");
      setPassageSavedId(idPassage);
      message.success("Lưu passage thành công");
    } catch (err) {
      console.error(err);
      message.error("Lưu passage thất bại");
    }
  };

  /* ---------- Create Group of Questions ---------- */
  const handleCreateGroup = async () => {
    if (!createdPart?.idPart)
      return message.warning("Chưa có part (tạo part trước)");
    if (!groupType) return message.warning("Chọn loại câu hỏi trước");
    try {
      setCreatingGroup(true);
      const payload = {
        idDe,
        idPart: createdPart.idPart,
        typeQuestion: groupType,
        title: `Group ${groupType} - Part ${createdPart.order || ""}`,
        startingOrder: 1,
        endingOrder: groupQuantity,
      };
      const res = await createGroupOfQuestionsAPI(payload);
      const idNhom = res?.data.idNhomCauHoi || res?.idGroup || res?.id;
      if (!idNhom)
        throw new Error(
          "createGroupOfQuestionsAPI phải trả về idNhomCauHoi hoặc idGroup"
        );
      setCreatedGroupId(idNhom);
      message.success("Tạo nhóm câu hỏi thành công");
    } catch (err) {
      console.error(err);
      message.error("Tạo nhóm thất bại");
    } finally {
      setCreatingGroup(false);
    }
  };

  /* ---------- Reset để tạo Part mới ---------- */
  const handleCreateNewPart = () => {
    setCreatedPart(null);
    setPassageContent("");
    setPassageSavedId(null);
    setGroupType(null);
    setGroupQuantity(3);
    setCreatedGroupId(null);
    setPartData((p) => ({ ...p, order: (p.order || 1) + 1 })); // tăng order gợi ý
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold text-center">
        {exam?.title || "Tạo Reading"}
      </h1>

      {/* ---------- Create Part form (chung API) ---------- */}
      {!createdPart && (
        <div className="max-w-3xl mx-auto border rounded-lg p-4 bg-white shadow">
          <h2 className="text-xl font-medium mb-3">Tạo Part mới (Reading)</h2>
          <div className="space-y-3">
            <input
              className="w-full p-2 border rounded"
              placeholder="Tiêu đề part (vd: Part 1)"
              value={partData.title}
              onChange={(e) =>
                setPartData({ ...partData, title: e.target.value })
              }
            />
            <div className="flex items-center gap-3">
              <span>Thứ tự:</span>
              <InputNumber
                min={1}
                value={partData.order}
                onChange={(v) => setPartData({ ...partData, order: v })}
              />
            </div>
            <textarea
              className="w-full p-2 border rounded"
              placeholder="Mô tả (tùy chọn)"
              rows={3}
              value={partData.description}
              onChange={(e) =>
                setPartData({ ...partData, description: e.target.value })
              }
            />
            <div className="flex justify-end">
              <Button
                type="primary"
                onClick={handleCreatePart}
                loading={creatingPart}
              >
                Tạo Part
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- After part created: show Passage + Questions panels ---------- */}
      {createdPart && (
        <div className="grid grid-cols-2 gap-6">
          {/* Left: Passage */}
          <div className="border rounded-lg p-4 bg-white">
            <h3 className="text-lg font-medium mb-2">Passage</h3>
            <Textarea
              className="w-full h-64 resize-none"
              placeholder="Nhập passage..."
              value={passageContent}
              onChange={(e) => setPassageContent(e.target.value)}
            />
            <div className="flex gap-3 mt-3">
              <Button
                type="primary"
                onClick={handleSavePassage}
                disabled={!passageContent || !!passageSavedId}
              >
                {passageSavedId ? "Đã lưu" : "Lưu passage"}
              </Button>
              <Button onClick={() => setPassageContent("")}>Xóa</Button>
            </div>
          </div>

          {/* Right: Question settings */}
          <div className="border rounded-lg p-4 bg-white">
            <h3 className="text-lg font-medium mb-2">Câu hỏi của đề</h3>

            <div className="flex items-center gap-3 mb-3">
              <Select
                style={{ width: 240 }}
                placeholder="Chọn loại câu hỏi"
                value={groupType}
                onChange={(val) => setGroupType(val)}
                options={loaiCauHoiOptions}
              />
              <span>Số lượng</span>
              <InputNumber
                min={1}
                max={100}
                value={groupQuantity}
                onChange={(v) => setGroupQuantity(v)}
              />
              <Button
                type="primary"
                onClick={handleCreateGroup}
                loading={creatingGroup}
              >
                Tạo nhóm
              </Button>
            </div>

            {/* Khi đã tạo group, render form chi tiết cho loại câu hỏi */}
            {createdGroupId && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">
                  Nhóm hiện tại: {createdGroupId}
                </h4>
                {/* QuestionTypeRenderer sẽ import các form MCQ, TFNG... 
                    Bạn hiện có thể implement các file đó, hoặc mình giúp tiếp */}
                <QuestionTypeRenderer
                  type={groupType}
                  idGroup={createdGroupId}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer actions: Tạo part mới hoặc hoàn tất */}
      {createdPart && (
        <div className="flex justify-between items-center mt-4">
          <div>
            <span className="text-sm text-gray-600">Part hiện tại: </span>
            <strong>{createdPart.title || `Part ${createdPart.order}`}</strong>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleCreateNewPart}>+ Tạo part mới</Button>
            <Button
              type="primary"
              onClick={() =>
                message.info(
                  "Bạn có thể lưu toàn bộ test sau khi hoàn tất tất cả parts"
                )
              }
            >
              Hoàn tất Part
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateReading;
