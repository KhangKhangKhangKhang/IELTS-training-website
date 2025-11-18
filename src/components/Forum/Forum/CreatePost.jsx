// CreatePost - Updated
import { useState } from "react";
import { createPostAPI } from "@/services/apiForum";
import { Input, Button, message, Upload } from "antd";
import { UploadOutlined, PaperClipOutlined } from "@ant-design/icons";
import { useAuth } from "@/context/authContext";

const { TextArea } = Input;

const CreatePost = ({ idForumThreads, onSuccess }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!content.trim()) {
      return message.error("Vui lòng nhập nội dung");
    }

    const form = new FormData();
    form.append("idForumThreads", idForumThreads);
    form.append("idUser", user.idUser);
    form.append("content", content);
    if (file) form.append("file", file);

    setLoading(true);
    try {
      const res = await createPostAPI(form);
      message.success("Đăng bài thành công!");
      setContent("");
      setFile(null);
      onSuccess(res.data);
    } catch (error) {
      message.error("Đăng bài thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
      <TextArea
        rows={4}
        placeholder="Bạn đang nghĩ gì? Chia sẻ với mọi người..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="rounded-lg border-slate-300 text-slate-900 mb-4"
        style={{ resize: "none" }}
      />

      <div className="flex mt-2 justify-between items-center">
        <Upload
          beforeUpload={(f) => {
            setFile(f);
            return false;
          }}
          showUploadList={false}
        >
          <Button
            icon={<PaperClipOutlined />}
            className="text-slate-600 hover:text-slate-900 border-slate-300 rounded-lg"
          >
            Đính kèm file
          </Button>
        </Upload>

        <Button
          type="primary"
          loading={loading}
          onClick={handlePost}
          className="bg-slate-900 hover:bg-slate-800 border-slate-900 hover:border-slate-800 rounded-lg px-6"
        >
          Đăng bài
        </Button>
      </div>

      {file && (
        <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-sm text-slate-600">{file.name}</span>
        </div>
      )}
    </div>
  );
};

export default CreatePost;
