import React, { useState, useMemo } from "react";
import { Input, Button, message, InputNumber } from "antd";
import {
  UploadOutlined,
  AudioOutlined,
  PictureOutlined,
  CheckCircleFilled,
  RocketFilled,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { createTestAPI } from "@/services/apiTest";
import { useAuth } from "@/context/authContext";
import { useNavigate } from "react-router-dom";
import RichTextEditor from "@/components/ui/RichTextEditor";

// ---------- Tokens (match MagicPath IELTS Create Test) ----------
const COLORS = {
  indigo: { solid: "#6366f1", dark: "#4338ca", darker: "#312e81", light: "#eef2ff" },
  cyan: { solid: "#06b6d4", dark: "#0891b2", light: "#ecfeff" },
  rose: { solid: "#fb7185", dark: "#e11d48", light: "#fff1f2" },
  purple: { solid: "#a855f7", dark: "#7e22ce", light: "#f3e8ff" },
  slate: { base: "#64748b", ink: "#1e1b4b", soft: "#e6e6ed", panel: "#f1f1f6" },
};

const TEST_TYPES = [
  { value: "LISTENING", label: "Listening", icon: "🎧", desc: "4 sections · cần file audio", color: "cyan" },
  { value: "READING", label: "Reading", icon: "📖", desc: "3 passages · 40 câu hỏi", color: "indigo" },
  { value: "WRITING", label: "Writing", icon: "✍️", desc: "Task 1 (biểu đồ) + Task 2 (luận)", color: "rose" },
  { value: "SPEAKING", label: "Speaking", icon: "🗣️", desc: "3 parts · topic & câu hỏi", color: "purple" },
];

const LEVELS = [
  { value: "Low", label: "Low", color: "#10b981" },
  { value: "Mid", label: "Mid", color: "#f59e0b" },
  { value: "High", label: "High", color: "#ef4444" },
  { value: "Great", label: "Great", color: "#7e22ce" },
];

const STEPS = [
  { n: 1, label: "Chọn kỹ năng" },
  { n: 2, label: "Thông tin đề" },
  { n: 3, label: "Hoàn tất" },
];

// ---------- Helper: chunky button class ----------
const chunkyBtn = (tone, size = "md", disabled = false) => {
  const sizes = {
    sm: "!h-9 !px-4 !text-xs",
    md: "!h-11 !px-5 !text-sm",
    lg: "!h-12 !px-7 !text-base",
  };
  const tones = {
    indigo: `!bg-[#6366f1] !text-white !border-2 !border-[#6366f1] !shadow-[0_4px_0_#4338ca] ${
      disabled ? "" : "hover:!brightness-110 active:!translate-y-[2px] active:!shadow-[0_2px_0_#4338ca]"
    }`,
    ghost: `!bg-white !text-[#6366f1] !border-2 !border-[#e6e6ed] !shadow-[0_2px_0_#e6e6ed] ${
      disabled ? "" : "hover:!border-[#6366f1] active:!translate-y-[1px]"
    }`,
    success: `!bg-[#10b981] !text-white !border-2 !border-[#10b981] !shadow-[0_4px_0_#047857] hover:!brightness-110 active:!translate-y-[2px] active:!shadow-[0_2px_0_#047857]`,
  };
  return `!rounded-2xl !font-extrabold !uppercase !tracking-wide !transition-all !whitespace-nowrap ${
    sizes[size]
  } ${tones[tone]} ${disabled ? "!opacity-40 !cursor-not-allowed" : ""}`;
};

const cardCls = "bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed]";
const inputCls =
  "!rounded-2xl !border-2 !border-[#e6e6ed] hover:!border-[#6366f1]/40 focus:!border-[#6366f1] focus:!shadow-[0_0_0_4px_rgba(99,102,241,0.15)] !font-semibold !text-[#1e1b4b]";

// ---------- Page ----------
const TestCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
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

  // Auto-lock numberQuestion when WRITING/SPEAKING
  React.useEffect(() => {
    if (formData.testType === "WRITING") handleChange("numberQuestion", 2);
    else if (formData.testType === "SPEAKING") handleChange("numberQuestion", 3);
  }, [formData.testType]);

  const selectedType = useMemo(
    () => TEST_TYPES.find((t) => t.value === formData.testType),
    [formData.testType]
  );

  const needsAudio = formData.testType === "LISTENING";
  const needsQuestionCount = formData.testType === "READING" || formData.testType === "LISTENING";
  const isFixedCount = formData.testType === "WRITING" || formData.testType === "SPEAKING";

  const canStep2 = formData.testType !== "";
  const canStep3 =
    formData.title.trim() !== "" &&
    Number(formData.duration) > 0 &&
    Number(formData.numberQuestion) > 0 &&
    formData.level !== "";

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await createTestAPI(formData);
      if (res?.data) {
        message.success("Test created successfully!");
        setCreatedTest(res.data);
        setStep(3);
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

  const handleCreateAnother = () => {
    setCreatedTest(null);
    setStep(1);
    setFormData((p) => ({
      ...p,
      testType: "",
      title: "",
      description: "",
      duration: "",
      numberQuestion: "",
      level: "",
      img: null,
      audioUrl: null,
    }));
  };

  // ---------- Renders ----------
  const renderStepper = () => (
    <div className={`${cardCls} p-4`}>
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const active = step >= s.n;
          return (
            <React.Fragment key={s.n}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm transition-all ${
                    active
                      ? "bg-[#6366f1] text-white shadow-[0_3px_0_#4338ca]"
                      : "bg-white text-[#94a3b8] border-2 border-[#e6e6ed]"
                  }`}
                >
                  {step > s.n ? <CheckOutlined /> : s.n}
                </div>
                <span
                  className={`text-xs font-extrabold uppercase tracking-wide hidden sm:block ${
                    active ? "text-[#4338ca]" : "text-[#94a3b8]"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 rounded-full ${
                    step > s.n ? "bg-[#6366f1]" : "bg-[#e6e6ed]"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className={`${cardCls} p-6 space-y-4`}>
      <div>
        <h2 className="text-lg font-black text-[#1e1b4b]">Bạn muốn tạo đề kỹ năng nào?</h2>
        <p className="text-sm text-[#64748b] font-medium mt-1">
          Chọn 1 kỹ năng để bắt đầu. Bạn có thể quay lại bước này bất cứ lúc nào.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TEST_TYPES.map((s) => {
          const sel = formData.testType === s.value;
          const c = COLORS[s.color];
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => handleChange("testType", s.value)}
              className={`flex items-center gap-3 p-4 rounded-3xl border-2 text-left transition-all ${
                sel
                  ? `border-transparent !bg-[${c.solid}] text-white shadow-[0_4px_0_${c.dark}]`
                  : "border-[#e6e6ed] hover:border-[#6366f1]/40 bg-white"
              }`}
              style={
                sel
                  ? { backgroundColor: c.solid, boxShadow: `0 4px 0 ${c.dark}` }
                  : undefined
              }
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-none ${
                  sel ? "bg-white/20" : "bg-[#f8f8fc]"
                }`}
              >
                {s.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`font-black ${sel ? "text-white" : "text-[#1e1b4b]"}`}>
                  {s.label}
                </div>
                <div
                  className={`text-xs font-medium ${
                    sel ? "text-white/90" : "text-[#64748b]"
                  }`}
                >
                  {s.desc}
                </div>
              </div>
              {sel && <span className="ml-auto text-white text-lg">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderStep2 = () => {
    if (!selectedType) return null;
    const c = COLORS[selectedType.color];
    return (
      <div className={`${cardCls} p-6 space-y-5`}>
        {/* Skill banner */}
        <div
          className="flex items-center gap-3 p-4 rounded-2xl text-white"
          style={{ backgroundColor: c.solid, boxShadow: `0 4px 0 ${c.dark}` }}
        >
          <span className="text-2xl">{selectedType.icon}</span>
          <div>
            <div className="font-black">Đề {selectedType.label}</div>
            <div className="text-xs font-semibold opacity-90">{selectedType.desc}</div>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] mb-1.5">
            Tiêu đề đề thi <span className="text-[#ef4444]">*</span>
          </label>
          <Input
            size="large"
            placeholder="VD: Cambridge IELTS 17 — Test 3"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] mb-1.5">
            Mô tả
          </label>
          <RichTextEditor
            value={formData.description}
            onChange={(html) => handleChange("description", html)}
            placeholder="Mô tả ngắn về đề thi..."
            minHeight="160px"
          />
        </div>

        {/* Duration + num questions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] mb-1.5">
              Thời lượng (phút) <span className="text-[#ef4444]">*</span>
            </label>
            <InputNumber
              size="large"
              min={1}
              max={300}
              value={formData.duration || undefined}
              onChange={(v) => handleChange("duration", v)}
              placeholder="60"
              className={`!w-full ${inputCls}`}
            />
          </div>
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] mb-1.5">
              {needsQuestionCount
                ? "Số câu hỏi"
                : formData.testType === "WRITING"
                ? "Số task"
                : "Số part"}{" "}
              <span className="text-[#ef4444]">*</span>
            </label>
            {isFixedCount ? (
              <Input
                size="large"
                disabled
                value={formData.testType === "WRITING" ? "2 (cố định)" : "3 (cố định)"}
                className={`${inputCls} !bg-[#f8f8fc] !text-[#94a3b8] !cursor-not-allowed`}
              />
            ) : (
              <InputNumber
                size="large"
                min={1}
                max={200}
                value={formData.numberQuestion || undefined}
                onChange={(v) => handleChange("numberQuestion", v)}
                placeholder="40"
                className={`!w-full ${inputCls}`}
              />
            )}
          </div>
        </div>

        {/* Level */}
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] mb-1.5">
            Độ khó <span className="text-[#ef4444]">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {LEVELS.map((l) => {
              const active = formData.level === l.value;
              return (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => handleChange("level", l.value)}
                  className={`py-2.5 rounded-2xl text-sm font-bold transition-all ${
                    active
                      ? "bg-[#6366f1] text-white shadow-[0_2px_0_#4338ca]"
                      : "bg-[#f1f1f6] text-[#64748b] hover:bg-[#e6e6ed]"
                  }`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Media — custom dropzones, matched layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Image dropzone */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] mb-1.5">
              Ảnh minh hoạ
            </label>
            <label
              className={`group flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed cursor-pointer transition-all h-[72px] ${
                formData.img
                  ? "border-[#6366f1] bg-[#eef2ff]"
                  : "border-[#e6e6ed] bg-[#f8f8fc] hover:border-[#6366f1] hover:bg-[#eef2ff]"
              }`}
            >
              {formData.img ? (
                <>
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-none bg-white border border-[#e6e6ed]">
                    <img
                      src={URL.createObjectURL(formData.img)}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-extrabold text-[#4338ca] truncate">
                      {formData.img.name}
                    </div>
                    <div className="text-[11px] font-semibold text-[#64748b]">
                      {(formData.img.size / 1024).toFixed(0)} KB · Nhấn để thay
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleFileChange("img", null);
                    }}
                    className="w-8 h-8 rounded-xl bg-white border-2 border-[#e6e6ed] text-[#94a3b8] hover:text-[#ef4444] hover:border-[#ef4444] flex-none"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-[#eef2ff] group-hover:bg-white flex items-center justify-center text-xl flex-none">
                    🖼️
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-extrabold text-[#1e1b4b]">
                      Tải ảnh lên
                    </div>
                    <div className="text-[11px] font-semibold text-[#64748b]">
                      PNG, JPG · tối đa 5MB
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-white border-2 border-[#e6e6ed] flex items-center justify-center text-[#6366f1] flex-none">
                    <PictureOutlined />
                  </div>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileChange("img", f);
                }}
              />
            </label>
          </div>

          {/* Audio dropzone (LISTENING only) */}
          {needsAudio && (
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] mb-1.5">
                File audio (bắt buộc) <span className="text-[#ef4444]">*</span>
              </label>
              <label
                className={`group flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed cursor-pointer transition-all h-[72px] ${
                  formData.audioUrl
                    ? "border-[#06b6d4] bg-[#ecfeff]"
                    : "border-[#06b6d4] bg-[#ecfeff] hover:bg-[#cffafe]"
                }`}
              >
                {formData.audioUrl ? (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-[#cffafe] flex items-center justify-center text-xl flex-none">
                      🎵
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-extrabold text-[#0e7490] truncate">
                        {formData.audioUrl.name}
                      </div>
                      <div className="text-[11px] font-semibold text-[#0891b2]">
                        {(formData.audioUrl.size / 1024 / 1024).toFixed(2)} MB · Nhấn để thay
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleFileChange("audioUrl", null);
                      }}
                      className="w-8 h-8 rounded-xl bg-white border-2 border-[#06b6d4] text-[#0891b2] hover:text-[#ef4444] hover:border-[#ef4444] flex-none"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-[#cffafe] group-hover:bg-white flex items-center justify-center text-xl flex-none">
                      🎵
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-extrabold text-[#0e7490]">
                        Tải audio (.mp3)
                      </div>
                      <div className="text-[11px] font-semibold text-[#0891b2]">
                        MP3, WAV · tối đa 50MB
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-white border-2 border-[#06b6d4] flex items-center justify-center text-[#06b6d4] flex-none">
                      <AudioOutlined />
                    </div>
                  </>
                )}
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileChange("audioUrl", f);
                  }}
                />
              </label>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className={`${cardCls} p-10 text-center`}>
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-black text-[#1e1b4b] mb-2">
        Đề <span className="text-[#6366f1]">{formData.title || "mới"}</span> đã được tạo!
      </h2>
      <p className="text-[#64748b] font-medium mb-6">
        Bây giờ bạn có thể bắt đầu soạn các phần (parts) cho đề thi{" "}
        {selectedType?.label}.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          type="primary"
          size="large"
          icon={<ArrowRightOutlined />}
          onClick={() =>
            createdTest &&
            navigate(`/teacher/testManager/testEdit/${createdTest.idTest}`, {
              state: { exam: createdTest },
            })
          }
          className={chunkyBtn("indigo", "lg")}
        >
          Chuyển đến soạn nội dung →
        </Button>
        <Button
          size="large"
          onClick={handleCreateAnother}
          className={chunkyBtn("ghost", "lg")}
        >
          Tạo đề khác
        </Button>
      </div>
    </div>
  );

  const renderFooter = () => {
    if (step === 3) return null;
    const isStep1 = step === 1;
    return (
      <div className="flex items-center justify-between">
        <Button
          size="large"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          icon={<ArrowLeftOutlined />}
          className={chunkyBtn("ghost", "md", step === 1)}
        >
          ← Quay lại
        </Button>
        {isStep1 ? (
          <Button
            type="primary"
            size="large"
            disabled={!canStep2}
            onClick={() => setStep(2)}
            className={chunkyBtn("indigo", "md", !canStep2)}
          >
            Tiếp tục →
          </Button>
        ) : (
          <Button
            type="primary"
            size="large"
            loading={loading}
            disabled={!canStep3}
            onClick={handleSubmit}
            className={chunkyBtn("indigo", "md", !canStep3)}
          >
            Tạo đề →
          </Button>
        )}
      </div>
    );
  };

  // Step 3 success screen (created)
  if (step === 3 && createdTest) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#eef2ff] via-[#f1f1f6] to-[#eff6ff] py-6 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl space-y-5">
          <div className={`${cardCls} p-6`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center text-2xl shadow-[0_4px_0_#4338ca]">
                <RocketFilled className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-[#1e1b4b]">Tạo đề IELTS mới</h1>
                <p className="text-sm text-[#64748b] font-medium">
                  Chọn kỹ năng, nhập thông tin, rồi soạn nội dung
                </p>
              </div>
            </div>
          </div>
          {renderStepper()}
          {renderStep3()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#eef2ff] via-[#f1f1f6] to-[#eff6ff] py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        {/* Header */}
        <div className={`${cardCls} p-6`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center text-2xl shadow-[0_4px_0_#4338ca]">
              <RocketFilled className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1e1b4b]">Tạo đề IELTS mới</h1>
              <p className="text-sm text-[#64748b] font-medium">
                Chọn kỹ năng, nhập thông tin, rồi soạn nội dung
              </p>
            </div>
          </div>
        </div>

        {renderStepper()}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}

        {renderFooter()}
      </div>
    </div>
  );
};

export default TestCreate;
