import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Modal,
  Upload,
  Button,
  Select,
  Input,
  Spin,
  message,
  Alert,
  Steps,
  Space,
  Tag,
  Divider,
} from "antd";
import {
  UploadOutlined,
  FilePdfOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  EditOutlined,
  SaveOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/context/authContext";
import {
  extractPdfExamAPI,
  getPdfExamSessionAPI,
  updatePdfExamSessionAPI,
  savePdfExamSessionAPI,
  deletePdfExamSessionAPI,
} from "@/services/apiPdfExam";

const { Dragger } = Upload;

const testTypeOptions = [
  { value: "LISTENING", label: "Listening" },
  { value: "READING", label: "Reading" },
  { value: "WRITING", label: "Writing" },
  { value: "SPEAKING", label: "Speaking" },
];

const levelOptions = [
  { value: "Low", label: "Low" },
  { value: "Mid", label: "Mid" },
  { value: "High", label: "High" },
  { value: "Great", label: "Great" },
];

const PdfImportModal = ({ visible, onClose, idTest, testType, exam, onImportSuccess }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0); // 0: upload, 1: review
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [selectedTestType, setSelectedTestType] = useState(testType || "READING");
  const [selectedLevel, setSelectedLevel] = useState(exam?.level || "Mid");
  const [title, setTitle] = useState(exam?.title || "");
  const [idSession, setIdSession] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [warnings, setWarnings] = useState([]);
  const [status, setStatus] = useState("");
  const [rawPdfUrl, setRawPdfUrl] = useState("");
  const [editData, setEditData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const resetState = () => {
    setCurrentStep(0);
    setUploading(false);
    setSaving(false);
    setFile(null);
    setIdSession(null);
    setExtractedData(null);
    setConfidence(0);
    setWarnings([]);
    setStatus("");
    setRawPdfUrl("");
    setEditData(null);
    setIsEditing(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const beforeUpload = (uploadedFile) => {
    if (uploadedFile.type !== "application/pdf") {
      message.error("Only PDF files are accepted!");
      return false;
    }
    if (uploadedFile.size > 20 * 1024 * 1024) {
      message.error("PDF file must be smaller than 20MB!");
      return false;
    }
    setFile(uploadedFile);
    return false;
  };

  const handleExtract = async () => {
    if (!file) {
      message.warning("Please choose a PDF file!");
      return;
    }

    try {
      setUploading(true);
      const result = await extractPdfExamAPI({
        file,
        testType: selectedTestType,
        title: title || undefined,
        level: selectedLevel || undefined,
      });

      setIdSession(result.idSession);
      setExtractedData(result.rawData);
      setConfidence(result.confidence);
      setWarnings(result.warnings || []);
      setStatus(result.status);
      setRawPdfUrl(result.rawPdfUrl || "");
      setEditData(result.rawData);
      setCurrentStep(1);
      message.success("PDF extracted successfully!");
    } catch (error) {
      console.error("Extract error:", error);
      message.error(error?.response?.data?.message || "PDF extraction failed!");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSession = async () => {
    if (!idSession) return;

    try {
      await updatePdfExamSessionAPI(idSession, {
        data: editData,
        status: "REVIEWED",
      });
      setStatus("REVIEWED");
      message.success("Edits saved!");
    } catch (error) {
      console.error("Save session error:", error);
      message.error("Save edits failed!");
    }
  };

  const handleSaveToDb = async () => {
    if (!idSession) return;

    if (!user?.idUser) {
      message.error("User info not found. Please log in again.");
      return;
    }

    try {
      setSaving(true);
      const result = await savePdfExamSessionAPI(idSession, user.idUser);
      message.success(`New test saved! Redirecting to edit page...`);

      // Navigate to the newly created test's edit page
      navigate(`/teacher/testManager/testEdit/${result.idTest}`);
      handleClose();
    } catch (error) {
      console.error("Save to DB error:", error);
      message.error(error?.response?.data?.message || "Save to DB failed!");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = async () => {
    if (!idSession) {
      handleClose();
      return;
    }

    try {
      await deletePdfExamSessionAPI(idSession);
      message.info("Import session cancelled");
      handleClose();
    } catch (error) {
      console.error("Discard error:", error);
      handleClose();
    }
  };

  const getConfidenceColor = () => {
    if (confidence >= 0.8) return "green";
    if (confidence >= 0.6) return "orange";
    return "red";
  };

  const renderUploadStep = () => (
    <div className="space-y-4">
      <Dragger
        accept=".pdf"
        beforeUpload={beforeUpload}
        showUploadList={false}
        disabled={uploading}
      >
        <p className="text-4xl mb-2">
          <FilePdfOutlined />
        </p>
        <p className="text-base">Click or drag & drop a PDF file here</p>
        <p className="text-xs text-gray-400">Max size: 20MB</p>
      </Dragger>

      {file && (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
          <FilePdfOutlined className="text-green-600 text-xl" />
          <div className="flex-1">
            <div className="font-medium">{file.name}</div>
            <div className="text-xs text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        </div>
      )}

      <Divider>Test info</Divider>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Test type</label>
          <Select
            value={selectedTestType}
            onChange={setSelectedTestType}
            options={testTypeOptions}
            className="w-full"
            disabled={uploading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Level</label>
          <Select
            value={selectedLevel}
            onChange={setSelectedLevel}
            options={levelOptions}
            className="w-full"
            disabled={uploading}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Title (optional)</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter the test title..."
          disabled={uploading}
        />
      </div>

      <Button
        type="primary"
        icon={<UploadOutlined />}
        onClick={handleExtract}
        loading={uploading}
        disabled={!file}
        block
        size="large"
      >
        {uploading ? "Extracting..." : "Extract PDF"}
      </Button>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Tag color={getConfidenceColor()}>
            Confidence: {(confidence * 100).toFixed(0)}%
          </Tag>
          <Tag>Status: {status}</Tag>
        </div>
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Cancel edit" : "Edit"}
        </Button>
      </div>

      {warnings && warnings.length > 0 && (
        <Alert
          message="Warnings"
          description={
            <ul className="list-disc list-inside text-sm">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          }
          type="warning"
          showIcon
          icon={<WarningOutlined />}
        />
      )}

      {isEditing ? (
        <div className="space-y-4">
          <Alert
            message="Edit mode"
            description="You are editing the extracted data. When done, press 'Save edits' to update."
            type="info"
          />
          <Input.TextArea
            value={JSON.stringify(editData, null, 2)}
            onChange={(e) => {
              try {
                setEditData(JSON.parse(e.target.value));
              } catch {}
            }}
            rows={15}
            className="font-mono text-sm"
          />
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveSession}
            block
          >
            Save edits
          </Button>
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg max-h-[400px] overflow-y-auto">
          <pre className="text-xs font-mono whitespace-pre-wrap">
            {JSON.stringify(extractedData, null, 2)}
          </pre>
        </div>
      )}

      <Divider />

      <div className="flex gap-3">
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSaveToDb}
          loading={saving}
          block
          size="large"
        >
          {saving ? "Saving..." : "Save into test"}
        </Button>
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={handleDiscard}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>

      <Button block onClick={() => setCurrentStep(0)} disabled={saving}>
        Back (Upload a different file)
      </Button>
    </div>
  );

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <FilePdfOutlined className="text-red-500" />
          <span>Import test from PDF</span>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Steps
        current={currentStep}
        items={[
          { title: "Upload PDF" },
          { title: "Review & Save" },
        ]}
        className="mb-6"
      />

      {currentStep === 0 ? renderUploadStep() : renderReviewStep()}
    </Modal>
  );
};

export default PdfImportModal;
