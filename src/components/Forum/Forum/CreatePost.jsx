import { useState } from "react";
import { createPostAPI } from "@/services/apiForum";
import { Input, Button, message, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
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
    const res = await createPostAPI(form);
    setLoading(false);
    console.log(res.data);

    message.success("Đăng bài thành công!");
    setContent("");
    setFile(null);
    onSuccess(res.data);
  };

  return (
    <div className="p-3 bg-white rounded shadow">
      <TextArea
        rows={3}
        placeholder="Bạn đang nghĩ gì?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <div className="flex justify-between mt-2">
        <Upload
          beforeUpload={(f) => {
            setFile(f);
            return false;
          }}
        >
          <Button icon={<UploadOutlined />}>Ảnh/Video</Button>
        </Upload>

        <Button type="primary" loading={loading} onClick={handlePost}>
          Đăng
        </Button>
      </div>
    </div>
  );
};

export default CreatePost;
