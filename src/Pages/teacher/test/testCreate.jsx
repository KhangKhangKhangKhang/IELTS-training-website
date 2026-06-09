import React, { useState, useMemo } from "react";
import { Input, Select, Upload, Button, message, InputNumber } from "antd";
import { UploadOutlined, AudioOutlined, PictureOutlined, CheckCircleFilled, RocketFilled, ArrowRightOutlined } from "@ant-design/icons";
import { createTestAPI } from "@/services/apiTest";
import { useAuth } from "@/context/authContext";
import { useNavigate } from "react-router-dom";
import RichTextEditor from "@/components/ui/RichTextEditor";

const { Option } = Select;

const TEST_TYPES = [
  { value: "LISTENING", label: "Listening", icon: "🎧", tone: "from-[#06b6d4] to-[#0891b2]", ring: "ring-[#06b6d4]/40", bg: "bg-[#ecfeff]" },
  { value: "READING", label: "Reading", icon: "📖", tone: "from-[#6366f1] to-[#4338ca]", ring: "ring-[#6366f1]/40", bg: "bg-[#eef2ff]" },
  { value: "WRITING", label: "Writing", icon: "✍️", tone: "from-[#a855f7] to-[#7e22ce]", ring: "ring-[#a855f7]/40", bg: "bg-[#f3e8ff]" },
  { value: "SPEAKING", label: "Speaking", icon: "🗣️", tone: "from-[#fb7185] to-[#e11d48]", ring: "ring-[#fb7185]/40", bg: "bg-[#fff1f2]" },
];

const LEVELS = [
  { value: "Low", label: "Easy", color: "text-[#10b981]", dot: "bg-[#10b981]" },
  { value: "Mid", label: "Medium", color: "text-[#f59e0b]", dot: "bg-[#f59e0b]" },
  { value: "High", label: "Hard", color: "text-[#ef4444]", dot: "bg-[#ef4444]" },
];

const TestCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [createdTest, setCreatedTest] = useState(null);

  const [formData, setFormData] = useState({
    idUser: user?.idUser || "",
    testType: "",
    title: "",
    description: "",
    duration: "",
    numberQuestion: "",
    level: "",
    img: null,
    audioUrl: null,
  });

  const handleChange = (key, value) => setFormData((p) => ({ ...p, [key]: value }));
  const handleFileChange = (key, file) => setFormData((p) => ({ ...p, [key]: file }));

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await createTestAPI(formData);
      if (res?.data) {
        message.success("Test created successfully!");
        setCreatedTest(res.data);
      } else {
        message.error("Test creation failed");
      }
    } catch (err) {
      console.error(err);
      message.error("Error creating test");
    } finally {
      setLoading(false);
    }
  };

  const selectedType = useMemo(
    () => TEST_TYPES.find((t) => t.value === formData.testType),
    [formData.testType]
  );

  if (createdTest) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#f1f1f6] via-[#eef2ff] to-[#f1f1f6] py-6 px-4">
        <div className="mx-auto w-full max-w-6xl">
          <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-8 max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#10b981] to-[#047857] flex items-center justify-center shadow-[0_6px_0_#065f46] mb-4">
              <CheckCircleFilled className="text-white text-4xl" />
            </div>
            <h2 className="text-2xl font-black text-[#1e1b4b] mb-1">
              Test <span className="text-[#6366f1]">{createdTest.title}</span> was created!
            </h2>
            <p className="text-sm text-[#64748b] font-medium mb-6">
              You can now add parts and questions to this test.
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={() => navigate(`/teacher/testManager/testEdit/${createdTest.idTest}`, { state: { exam: createdTest } })}
                className="!h-11 !rounded-xl !font-extrabold !bg-gradient-to-r !from-[#6366f1] !to-[#4338ca] !border-none !shadow-[0_4px_0_#312e81]"
              >
                Continue to add parts
              </Button>
              <Button size="large" onClick={() => setCreatedTest(null)} className="!h-11 !rounded-xl !font-extrabold">
                Create another test
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f1f1f6] via-[#eef2ff] to-[#f1f1f6] py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center text-2xl shadow-[0_4px_0_#4338ca]">
              <RocketFilled className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1e1b4b]">Create New Test</h1>
              <p className="text-sm text-[#64748b] font-medium">Set up basic info before adding questions and parts</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
          <div className="space-y-5">
            <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-5">
              <h3 className="text-base font-black text-[#1e1b4b] mb-3">01 · Choose test type</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TEST_TYPES.map((t) => {
                  const active = formData.testType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => handleChange("testType", t.value)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        active ? `border-transparent ring-2 ${t.ring} ${t.bg}` : "border-[#e6e6ed] hover:border-[#c7d2fe] bg-white"
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.tone} text-white text-xl flex items-center justify-center mb-3`}>
                        {t.icon}
                      </div>
                      <div className="font-extrabold text-[#1e1b4b] text-sm">{t.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-5 space-y-4">
              <h3 className="text-base font-black text-[#1e1b4b] mb-1">02 · Basic info</h3>
              <div>
                <label className="block text-xs font-extrabold text-[#1e1b4b] mb-1.5">Test title <span className="text-[#ef4444]">*</span></label>
                <Input size="large" placeholder="VD: Cambridge IELTS 18 - Test 2" value={formData.title} onChange={(e) => handleChange("title", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[#1e1b4b] mb-1.5">Description <span className="text-[#ef4444]">*</span></label>
                <RichTextEditor value={formData.description} onChange={(html) => handleChange("description", html)} placeholder="Short description..." minHeight="160px" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#1e1b4b] mb-1.5">Duration (min) <span className="text-[#ef4444]">*</span></label>
                  <InputNumber size="large" min={1} max={300} value={formData.duration || undefined} onChange={(v) => handleChange("duration", v)} className="w-full" style={{ width: "100%" }} />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-[#1e1b4b] mb-1.5">Number of questions <span className="text-[#ef4444]">*</span></label>
                  <InputNumber size="large" min={1} max={200} value={formData.numberQuestion || undefined} onChange={(v) => handleChange("numberQuestion", v)} className="w-full" style={{ width: "100%" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[#1e1b4b] mb-1.5">Difficulty <span className="text-[#ef4444]">*</span></label>
                <div className="grid grid-cols-3 gap-2">
                  {LEVELS.map((l) => {
                    const active = formData.level === l.value;
                    return (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => handleChange("level", l.value)}
                        className={`px-3 py-2.5 rounded-xl border-2 text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
                          active ? "border-[#6366f1] bg-[#eef2ff] text-[#4338ca]" : "border-[#e6e6ed] text-[#64748b] hover:border-[#c7d2fe] bg-white"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${l.dot}`} />
                        {l.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-5">
              <h3 className="text-base font-black text-[#1e1b4b] mb-3">03 · Media</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#1e1b4b] mb-1.5">Cover image</label>
                  <Upload
                    listType="picture-card"
                    maxCount={1}
                    beforeUpload={(file) => { handleFileChange("img", file); return false; }}
                    onRemove={() => handleFileChange("img", null)}
                    fileList={formData.img ? [{ uid: "-1", name: "img", status: "done", originFileObj: formData.img }] : []}
                  >
                    {!formData.img && <div className="text-[#64748b] text-xs"><PictureOutlined style={{ fontSize: 24 }} /></div>}
                  </Upload>
                </div>
                {formData.testType === "LISTENING" && (
                  <div>
                    <label className="block text-xs font-extrabold text-[#1e1b4b] mb-1.5">File audio <span className="text-[#ef4444]">*</span></label>
                    <Upload
                      maxCount={1}
                      beforeUpload={(file) => { handleFileChange("audioUrl", file); return false; }}
                      onRemove={() => handleFileChange("audioUrl", null)}
                      fileList={formData.audioUrl ? [{ uid: "-1", name: formData.audioUrl.name || "audio", status: "done" }] : []}
                    >
                      {!formData.audioUrl && <Button icon={<AudioOutlined />} size="large">Choose file</Button>}
                    </Upload>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-5">
              <Button
                type="primary"
                size="large"
                loading={loading}
                onClick={handleSubmit}
                block
                className="!h-12 !rounded-xl !font-extrabold !bg-gradient-to-r !from-[#6366f1] !to-[#4338ca] !border-none !shadow-[0_4px_0_#312e81]"
              >
                🚀 Create Test
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCreate;
