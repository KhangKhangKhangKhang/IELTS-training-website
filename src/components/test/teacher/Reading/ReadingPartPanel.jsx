import React, { useState, useEffect } from "react";
import {
  Button,
  Select,
  InputNumber,
  message,
  Tabs,
  Popconfirm,
  Upload,
  Checkbox,
  Input,
} from "antd";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import { Textarea } from "@/components/ui/textarea";
import {
  createPassageAPI,
  updatePassageAPI,
  createGroupOfQuestionsAPI,
  deleteGroupOfQuestionsAPI,
} from "@/services/apiTest";
import QuestionTypeRenderer from "@/components/test/teacher/QuestionRender";

const loaiCauHoiOptions = [
  { value: "MCQ", label: "Multiple choice" },
  { value: "TFNG", label: "True / False / Not Given" },
  { value: "FILL_BLANK", label: "Fill in the blanks" },
  { value: "YES_NO_NOTGIVEN", label: "Yes / No / Not Given" },
  { value: "SHORT_ANSWER", label: "Short answer" },
  { value: "LABELING", label: "Labeling" },
  { value: "MATCHING", label: "Matching" },
  { value: "OTHER", label: "Other" },
];

const ReadingPartPanel = ({
  idTest,
  part,
  partDetail,
  onPartUpdate,
  questionNumberOffset = 0,
}) => {
  const [passageData, setPassageData] = useState({
    content: "",
    title: "",
    description: "",
    numberParagraph: 0,
    image: null,
  });
  const [existingPassage, setExistingPassage] = useState(null);
  const [savingPassage, setSavingPassage] = useState(false);

  const [groupType, setGroupType] = useState(null);
  const [groupTitle, setGroupTitle] = useState("");
  const [groupQuantity, setGroupQuantity] = useState(3);
  const [groupImage, setGroupImage] = useState(null);
  const [groupImagePreview, setGroupImagePreview] = useState(null);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [isMultipleMCQ, setIsMultipleMCQ] = useState(false);
  const [activeTab, setActiveTab] = useState("passage");

  useEffect(() => {
    if (partDetail?.passage) {
      const passage = partDetail.passage;
      setExistingPassage(passage);
      setPassageData({
        content: passage.content || "",
        title: passage.title || `Passage - ${part.namePart}`,
        description: passage.description || "",
        numberParagraph: passage.numberParagraph || 0,
        image: passage.image || null,
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
  }, [partDetail, part.namePart, part.idPart]);

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

      if (passageData.image && typeof passageData.image !== "string") {
        formData.append("image", passageData.image);
      }

      if (existingPassage) {
        await updatePassageAPI(existingPassage.idPassage, formData);
        message.success("Cập nhật passage thành công");
      } else {
        await createPassageAPI(formData);
        message.success("Tạo passage thành công");
      }
      if (onPartUpdate) await onPartUpdate();
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi lưu passage");
    } finally {
      setSavingPassage(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupType) return message.warning("Chọn loại câu hỏi trước");
    if (!groupTitle.trim()) return message.warning("Nhập tiêu đề nhóm câu hỏi");

    try {
      setCreatingGroup(true);
      let finalTitle = groupTitle;
      if (groupType === "MCQ") {
        const prefix = isMultipleMCQ ? "Multiple ||| " : "Single ||| ";
        if (
          !groupTitle.startsWith("Multiple |||") &&
          !groupTitle.startsWith("Single |||")
        ) {
          finalTitle = prefix + groupTitle;
        }
      }

      const payload = {
        idTest,
        idPart: part.idPart,
        typeQuestion: groupType,
        title: finalTitle,
        quantity: groupQuantity,
      };

      if (groupImage) {
        payload.avatar = groupImage;
      }

      await createGroupOfQuestionsAPI(payload);
      message.success("Tạo nhóm câu hỏi thành công");

      setGroupType(null);
      setGroupTitle("");
      setGroupQuantity(3);
      setGroupImage(null);
      setGroupImagePreview(null);
      setIsMultipleMCQ(false);
      if (onPartUpdate) await onPartUpdate();
      setActiveTab("questions");
    } catch (err) {
      console.error(err);
      message.error("Tạo nhóm thất bại");
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleGroupImageChange = (file) => {
    setGroupImage(file);
    setGroupImagePreview(URL.createObjectURL(file));
    return false;
  };

  const handleRemoveGroupImage = () => {
    setGroupImage(null);
    setGroupImagePreview(null);
  };

  const handleDeleteGroup = async (idGroupOfQuestions) => {
    try {
      await deleteGroupOfQuestionsAPI(idGroupOfQuestions);
      message.success("Đã xóa nhóm câu hỏi");
      if (onPartUpdate) await onPartUpdate();
    } catch (err) {
      console.error(err);
      message.error("Xóa nhóm thất bại");
    }
  };

  const handleContentChange = (content) => {
    let count = 0;
    if (content.trim()) {
      count = content.split("\n").filter((p) => p.trim() !== "").length;
    }
    setPassageData((prev) => ({
      ...prev,
      content,
      numberParagraph: count,
    }));
  };

  let runningOffset = questionNumberOffset;

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
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-medium mb-4">Tạo nhóm câu hỏi mới</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tiêu đề nhóm
                </label>
                <Input.TextArea // SỬA: Dùng Input.TextArea của Antd
                  placeholder="Questions 1-5... (Có thể xuống dòng)"
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  className="w-full"
                  rows={4} // Cho phép hiển thị nhiều dòng mặc định
                />
              </div>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">
                    Loại câu hỏi
                  </label>
                  <Select
                    placeholder="Chọn loại câu hỏi"
                    value={groupType}
                    onChange={(val) => {
                      setGroupType(val);
                      if (val !== "MCQ") setIsMultipleMCQ(false);
                    }}
                    options={loaiCauHoiOptions}
                    className="w-full"
                  />
                  {groupType === "MCQ" && (
                    <div className="mt-2 bg-blue-50 p-2 rounded border border-blue-100">
                      <Checkbox
                        checked={isMultipleMCQ}
                        onChange={(e) => setIsMultipleMCQ(e.target.checked)}
                      >
                        <span className="text-blue-800 font-medium">
                          Cho phép chọn nhiều đáp án (Multiple Choice)
                        </span>
                      </Checkbox>
                    </div>
                  )}
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium mb-1">
                    Số lượng
                  </label>
                  <InputNumber
                    min={1}
                    max={100}
                    value={groupQuantity}
                    onChange={setGroupQuantity}
                    className="w-full"
                  />
                </div>
                <Button
                  type="primary"
                  onClick={handleCreateGroup}
                  loading={creatingGroup}
                >
                  Tạo nhóm
                </Button>
              </div>
            </div>
          </div>

          {partDetail?.groupOfQuestions &&
          partDetail.groupOfQuestions.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Các nhóm câu hỏi đã tạo</h3>
              {partDetail.groupOfQuestions.map((nhom) => {
                const currentGroupStart = runningOffset;
                runningOffset += nhom.quantity;
                let displayTitle = nhom.title;
                if (displayTitle.startsWith("Multiple ||| ")) {
                  displayTitle = displayTitle.replace("Multiple ||| ", "");
                } else if (displayTitle.startsWith("Single ||| ")) {
                  displayTitle = displayTitle.replace("Single ||| ", "");
                }

                return (
                  <div
                    key={nhom.idGroupOfQuestions}
                    className="border rounded-lg p-4 bg-white shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex flex-col">
                        <h4 className="font-medium text-blue-600 whitespace-pre-line">
                          {displayTitle}
                        </h4>
                        {nhom.typeQuestion === "MCQ" && (
                          <span className="text-xs text-gray-500 mt-1">
                            {nhom.title.startsWith("Multiple")
                              ? "(Dạng: Chọn nhiều đáp án - Gộp câu)"
                              : "(Dạng: Chọn 1 đáp án)"}
                          </span>
                        )}
                      </div>
                      <Popconfirm
                        title="Xóa nhóm câu hỏi"
                        onConfirm={() =>
                          handleDeleteGroup(nhom.idGroupOfQuestions)
                        }
                        okText="Xóa"
                        cancelText="Hủy"
                      >
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>
                    </div>
                    <QuestionTypeRenderer
                      type={nhom.typeQuestion}
                      idGroup={nhom.idGroupOfQuestions}
                      groupData={nhom}
                      questionNumberOffset={currentGroupStart}
                      onRefresh={onPartUpdate}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8 border rounded-lg bg-gray-50">
              Chưa có nhóm câu hỏi nào.
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
