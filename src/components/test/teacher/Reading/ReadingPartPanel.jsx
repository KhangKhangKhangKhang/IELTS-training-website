import React, { useState } from "react";
import { Button, Select, InputNumber, message } from "antd";
import { Textarea } from "@/components/ui/textarea";
import {
  createPassageAPI,
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

const ReadingPartPanel = ({ idDe, part, passage }) => {
  const [passageContent, setPassageContent] = useState(passage || "");
  const [passageSavedId, setPassageSavedId] = useState(null);
  const [groupType, setGroupType] = useState(null);
  const [groupQuantity, setGroupQuantity] = useState(3);
  const [createdGroupId, setCreatedGroupId] = useState(null);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Lưu passage
  const handleSavePassage = async () => {
    try {
      const res = await createPassageAPI(part.idPart, {
        content: passageContent,
      });
      const idPassage = res?.idPassage || res?.id;
      if (!idPassage) throw new Error("createPassageAPI phải trả về idPassage");
      setPassageSavedId(idPassage);
      message.success("Lưu passage thành công");
    } catch (err) {
      console.error(err);
      message.error("Lưu passage thất bại");
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
      setCreatedGroupId(idNhom);
      message.success("Tạo nhóm câu hỏi thành công");
    } catch (err) {
      console.error(err);
      message.error("Tạo nhóm thất bại");
    } finally {
      setCreatingGroup(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* LEFT - Passage */}
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <h3 className="text-lg font-medium mb-2">Passage - {part.namePart}</h3>
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

      {/* RIGHT - Question group */}
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <h3 className="text-lg font-medium mb-2">Câu hỏi</h3>
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

        {createdGroupId && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">
              Nhóm hiện tại: {createdGroupId}
            </h4>
            <QuestionTypeRenderer type={groupType} idGroup={createdGroupId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingPartPanel;
