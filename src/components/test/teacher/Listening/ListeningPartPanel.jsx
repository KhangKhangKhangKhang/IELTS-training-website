import React, { useState } from "react";
import {
  Button,
  Select,
  InputNumber,
  message,
  Popconfirm,
  Checkbox,
  Card,
  Input,
  Upload,
  Image,
  Tooltip,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import {
  createGroupOfQuestionsAPI,
  deleteGroupOfQuestionsAPI,
} from "@/services/apiTest";
import QuestionTypeRenderer from "@/components/test/teacher/QuestionRender";
import RichTextEditor from "@/components/ui/RichTextEditor";

const { TextArea } = Input;

const loaiCauHoiOptions = [
  { value: "MCQ", label: "Multiple choice" },
  { value: "TFNG", label: "True / False / Not Given" },
  { value: "FILL_BLANK", label: "Fill in the blanks (Completion)" },
  { value: "YES_NO_NOTGIVEN", label: "Yes / No / Not Given" },
  { value: "SHORT_ANSWER", label: "Short answer" },
  { value: "LABELING", label: "Labeling (Map/Diagram)" },
  { value: "MATCHING", label: "Matching" },
  { value: "OTHER", label: "Other" },
];

const ListeningPartPanel = ({
  idTest,
  part,
  partDetail,
  onPartUpdate,
  questionNumberOffset = 0,
}) => {
  const [groupType, setGroupType] = useState(null);
  const [groupTitle, setGroupTitle] = useState("");
  const [groupQuantity, setGroupQuantity] = useState(1);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // State riêng cho Multiple Choice
  const [isMultipleMCQ, setIsMultipleMCQ] = useState(false);

  // State cho Ảnh (Dùng cho Labeling)
  const [groupImage, setGroupImage] = useState(null);
  const [groupImagePreview, setGroupImagePreview] = useState(null);

  // Xử lý khi chọn ảnh
  const handleImageChange = (info) => {
    // Chặn auto upload, lấy file raw từ info.file
    const file = info.file;
    setGroupImage(file);
    setGroupImagePreview(URL.createObjectURL(file));
    return false; // return false để chặn Antd tự upload
  };

  const handleRemoveImage = () => {
    setGroupImage(null);
    setGroupImagePreview(null);
  };

  const handleCreateGroup = async () => {
    // 1. Validate
    if (!groupType) return message.warning("Vui lòng chọn loại câu hỏi");
    if (!groupTitle.trim())
      return message.warning("Vui lòng nhập hướng dẫn/tiêu đề");

    // Cảnh báo nếu chọn Labeling mà không có ảnh
    if (groupType === "LABELING" && !groupImage) {
      message.warning("Phần Labeling (Map/Diagram) cần phải có hình ảnh!");
      // return; // Uncomment nếu muốn bắt buộc chặn lại
    }

    try {
      setCreatingGroup(true);

      // Xử lý tiêu đề đặc biệt cho MCQ
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

      // 2. TẠO OBJECT PAYLOAD (Không dùng new FormData ở đây)
      const payload = {
        idTest: idTest,
        idPart: part.idPart,
        typeQuestion: groupType,
        title: finalTitle,
        quantity: groupQuantity,
        img: groupImage, // Truyền file raw hoặc null. API Service sẽ lo phần này.
      };

      // 3. Gọi API
      await createGroupOfQuestionsAPI(payload);

      message.success("Tạo nhóm câu hỏi thành công!");

      // 4. Reset form
      setGroupType(null);
      setGroupTitle("");
      setGroupQuantity(1);
      setIsMultipleMCQ(false);
      handleRemoveImage();

      // Refresh dữ liệu
      if (onPartUpdate) await onPartUpdate();
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
      message.error("Xóa thất bại");
    }
  };

  let runningOffset = questionNumberOffset;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* --- FORM TẠO MỚI --- */}
      <Card
        title={
          <span className="text-blue-700 font-bold">Tạo nhóm câu hỏi mới</span>
        }
        size="small"
        className="shadow-md border-t-2 border-t-blue-500"
      >
        <div className="flex flex-col gap-5">
          {/* Hàng 1: Loại câu hỏi & Số lượng & Upload Ảnh */}
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Loại câu hỏi <span className="text-red-500">*</span>
              </label>
              <Select
                className="w-full"
                placeholder="Chọn dạng bài..."
                value={groupType}
                onChange={(val) => {
                  setGroupType(val);
                  if (val !== "MCQ") setIsMultipleMCQ(false);
                }}
                options={loaiCauHoiOptions}
              />
              {groupType === "LABELING" && (
                <div className="text-xs text-orange-500 mt-1">
                  * Dạng bài điền từ vào bản đồ/biểu đồ
                </div>
              )}
            </div>

            <div className="w-32">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Số lượng câu
              </label>
              <InputNumber
                className="w-full"
                min={1}
                max={50}
                value={groupQuantity}
                onChange={setGroupQuantity}
              />
            </div>

            {/* KHU VỰC UPLOAD ẢNH */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Hình ảnh (Map/Diagram)
              </label>
              <div className="flex items-center gap-3">
                <Upload
                  beforeUpload={() => false} // Chặn auto upload
                  showUploadList={false}
                  onChange={handleImageChange}
                  accept="image/png, image/jpeg"
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />}>
                    {groupImage ? "Đổi ảnh khác" : "Tải ảnh lên"}
                  </Button>
                </Upload>

                {/* Preview ảnh nhỏ */}
                {groupImagePreview && (
                  <div className="relative group border rounded p-1">
                    <Image
                      src={groupImagePreview}
                      alt="Preview"
                      width={50}
                      height={50}
                      className="object-cover rounded"
                    />
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      className="absolute -top-2 -right-2 bg-white shadow rounded-full hidden group-hover:flex items-center justify-center w-5 h-5 border"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hàng 2: Tiêu đề/Hướng dẫn */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Tiêu đề / Hướng dẫn <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              value={groupTitle}
              onChange={(html) => setGroupTitle(html)}
              placeholder={
                groupType === "LABELING"
                  ? "VD: Label the map below. Write NO MORE THAN TWO WORDS..."
                  : "Nhập hướng dẫn làm bài (có thể định dạng text)..."
              }
              minHeight="100px"
            />
          </div>

          {/* Hàng 3: Checkbox MCQ & Nút Tạo */}
          <div className="flex justify-between items-center pt-3 border-t">
            <div>
              {groupType === "MCQ" && (
                <Checkbox
                  checked={isMultipleMCQ}
                  onChange={(e) => setIsMultipleMCQ(e.target.checked)}
                >
                  <span className="text-blue-800 font-medium">
                    Multiple Choice (Chọn nhiều đáp án)
                  </span>
                </Checkbox>
              )}
            </div>

            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={handleCreateGroup}
              loading={creatingGroup}
            >
              Tạo nhóm câu hỏi
            </Button>
          </div>
        </div>
      </Card>

      {/* --- DANH SÁCH NHÓM CÂU HỎI --- */}
      <div className="space-y-6">
        {partDetail?.groupOfQuestions &&
          partDetail.groupOfQuestions.length > 0 ? (
          partDetail.groupOfQuestions.map((group) => {
            const currentGroupStart = runningOffset;
            // Use actualQuestionCount if available, fallback to quantity
            const questionCount = group.actualQuestionCount ?? group.quantity ?? 0;
            runningOffset += questionCount;

            // Clean title
            let displayTitle = group.title || "";
            if (displayTitle.startsWith("Multiple ||| "))
              displayTitle = displayTitle.replace("Multiple ||| ", "");
            if (displayTitle.startsWith("Single ||| "))
              displayTitle = displayTitle.replace("Single ||| ", "");

            return (
              <div
                key={group.idGroupOfQuestions}
                className="bg-white border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                {/* Header của Group */}
                <div className="flex justify-between items-start mb-4 border-b pb-4">
                  <div className="flex gap-4 items-start">
                    {/* Hiển thị ảnh nếu có (quan trọng cho Labeling) */}
                    {group.img && (
                      <div className="border rounded p-1 bg-gray-50 shrink-0">
                        <Image
                          src={group.img} // Đường dẫn ảnh từ Backend
                          width={120}
                          height={120}
                          className="object-contain"
                          alt="Diagram"
                        />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className="text-lg font-bold text-gray-800 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: displayTitle }}
                        />
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 font-medium">
                          {loaiCauHoiOptions.find(
                            (o) => o.value === group.typeQuestion
                          )?.label || group.typeQuestion}
                        </span>
                        <span className="bg-gray-100 px-2 py-1 rounded border">
                          {group.actualQuestionCount ?? group.quantity} câu hỏi
                        </span>
                      </div>
                    </div>
                  </div>

                  <Popconfirm
                    title="Xóa nhóm câu hỏi này?"
                    description="Hành động không thể hoàn tác!"
                    onConfirm={() =>
                      handleDeleteGroup(group.idGroupOfQuestions)
                    }
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                  >
                    <Tooltip title="Xóa nhóm">
                      <Button danger type="text" icon={<DeleteOutlined />} />
                    </Tooltip>
                  </Popconfirm>
                </div>

                {/* Renderer câu hỏi */}
                <div className="bg-gray-50 p-4 rounded-md border-l-4 border-blue-400">
                  <QuestionTypeRenderer
                    type={group.typeQuestion}
                    idGroup={group.idGroupOfQuestions}
                    groupData={group}
                    questionNumberOffset={currentGroupStart}
                    onRefresh={onPartUpdate}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-gray-400 bg-white border-2 border-dashed rounded-lg">
            <FileImageOutlined style={{ fontSize: 32, marginBottom: 10 }} />
            <p>Chưa có nhóm câu hỏi nào.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListeningPartPanel;
