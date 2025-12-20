import React, { useState, useEffect } from "react";
import {
  Button,
  Select,
  InputNumber,
  message,
  Tabs,
  Popconfirm,
  Upload,
  Spin,
} from "antd";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import { Textarea } from "@/components/ui/textarea"; // Lưu ý đường dẫn import này theo source của bạn
import {
  createPassageAPI,
  updatePassageAPI,
  createGroupOfQuestionsAPI,
  deleteGroupOfQuestionsAPI,
} from "@/services/apiTest";
import QuestionTypeRenderer from "@/components/test/teacher/QuestionRender"; // Lưu ý đường dẫn import

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
  onPartUpdate, // Hàm callback từ cha để refresh dữ liệu
  questionNumberOffset = 0, // Số bắt đầu câu hỏi (được tính từ cha)
}) => {
  // --- STATE QUẢN LÝ PASSAGE ---
  const [passageData, setPassageData] = useState({
    content: "",
    title: "",
    description: "",
    numberParagraph: 0,
    image: null,
  });
  const [existingPassage, setExistingPassage] = useState(null);
  const [savingPassage, setSavingPassage] = useState(false);

  // --- STATE QUẢN LÝ TẠO GROUP ---
  const [groupType, setGroupType] = useState(null);
  const [groupTitle, setGroupTitle] = useState("");
  const [groupQuantity, setGroupQuantity] = useState(3);
  const [groupImage, setGroupImage] = useState(null);
  const [groupImagePreview, setGroupImagePreview] = useState(null);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const [activeTab, setActiveTab] = useState("passage");

  // --- EFFECT: ĐỒNG BỘ DỮ LIỆU TỪ PROPS VÀO STATE ---
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

  // --- HANDLERS ---

  // 1. Lưu Passage
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

      // Refresh dữ liệu ở component cha
      if (onPartUpdate) await onPartUpdate();
    } catch (err) {
      console.error(err);
      message.error(
        existingPassage ? "Cập nhật passage thất bại" : "Tạo passage thất bại"
      );
    } finally {
      setSavingPassage(false);
    }
  };

  // 2. Tạo Group câu hỏi
  const handleCreateGroup = async () => {
    if (!groupType) return message.warning("Chọn loại câu hỏi trước");
    if (!groupTitle.trim()) return message.warning("Nhập tiêu đề nhóm câu hỏi");

    try {
      setCreatingGroup(true);
      const payload = {
        idTest,
        idPart: part.idPart,
        typeQuestion: groupType,
        title: groupTitle,
        quantity: groupQuantity,
      };

      if (groupImage) {
        payload.avatar = groupImage;
      }

      await createGroupOfQuestionsAPI(payload);
      message.success("Tạo nhóm câu hỏi thành công");

      // Reset form
      setGroupType(null);
      setGroupTitle("");
      setGroupQuantity(3);
      setGroupImage(null);
      setGroupImagePreview(null);

      // Refresh dữ liệu để cập nhật danh sách và tính lại số câu
      if (onPartUpdate) await onPartUpdate();

      // Chuyển sang tab câu hỏi
      setActiveTab("questions");
    } catch (err) {
      console.error(err);
      message.error("Tạo nhóm thất bại");
    } finally {
      setCreatingGroup(false);
    }
  };

  // 3. Xử lý ảnh group
  const handleGroupImageChange = (file) => {
    setGroupImage(file);
    setGroupImagePreview(URL.createObjectURL(file));
    return false; // chặn auto upload
  };

  const handleRemoveGroupImage = () => {
    setGroupImage(null);
    setGroupImagePreview(null);
  };

  // 4. Xóa Group
  const handleDeleteGroup = async (idGroupOfQuestions) => {
    try {
      await deleteGroupOfQuestionsAPI(idGroupOfQuestions);
      message.success("Đã xóa nhóm câu hỏi");

      // Refresh dữ liệu để cập nhật lại số thứ tự câu hỏi
      if (onPartUpdate) await onPartUpdate();
    } catch (err) {
      console.error(err);
      message.error("Xóa nhóm thất bại");
    }
  };

  // 5. Đếm đoạn văn
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

  // --- RENDER LOGIC ---

  // Biến chạy để tính offset cho từng nhóm khi render
  // Khởi tạo bằng giá trị offset nhận từ cha (đã tính tổng các Part trước)
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
            <h3 className="text-lg font-medium mb-4">Tạo nhóm câu hỏi mới</h3>
            <div className="space-y-4">
              {/* Tiêu đề nhóm */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tiêu đề nhóm{" "}
                  <span className="text-gray-400">(hỗ trợ nhiều dòng)</span>
                </label>
                <Textarea
                  placeholder="Ví dụ:&#10;Questions 1-5&#10;Do the following statements agree..."
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  className="w-full min-h-[100px] resize-y"
                />
              </div>

              {/* Hình ảnh nhóm */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Hình ảnh (tùy chọn)
                </label>
                <div className="flex items-center gap-4">
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={handleGroupImageChange}
                  >
                    <Button icon={<UploadOutlined />}>
                      {groupImage ? "Đổi ảnh" : "Chọn ảnh"}
                    </Button>
                  </Upload>

                  {groupImagePreview && (
                    <div className="relative">
                      <img
                        src={groupImagePreview}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveGroupImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Loại câu hỏi và số lượng */}
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">
                    Loại câu hỏi
                  </label>
                  <Select
                    placeholder="Chọn loại câu hỏi"
                    value={groupType}
                    onChange={(val) => setGroupType(val)}
                    options={loaiCauHoiOptions}
                    className="w-full"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium mb-1">
                    Số lượng
                  </label>
                  <InputNumber
                    min={1}
                    max={100}
                    value={groupQuantity}
                    onChange={(v) => setGroupQuantity(v)}
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

          {/* Hiển thị các nhóm câu hỏi đã có */}
          {partDetail?.groupOfQuestions &&
          partDetail.groupOfQuestions.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Các nhóm câu hỏi đã tạo</h3>
              {partDetail.groupOfQuestions.map((nhom) => {
                // LOGIC SỬA LỖI SỐ THỨ TỰ:
                // Lưu lại offset bắt đầu cho nhóm này
                const currentGroupStart = runningOffset;
                // Cộng dồn số lượng câu của nhóm này cho nhóm kế tiếp
                runningOffset += nhom.quantity;

                return (
                  <div
                    key={nhom.idGroupOfQuestions}
                    className="border rounded-lg p-4 bg-white shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-blue-600 whitespace-pre-line">
                        {nhom.title}
                      </h4>
                      <Popconfirm
                        title="Xóa nhóm câu hỏi"
                        description={`Bạn chắc chắn muốn xóa nhóm này? Sẽ xóa ${nhom.quantity} câu hỏi.`}
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

                    {/* Render Form chi tiết từng loại câu hỏi */}
                    <QuestionTypeRenderer
                      type={nhom.typeQuestion}
                      idGroup={nhom.idGroupOfQuestions}
                      groupData={nhom}
                      // QUAN TRỌNG: Truyền số bắt đầu đã tính toán chính xác
                      questionNumberOffset={currentGroupStart}
                      // QUAN TRỌNG: Truyền callback refresh để form con gọi khi save
                      onRefresh={onPartUpdate}
                    />
                  </div>
                );
              })}
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
