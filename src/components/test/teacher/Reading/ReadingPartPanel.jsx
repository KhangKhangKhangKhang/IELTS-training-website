import React, { useState, useEffect } from "react";
import {
  Button,
  Select,
  InputNumber,
  message,
  Tabs,
  Popconfirm,
  Checkbox,
  Spin,
  Input
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import RichTextEditor from "@/components/ui/RichTextEditor";
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
  isLoading = false,
}) => {
  // State cho Passage
  const [passageData, setPassageData] = useState({
    content: "",
    title: "",
    description: "",
    numberParagraph: 0,
    image: null,
  });
  const [existingPassage, setExistingPassage] = useState(null);
  const [savingPassage, setSavingPassage] = useState(false);

  // State cho Group Questions
  const [groupType, setGroupType] = useState(null);
  const [groupTitle, setGroupTitle] = useState("");
  const [groupQuantity, setGroupQuantity] = useState(3);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [isMultipleMCQ, setIsMultipleMCQ] = useState(false);
  
  // State cho Tabs
  const [activeTab, setActiveTab] = useState("passage");

  // --- EFFECT: Xử lý dữ liệu khi partDetail thay đổi ---
  useEffect(() => {
    if (!partDetail) return;

    // Kiểm tra xem Part này đã có Passage chưa
    if (partDetail.passage && partDetail.passage.idPassage) {
      const p = partDetail.passage;
      console.log("Đã tìm thấy Passage:", p); // Debug log

      setExistingPassage(p);
      setPassageData({
        content: p.content || "", // Đảm bảo không bị undefined
        title: p.title || `Passage - ${part.namePart}`,
        description: p.description || "",
        numberParagraph: p.numberParagraph || 0,
        image: p.image || null,
      });
    } else {
      // Part này chưa có Passage -> Reset form
      console.log("Part chưa có Passage, reset form");
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

  // --- HANDLERS: Passage ---
  const handleSavePassage = async () => {
    try {
      setSavingPassage(true);
      const formData = new FormData();
      formData.append("idPart", part.idPart);
      formData.append("title", passageData.title);
      formData.append("content", passageData.content);
      formData.append("description", passageData.description || "");
      formData.append("numberParagraph", passageData.numberParagraph.toString());

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
      // Gọi callback để load lại dữ liệu mới nhất
      if (onPartUpdate) await onPartUpdate();
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi lưu passage");
    } finally {
      setSavingPassage(false);
    }
  };

  const handleContentChange = (content) => {
    let count = 0;
    if (content && content.trim()) {
      // Đếm số đoạn văn (đơn giản)
      count = content.split("</p>").length - 1; 
      if (count < 0) count = 0;
    }
    setPassageData((prev) => ({ ...prev, content, numberParagraph: count }));
  };

  // --- HANDLERS: Group Questions ---
  const handleCreateGroup = async () => {
    if (!groupType) return message.warning("Chọn loại câu hỏi trước");
    if (!groupTitle.trim()) return message.warning("Nhập tiêu đề nhóm câu hỏi");

    try {
      setCreatingGroup(true);
      let finalTitle = groupTitle;
      if (groupType === "MCQ") {
        const prefix = isMultipleMCQ ? "Multiple ||| " : "Single ||| ";
        if (!groupTitle.startsWith("Multiple |||") && !groupTitle.startsWith("Single |||")) {
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

      await createGroupOfQuestionsAPI(payload);
      message.success("Tạo nhóm câu hỏi thành công");
      
      // Reset form
      setGroupType(null);
      setGroupTitle("");
      setGroupQuantity(3);
      setIsMultipleMCQ(false);
      
      if (onPartUpdate) await onPartUpdate();
      setActiveTab("questions"); // Chuyển sang tab câu hỏi
    } catch (err) {
      console.error(err);
      message.error("Tạo nhóm thất bại");
    } finally {
      setCreatingGroup(false);
    }
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

  // Nếu đang loading từ cha truyền vào
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  // Render nội dung Tab Câu Hỏi
  const renderQuestionsTab = () => {
    const groups = partDetail?.groupOfQuestions || [];
    let runningOffset = questionNumberOffset;

    return (
      <div className="space-y-6">
        {/* Form tạo nhóm mới */}
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <h3 className="text-lg font-medium mb-4">Tạo nhóm câu hỏi mới</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tiêu đề nhóm (VD: Questions 1-5)</label>
              <RichTextEditor
                key={`create-group-${part.idPart}`} // Reset editor khi đổi part
                value={groupTitle}
                onChange={setGroupTitle}
                placeholder="Nhập hướng dẫn làm bài..."
                minHeight="100px"
              />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Loại câu hỏi</label>
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
                  <div className="mt-2">
                    <Checkbox checked={isMultipleMCQ} onChange={(e) => setIsMultipleMCQ(e.target.checked)}>
                      <span className="text-blue-700">Cho phép chọn nhiều đáp án (Multiple Choice)</span>
                    </Checkbox>
                  </div>
                )}
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium mb-1">Số câu</label>
                <InputNumber min={1} max={50} value={groupQuantity} onChange={setGroupQuantity} className="w-full" />
              </div>
              <Button type="primary" onClick={handleCreateGroup} loading={creatingGroup}>
                Thêm nhóm
              </Button>
            </div>
          </div>
        </div>

        {/* Danh sách nhóm đã tạo */}
        {groups.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Danh sách câu hỏi</h3>
            {groups.map((nhom) => {
              const currentGroupStart = runningOffset;
              runningOffset += nhom.quantity;
              
              let displayTitle = nhom.title;
              if (displayTitle.startsWith("Multiple ||| ")) displayTitle = displayTitle.replace("Multiple ||| ", "");
              else if (displayTitle.startsWith("Single ||| ")) displayTitle = displayTitle.replace("Single ||| ", "");

              return (
                <div key={nhom.idGroupOfQuestions} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-3 border-b pb-2">
                    <div>
                      <div className="font-medium text-blue-800 prose prose-sm max-w-none mb-1"
                           dangerouslySetInnerHTML={{ __html: displayTitle }} />
                      <div className="text-xs text-gray-500 bg-gray-100 inline-block px-2 py-1 rounded">
                        Loại: {nhom.typeQuestion} • Số lượng: {nhom.quantity} câu
                      </div>
                    </div>
                    <Popconfirm title="Bạn có chắc muốn xóa nhóm này?" onConfirm={() => handleDeleteGroup(nhom.idGroupOfQuestions)}>
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                  
                  {/* Render chi tiết từng câu hỏi */}
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
          <div className="text-center text-gray-400 py-8 bg-gray-50 rounded border border-dashed">
            Chưa có câu hỏi nào trong Part này.
          </div>
        )}
      </div>
    );
  };

  const items = [
    {
      key: "passage",
      label: "Nội dung bài đọc (Passage)",
      children: (
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">Soạn thảo bài đọc</h3>
            {existingPassage && (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-medium">
                ✓ Đã lưu dữ liệu
              </span>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-600">Tiêu đề bài đọc</label>
            <Input
              value={passageData.title}
              onChange={(e) => setPassageData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Ví dụ: The History of Tea..."
            />
          </div>

          <div className="mb-4">
             <label className="block text-sm font-medium mb-1 text-gray-600">Nội dung chi tiết</label>
             {/* QUAN TRỌNG: Thêm key để force re-render khi idPassage thay đổi */}
             <RichTextEditor
               key={existingPassage?.idPassage || `new-passage-${part.idPart}`} 
               value={passageData.content}
               onChange={handleContentChange}
               placeholder="Nhập nội dung bài đọc ở đây..."
               minHeight="450px"
             />
          </div>

          <div className="flex gap-3 pt-2 border-t">
            <Button type="primary" onClick={handleSavePassage} loading={savingPassage} className="min-w-[120px]">
              {existingPassage ? "Cập nhật bài đọc" : "Lưu bài đọc mới"}
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: "questions",
      label: "Quản lý câu hỏi",
      children: renderQuestionsTab(),
    },
  ];

  return <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} className="w-full" destroyInactiveTabPane={true} />;
};

export default ReadingPartPanel;