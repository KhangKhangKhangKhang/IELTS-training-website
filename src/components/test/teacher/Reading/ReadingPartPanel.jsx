import React, { useState, useEffect } from "react";
import { Button, Select, InputNumber, message, Tabs } from "antd";
import { Textarea } from "@/components/ui/textarea";
import {
  createPassageAPI,
  updatePassageAPI,
  createGroupOfQuestionsAPI,
} from "@/services/apiTest";
import QuestionTypeRenderer from "@/components/test/teacher/QuestionRender";

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

const ReadingPartPanel = ({ idDe, part, partDetail, onPartUpdate }) => {
  const [passageData, setPassageData] = useState({
    content: "",
    title: "",
    description: "",
    numberParagraph: 0,
    image: null,
  });
  const [existingPassage, setExistingPassage] = useState(null);
  const [groupType, setGroupType] = useState(null);
  const [groupQuantity, setGroupQuantity] = useState(3);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [activeTab, setActiveTab] = useState("passage");
  const [savingPassage, setSavingPassage] = useState(false);

  // Khởi tạo dữ liệu từ partDetail
  useEffect(() => {
    if (partDetail?.doanVans) {
      const doanVan = partDetail.doanVans;
      setExistingPassage(doanVan);
      setPassageData({
        content: doanVan.content || "",
        title: doanVan.title || `Passage - ${part.namePart}`,
        description: doanVan.description || "",
        numberParagraph: doanVan.numberParagraph || 0,
        image: doanVan.image || null,
      });
    } else {
      setExistingPassage(null);
      setPassageData({
        content: "",
        title: `Passage - ${part.namePart}`,
        description: "",
        numberParagraph: 0,
        image: null,
      });
    }
    console.log("Initialized passage data from partDetail:", passageData);
  }, [partDetail, part.namePart]);

  // Lưu passage (create hoặc update)
  const handleSavePassage = async () => {
    try {
      setSavingPassage(true);

      const formData = new FormData();
      formData.append("idPart", part.idPart);
      formData.append("title", passageData.title);
      formData.append("content", passageData.content);
      formData.append("description", passageData.description);
      formData.append(
        "numberParagraph",
        passageData.numberParagraph.toString()
      );

      // Nếu có ảnh mới, thêm vào formData
      if (passageData.image && typeof passageData.image !== "string") {
        formData.append("image", passageData.image);
      }

      let res;
      if (existingPassage) {
        // Update passage đã tồn tại
        res = await updatePassageAPI(existingPassage.idDoanVan, formData);
        message.success("Cập nhật passage thành công");
      } else {
        // Tạo passage mới
        res = await createPassageAPI(formData);
        message.success("Tạo passage thành công");
      }

      // Refresh part detail để lấy dữ liệu mới
      if (onPartUpdate) {
        onPartUpdate(part);
      }
    } catch (err) {
      console.error(err);
      message.error(
        existingPassage ? "Cập nhật passage thất bại" : "Tạo passage thất bại"
      );
    } finally {
      setSavingPassage(false);
    }
  };

  // Tạo nhóm câu hỏi
  const handleCreateGroup = async () => {
    if (!groupType) return message.warning("Chọn loại câu hỏi trước");
    try {
      setCreatingGroup(true);
      const payload = {
        idDe,
        idPart: part.idPart,
        typeQuestion: groupType,
        title: `Group ${groupType}`,
        startingOrder: 1,
        endingOrder: groupQuantity,
      };
      const res = await createGroupOfQuestionsAPI(payload);
      const idNhom = res?.data.idNhomCauHoi || res?.idGroup || res?.id;
      if (!idNhom) throw new Error("API không trả về idNhomCauHoi");
      message.success("Tạo nhóm câu hỏi thành công");

      // Refresh part detail
      if (onPartUpdate) {
        onPartUpdate(part);
      }

      // Chuyển sang tab questions
      setActiveTab("questions");
    } catch (err) {
      console.error(err);
      message.error("Tạo nhóm thất bại");
    } finally {
      setCreatingGroup(false);
    }
  };

  // Xử lý thay đổi passage content
  const handleContentChange = (content) => {
    setPassageData((prev) => ({
      ...prev,
      content,
      numberParagraph: content.split("\n\n").filter((p) => p.trim()).length,
    }));
  };

  const items = [
    {
      key: "passage",
      label: "Passage",
      children: (
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Passage - {part.namePart}</h3>
            {existingPassage && (
              <span className="text-sm text-green-600">✓ Đã có passage</span>
            )}
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Tiêu đề</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={passageData.title}
              onChange={(e) =>
                setPassageData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Nhập tiêu đề passage..."
            />
          </div>

          <Textarea
            className="w-full h-64 resize-none"
            placeholder="Nhập nội dung passage..."
            value={passageData.content}
            onChange={(e) => handleContentChange(e.target.value)}
          />

          <div className="mt-2 text-sm text-gray-500">
            Số đoạn văn: {passageData.numberParagraph}
          </div>

          <div className="flex gap-3 mt-3">
            <Button
              type="primary"
              onClick={handleSavePassage}
              loading={savingPassage}
              disabled={!passageData.content.trim()}
            >
              {existingPassage ? "Cập nhật passage" : "Lưu passage"}
            </Button>
            <Button onClick={() => handleContentChange("")}>
              Xóa nội dung
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: "questions",
      label: "Câu hỏi",
      children: (
        <div className="space-y-6">
          {/* Phần tạo mới nhóm câu hỏi */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-medium mb-2">Tạo nhóm câu hỏi mới</h3>
            <div className="flex items-center gap-3 mb-3">
              <Select
                style={{ width: 220 }}
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
          </div>

          {/* Hiển thị các nhóm câu hỏi đã có */}
          {partDetail?.nhomCauHois && partDetail.nhomCauHois.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Các nhóm câu hỏi đã tạo</h3>
              {partDetail.nhomCauHois.map((nhom) => (
                <div
                  key={nhom.idNhomCauHoi}
                  className="border rounded-lg p-4 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-blue-600">{nhom.title}</h4>
                  </div>
                  <QuestionTypeRenderer
                    type={nhom.typeQuestion}
                    idGroup={nhom.idNhomCauHoi}
                    groupData={nhom} // Truyền cả data của nhóm
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8 border rounded-lg bg-gray-50">
              Chưa có nhóm câu hỏi nào. Hãy tạo nhóm mới.
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
    </div>
  );
};

export default ReadingPartPanel;
