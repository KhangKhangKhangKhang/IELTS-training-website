import React, { useState, useEffect } from "react";
import {
  InputNumber,
  Button,
  message,
  Spin,
  Select,
  Input,
  Upload,
  Tag,
  Form,
} from "antd";
import {
  SaveOutlined,
  UploadOutlined,
  FileTextOutlined,
  SoundOutlined,
  EditOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { updateTestInfoAPI } from "@/services/apiTest";
import { useNavigate } from "react-router";

const { TextArea: AntTextArea } = Input;
const { Option } = Select;

const TestInfoEditor = ({ exam, onUpdate, defaultEditing = false, onClose }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(defaultEditing);
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();

  // State to hold the actual File object
  const [newAudioFile, setNewAudioFile] = useState(null);

  // --- FIX CACHE: State to hold audio version ---
  const [audioVersion, setAudioVersion] = useState(Date.now());

  // Get raw URL
  const rawAudioSrc = exam?.audio || exam?.audioUrl;

  // Reset version when switching tests
  useEffect(() => {
    if (exam) {
      setAudioVersion(Date.now()); // Reset cache buster when loading new test
      form.setFieldsValue({
        title: exam.title,
        description: exam.description,
        level: exam.level || "EASY",
        duration: exam.duration,
        numberQuestion: exam.numberQuestion,
      });
    }
  }, [exam, form]);

  // Append timestamp to URL to bypass cache
  const audioSrcWithCache = rawAudioSrc
    ? `${rawAudioSrc}?v=${audioVersion}`
    : null;

  const getMaxQuestions = () => {
    if (exam?.testType === "WRITING" || exam?.testType === "SPEAKING") return 2;
    return 40;
  };

  const onBeforeUpload = (file) => {
    setNewAudioFile(file);
    return false;
  };

  const onRemoveFile = () => {
    setNewAudioFile(null);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (!exam?.idTest || !exam?.idUser)
        return message.error("Missing information");

      setLoading(true);

      const formData = new FormData();
      formData.append("idUser", exam.idUser);
      formData.append("testType", exam.testType);
      formData.append("title", values.title);
      formData.append("description", values.description || "");
      formData.append("level", values.level);
      formData.append("duration", values.duration);
      formData.append("numberQuestion", values.numberQuestion);

      if (newAudioFile) {
        formData.append("audioUrl", newAudioFile);
      }

      const res = await updateTestInfoAPI(exam.idTest, formData);

      if (res?.data) {
        message.success("Updated successfully!");
        setNewAudioFile(null);
        setIsEditing(false);

        // --- FIX CACHE: Update timestamp immediately ---
        setAudioVersion(Date.now());

        if (onUpdate) onUpdate(res.data);
      } else {
        message.error("Update failed.");
      }
    } catch (error) {
      console.error(error);
      message.error("Save error.");
    } finally {
      setLoading(false);
    }
  };

  if (!exam) return <Spin className="block mx-auto my-4" />;

  // --- COMPACT VIEW ---
  if (!isEditing) {
    return (
      <div className="rounded-[24px] border-2 border-[#e6e6ed] bg-white shadow-[0_2px_0_#e6e6ed] p-4 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] mb-1">
              Test settings
            </div>
            <h3 className="text-xl font-black text-[#1e1b4b] truncate" title={exam.title}>
              {exam.title}
            </h3>
            <div className="flex items-center gap-2 flex-wrap mt-2 text-xs font-bold text-[#64748b]">
              <Tag color="blue">{exam.testType}</Tag>
              <span>{exam.level || "EASY"}</span>
              <span>{exam.duration} min</span>
              <span>{exam.numberQuestion} questions</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => navigate("/teacher/testManager")}>Back to manager</Button>
            <Button type="primary" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
              Edit settings
            </Button>
          </div>
        </div>

        {exam.testType === "LISTENING" && rawAudioSrc && (
          <div className="rounded-2xl border-2 border-[#cffafe] bg-[#ecfeff] p-3 flex items-center gap-3">
            <SoundOutlined className="text-[#0891b2]" />
            <audio
              key={audioVersion}
              controls
              className="h-9 w-full"
              src={audioSrcWithCache}
              controlsList="nodownload"
            />
          </div>
        )}
      </div>
    );
  }

  // --- EDIT FORM ---
  return (
    <div className="overflow-hidden rounded-[28px] border-2 border-[#c7d2fe] bg-white shadow-[0_4px_0_#4338ca] animate-fade-in">
      <div className="bg-gradient-to-r from-[#eef2ff] via-white to-[#ecfeff] px-6 py-5 border-b-2 border-[#e6e6ed] flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#6366f1]">
            Settings workspace
          </div>
          <h3 className="text-2xl font-black tracking-tight text-[#1e1b4b] mt-1">
            Edit test details
          </h3>
          <p className="text-xs font-semibold text-[#64748b] mt-1">
            Keep timing, level, and question count aligned with the IELTS test setup.
          </p>
        </div>
        <Button type="text" icon={<CloseOutlined />} onClick={() => (onClose ? onClose() : setIsEditing(false))}>
          Close
        </Button>
      </div>

      <Form form={form} layout="vertical" initialValues={{ ...exam }} className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          <div className="space-y-4">
            <div className="rounded-3xl border-2 border-[#e6e6ed] bg-[#fafafc] p-4">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748b] mb-3">
                Core information
              </div>
              <Form.Item name="title" label="Test title" rules={[{ required: true }]}>
                <Input size="large" prefix={<FileTextOutlined />} className="rounded-xl" />
              </Form.Item>
              <Form.Item name="description" label="Description" className="mb-0">
                <AntTextArea rows={5} showCount maxLength={500} className="rounded-xl" />
              </Form.Item>
            </div>

            {exam.testType === "LISTENING" && (
              <div className="rounded-3xl border-2 border-[#cffafe] bg-[#ecfeff] p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#0e7490]">
                      Listening audio
                    </div>
                    <div className="text-xs font-semibold text-[#64748b] mt-0.5">
                      Upload or replace the audio used by this test.
                    </div>
                  </div>
                  {newAudioFile && <Tag color="green">New file selected</Tag>}
                </div>
                {rawAudioSrc && (
                  <audio
                    key={audioVersion}
                    controls
                    className="h-9 w-full mb-3"
                    src={audioSrcWithCache}
                    controlsList="nodownload"
                  />
                )}
                <Upload
                  beforeUpload={onBeforeUpload}
                  onRemove={onRemoveFile}
                  maxCount={1}
                  accept="audio/*"
                  fileList={newAudioFile ? [newAudioFile] : []}
                >
                  <Button icon={<UploadOutlined />}>
                    {newAudioFile ? "Change file" : rawAudioSrc ? "Replace current audio" : "Upload audio"}
                  </Button>
                </Upload>
              </div>
            )}
          </div>

          <aside className="rounded-3xl border-2 border-[#c7d2fe] bg-[#eef2ff] p-4 h-fit sticky top-4">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#4338ca] mb-3">
              Exam controls
            </div>
            <div className="space-y-3">
              <Form.Item name="level" label="Difficulty">
                <Select className="w-full">
                  <Option value="EASY">Easy</Option>
                  <Option value="MEDIUM">Medium</Option>
                  <Option value="HARD">Hard</Option>
                </Select>
              </Form.Item>
              <Form.Item name="duration" label="Duration (min)">
                <InputNumber min={1} className="w-full" />
              </Form.Item>
              <Form.Item name="numberQuestion" label="Number of questions">
                <InputNumber min={1} max={getMaxQuestions()} className="w-full" />
              </Form.Item>
            </div>
            <div className="mt-4 rounded-2xl bg-white/80 border border-[#c7d2fe] p-3 text-xs font-semibold text-[#4338ca] leading-relaxed">
              Max questions for this test type: <b>{getMaxQuestions()}</b>
            </div>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={loading}
              block
              size="large"
              className="mt-4 bg-[#6366f1] hover:bg-[#4f46e5] border-[#4338ca] shadow-[0_3px_0_#312e81] font-black"
            >
              Save settings
            </Button>
          </aside>
        </div>
      </Form>
    </div>
  );
};

export default TestInfoEditor;
