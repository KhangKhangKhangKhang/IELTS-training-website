import React, { useState, useEffect, useMemo } from "react";
import {
  Input,
  Button,
  Modal,
  message,
  Card,
  Tag,
  Popconfirm,
  Collapse,
  Empty,
  Divider,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  AppstoreAddOutlined,
} from "@ant-design/icons";
import {
  createSpeakingQuestion,
  updateSpeakingQuestion,
  deleteSpeakingQuestion,
} from "@/services/apiSpeaking";

const { TextArea } = Input;

const SpeakingPartPanel = ({ task, onUpdate }) => {
  // --- STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("CREATE_TOPIC"); // 'CREATE_TOPIC' | 'ADD_TO_TOPIC' | 'EDIT_QUESTION'

  // Dữ liệu Form
  const [topicName, setTopicName] = useState("");
  const [prepTime, setPrepTime] = useState(0);
  const [newQuestions, setNewQuestions] = useState([]);

  // Dùng cho Mode Edit
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [singleQuestionData, setSingleQuestionData] = useState({});

  // --- MEMO: Group Questions by Topic ---
  const groupedQuestions = useMemo(() => {
    const groups = {};
    const list = task.questions || [];
    list.sort((a, b) => (a.order || 0) - (b.order || 0));

    list.forEach((q) => {
      const topicName = q.topic || "General";
      if (!groups[topicName]) groups[topicName] = [];
      groups[topicName].push(q);
    });
    return groups;
  }, [task.questions]);

  // --- HELPER: Init Form ---
  const initCreateForm = (initialTopic = "") => {
    setTopicName(initialTopic);
    setPrepTime(0);
    setNewQuestions([{ prompt: "", subPrompts: [""], speakingTime: 60 }]);
  };

  // --- ACTIONS: Open Modals ---
  const handleOpenCreateTopic = () => {
    setModalMode("CREATE_TOPIC");
    initCreateForm("");
    setIsModalOpen(true);
  };

  const handleOpenAddToTopic = (topic, currentQuestions) => {
    setModalMode("ADD_TO_TOPIC");
    const refTime =
      currentQuestions.length > 0 ? currentQuestions[0].preparationTime : 0;
    setTopicName(topic);
    setPrepTime(refTime);
    setNewQuestions([{ prompt: "", subPrompts: [""], speakingTime: 60 }]);
    setIsModalOpen(true);
  };

  const handleOpenEditQuestion = (q) => {
    setModalMode("EDIT_QUESTION");
    setEditingQuestionId(q.idSpeakingQuestion);
    setSingleQuestionData({
      idSpeakingTask: task.idSpeakingTask,
      topic: q.topic,
      prompt: q.prompt,
      subPrompts: q.subPrompts || [""],
      preparationTime: q.preparationTime || 0,
      speakingTime: q.speakingTime || 60,
      order: q.order || 1, // Lưu order để gửi lại khi update
    });
    setIsModalOpen(true);
  };

  // --- HANDLERS: Form Change (Create Mode) ---
  const handleNewQuestionChange = (idx, field, value) => {
    const updated = [...newQuestions];
    updated[idx][field] = value;
    setNewQuestions(updated);
  };

  const handleSubPromptChange = (qIdx, subIdx, value) => {
    const updated = [...newQuestions];
    updated[qIdx].subPrompts[subIdx] = value;
    setNewQuestions(updated);
  };

  const addSubPrompt = (qIdx) => {
    const updated = [...newQuestions];
    updated[qIdx].subPrompts.push("");
    setNewQuestions(updated);
  };

  const removeSubPrompt = (qIdx, subIdx) => {
    const updated = [...newQuestions];
    updated[qIdx].subPrompts = updated[qIdx].subPrompts.filter(
      (_, i) => i !== subIdx
    );
    setNewQuestions(updated);
  };

  const addNewQuestionRow = () => {
    setNewQuestions([
      ...newQuestions,
      { prompt: "", subPrompts: [""], speakingTime: 60 },
    ]);
  };

  const removeNewQuestionRow = (idx) => {
    setNewQuestions(newQuestions.filter((_, i) => i !== idx));
  };

  // =================================================================
  // === LOGIC SUBMIT (ĐÃ SỬA LẠI PHẦN UPDATE) ===
  // =================================================================
  const handleSubmit = async () => {
    try {
      if (modalMode === "EDIT_QUESTION") {
        // --- TRƯỜNG HỢP: UPDATE (Cấu trúc phẳng - Flat Object) ---
        // Payload khớp với body mẫu bạn cung cấp
        const updatePayload = {
          idSpeakingTask: task.idSpeakingTask,
          topic: singleQuestionData.topic,
          prompt: singleQuestionData.prompt,
          subPrompts: singleQuestionData.subPrompts.filter(
            (s) => s.trim() !== ""
          ),
          preparationTime: Number(singleQuestionData.preparationTime),
          // Hai trường này phải nằm ở root object, không nằm trong mảng questions
          speakingTime: Number(singleQuestionData.speakingTime),
          order: Number(singleQuestionData.order),
        };

        // Gọi API Update
        await updateSpeakingQuestion(editingQuestionId, updatePayload);
        message.success("Cập nhật câu hỏi thành công");
      } else {
        // --- TRƯỜNG HỢP: CREATE / ADD (Cấu trúc mảng - Nested Questions) ---
        // Validate
        if (!topicName.trim()) {
          message.error("Vui lòng nhập tên Topic");
          return;
        }
        const validQuestions = newQuestions.filter(
          (q) => q.prompt.trim() !== ""
        );
        if (validQuestions.length === 0) {
          message.error("Vui lòng nhập ít nhất 1 câu hỏi");
          return;
        }

        const currentMaxOrder = task.questions?.length || 0;

        const createPayload = {
          idSpeakingTask: task.idSpeakingTask,
          topic: topicName,
          preparationTime: Number(prepTime),
          questions: validQuestions.map((q, idx) => ({
            prompt: q.prompt,
            subPrompts: q.subPrompts.filter((s) => s.trim() !== ""),
            speakingTime: Number(q.speakingTime),
            order: currentMaxOrder + idx + 1,
          })),
        };

        // Gọi API Create
        await createSpeakingQuestion(createPayload);
        message.success(
          modalMode === "CREATE_TOPIC"
            ? "Tạo chủ đề mới thành công"
            : "Đã thêm câu hỏi vào chủ đề"
        );
      }

      // 3. Kết thúc
      setIsModalOpen(false);
      onUpdate(); // Refresh lại danh sách từ component cha
    } catch (error) {
      console.error("Lỗi submit:", error);
      // Hiển thị lỗi chi tiết nếu server trả về
      const errorMsg = error.response?.data?.message
        ? Array.isArray(error.response.data.message)
          ? error.response.data.message.join(", ")
          : error.response.data.message
        : "Có lỗi xảy ra khi lưu dữ liệu";
      message.error(errorMsg);
    }
  };

  // Delete Handler
  const handleDelete = async (id) => {
    try {
      await deleteSpeakingQuestion(id);
      message.success("Đã xóa câu hỏi");
      onUpdate();
    } catch (error) {
      message.error("Lỗi khi xóa");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide">
            {task.part} - {task.title}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Quản lý các Topic và câu hỏi.
          </p>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<AppstoreAddOutlined />}
          onClick={handleOpenCreateTopic}
          className="bg-slate-900 hover:bg-slate-800 shadow-md mt-4 md:mt-0"
        >
          Tạo Topic Mới
        </Button>
      </div>

      {/* Content: Danh sách Topic Cards */}
      {Object.keys(groupedQuestions).length === 0 ? (
        <Empty
          description="Chưa có chủ đề nào. Hãy tạo mới!"
          className="py-10"
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {Object.entries(groupedQuestions).map(([topic, questions]) => (
            <Card
              key={topic}
              className="shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-blue-500"
              title={
                <div className="flex items-center gap-2 text-lg text-blue-900">
                  <span>🏷️ {topic}</span>
                  <Tag className="ml-2 rounded-full">
                    {questions.length} câu
                  </Tag>
                </div>
              }
              extra={
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenAddToTopic(topic, questions)}
                  className="text-blue-600 border-blue-200 bg-blue-50"
                >
                  Thêm câu hỏi vào đây
                </Button>
              }
            >
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div
                    key={q.idSpeakingQuestion}
                    className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 group hover:bg-white hover:border-blue-200 transition-colors"
                  >
                    {/* Số thứ tự */}
                    <div className="flex flex-col items-center justify-center w-10 min-w-[40px] text-gray-400 font-bold text-lg">
                      {idx + 1}
                    </div>

                    {/* Nội dung câu hỏi */}
                    <div className="flex-1">
                      <p className="text-gray-800 font-medium text-base mb-2">
                        {q.prompt}
                      </p>
                      {q.subPrompts && q.subPrompts.length > 0 && (
                        <div className="pl-4 border-l-2 border-gray-300">
                          {q.subPrompts.map((sub, sIdx) => (
                            <p
                              key={sIdx}
                              className="text-sm text-gray-600 mb-1"
                            >
                              • {sub}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Thông tin thời gian */}
                    <div className="flex flex-col gap-2 text-xs text-gray-500 w-32 border-l pl-4 justify-center">
                      <div
                        className="flex items-center gap-1"
                        title="Thời gian chuẩn bị"
                      >
                        <SettingOutlined /> Prep:{" "}
                        <b className="text-gray-700">{q.preparationTime}s</b>
                      </div>
                      <div
                        className="flex items-center gap-1"
                        title="Thời gian nói"
                      >
                        <ClockCircleOutlined /> Speak:{" "}
                        <b className="text-gray-700">{q.speakingTime}s</b>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 justify-center border-l pl-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Button
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleOpenEditQuestion(q)}
                      />
                      <Popconfirm
                        title="Xóa câu hỏi này?"
                        description="Hành động này không thể hoàn tác"
                        onConfirm={() => handleDelete(q.idSpeakingQuestion)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okType="danger"
                      >
                        <Button icon={<DeleteOutlined />} size="small" danger />
                      </Popconfirm>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* --- MODAL CHUNG CHO CREATE / ADD / EDIT --- */}
      <Modal
        title={
          modalMode === "CREATE_TOPIC"
            ? "Tạo Chủ Đề Mới & Câu Hỏi"
            : modalMode === "ADD_TO_TOPIC"
            ? `Thêm câu hỏi vào: ${topicName}`
            : "Chỉnh sửa câu hỏi"
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSubmit}
        width={800}
        okText="Lưu Dữ Liệu"
        okButtonProps={{ className: "bg-slate-900" }}
        maskClosable={false}
      >
        <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {/* 1. Phần Topic (Chung) */}
          <div className="bg-blue-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-blue-900 mb-1">
                Tên Chủ Đề (Topic)
              </label>
              <Input
                value={
                  modalMode === "EDIT_QUESTION"
                    ? singleQuestionData.topic
                    : topicName
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (modalMode === "EDIT_QUESTION")
                    setSingleQuestionData({
                      ...singleQuestionData,
                      topic: val,
                    });
                  else setTopicName(val);
                }}
                disabled={modalMode === "ADD_TO_TOPIC"}
                placeholder="Ví dụ: Hometown, Work..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">
                TG Chuẩn bị chung (s)
              </label>
              <Input
                type="number"
                value={
                  modalMode === "EDIT_QUESTION"
                    ? singleQuestionData.preparationTime
                    : prepTime
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (modalMode === "EDIT_QUESTION")
                    setSingleQuestionData({
                      ...singleQuestionData,
                      preparationTime: val,
                    });
                  else setPrepTime(val);
                }}
                placeholder="0"
              />
            </div>
          </div>

          <Divider orientation="left" className="!m-0 text-gray-500 text-xs">
            Danh sách câu hỏi
          </Divider>

          {/* 2. MODE: EDIT (Form sửa 1 câu) */}
          {modalMode === "EDIT_QUESTION" && (
            <div className="space-y-4 border p-4 rounded-lg bg-white">
              <div>
                <label className="font-semibold text-sm">
                  Câu hỏi chính (Prompt)
                </label>
                <TextArea
                  rows={2}
                  value={singleQuestionData.prompt}
                  onChange={(e) =>
                    setSingleQuestionData({
                      ...singleQuestionData,
                      prompt: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="font-semibold text-sm">Sub-prompts</label>
                {singleQuestionData.subPrompts.map((sub, i) => (
                  <div key={i} className="flex gap-2 mt-2">
                    <Input
                      value={sub}
                      onChange={(e) => {
                        const newSubs = [...singleQuestionData.subPrompts];
                        newSubs[i] = e.target.value;
                        setSingleQuestionData({
                          ...singleQuestionData,
                          subPrompts: newSubs,
                        });
                      }}
                    />
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        const newSubs = singleQuestionData.subPrompts.filter(
                          (_, idx) => idx !== i
                        );
                        setSingleQuestionData({
                          ...singleQuestionData,
                          subPrompts: newSubs,
                        });
                      }}
                    />
                  </div>
                ))}
                <Button
                  type="dashed"
                  size="small"
                  className="mt-2"
                  onClick={() => {
                    setSingleQuestionData({
                      ...singleQuestionData,
                      subPrompts: [...singleQuestionData.subPrompts, ""],
                    });
                  }}
                >
                  + Thêm ý
                </Button>
              </div>
              <div>
                <label className="font-semibold text-sm">
                  Thời gian nói (giây)
                </label>
                <Input
                  type="number"
                  className="w-32 block"
                  value={singleQuestionData.speakingTime}
                  onChange={(e) =>
                    setSingleQuestionData({
                      ...singleQuestionData,
                      speakingTime: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* 3. MODE: CREATE / ADD (Form mảng câu hỏi) */}
          {(modalMode === "CREATE_TOPIC" || modalMode === "ADD_TO_TOPIC") && (
            <div className="space-y-6">
              {newQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="border p-4 rounded-lg bg-gray-50 relative group"
                >
                  {newQuestions.length > 1 && (
                    <Button
                      className="absolute top-2 right-2 opacity-50 hover:opacity-100"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeNewQuestionRow(idx)}
                    />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                      <label className="text-xs font-bold text-gray-500 uppercase">
                        Câu hỏi {idx + 1}
                      </label>
                      <TextArea
                        rows={2}
                        className="mt-1 bg-white"
                        placeholder="Nhập nội dung câu hỏi..."
                        value={q.prompt}
                        onChange={(e) =>
                          handleNewQuestionChange(idx, "prompt", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">
                        TG Nói (s)
                      </label>
                      <Input
                        type="number"
                        className="mt-1 bg-white"
                        value={q.speakingTime}
                        onChange={(e) =>
                          handleNewQuestionChange(
                            idx,
                            "speakingTime",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="text-xs font-bold text-gray-400 uppercase">
                      Gợi ý trả lời
                    </label>
                    <div className="space-y-2 mt-1 pl-2 border-l-2 border-gray-200">
                      {q.subPrompts.map((sub, sIdx) => (
                        <div key={sIdx} className="flex gap-2">
                          <Input
                            size="small"
                            placeholder="Sub-prompt..."
                            value={sub}
                            onChange={(e) =>
                              handleSubPromptChange(idx, sIdx, e.target.value)
                            }
                          />
                          <Button
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => removeSubPrompt(idx, sIdx)}
                          />
                        </div>
                      ))}
                      <Button
                        type="dashed"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => addSubPrompt(idx)}
                      >
                        Thêm ý
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="dashed"
                block
                size="large"
                icon={<PlusOutlined />}
                onClick={addNewQuestionRow}
              >
                Thêm câu hỏi khác vào Topic này
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SpeakingPartPanel;
