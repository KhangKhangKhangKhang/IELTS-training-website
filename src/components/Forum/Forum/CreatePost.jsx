// CreatePost - Updated with emoji picker
import { useState } from "react";
import { createPostAPI } from "@/services/apiForum";
import { Input, Button, message, Upload, Avatar, Tooltip, Popover } from "antd";
import {
  PaperClipOutlined,
  PictureOutlined,
  SmileOutlined,
  SendOutlined,
  CloseCircleFilled,
} from "@ant-design/icons";
import { useAuth } from "@/context/authContext";
import EmojiPicker from "emoji-picker-react";

const { TextArea } = Input;

const CreatePost = ({ idForumThreads, onSuccess }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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

  const onEmojiClick = (emojiData) => {
    setContent((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const emojiPickerContent = (
    <div className="emoji-picker-container">
      <EmojiPicker
        onEmojiClick={onEmojiClick}
        width={320}
        height={400}
        searchPlaceHolder="Tìm emoji..."
        previewConfig={{ showPreview: false }}
        skinTonesDisabled
        lazyLoadEmojis
        categories={[
          { name: "Hay dùng", category: "suggested" },
          { name: "Mặt cười", category: "smileys_people" },
          { name: "Động vật", category: "animals_nature" },
          { name: "Đồ ăn", category: "food_drink" },
          { name: "Hoạt động", category: "activities" },
          { name: "Du lịch", category: "travel_places" },
          { name: "Vật thể", category: "objects" },
          { name: "Biểu tượng", category: "symbols" },
        ]}
      />
    </div>
  );

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border-2 transition-all duration-300 p-5 mb-6 ${isFocused
          ? "border-blue-300 shadow-md shadow-blue-100"
          : "border-slate-200"
        }`}
    >
      <div className="flex gap-4">
        {/* Avatar */}
        <Avatar
          size={48}
          src={user?.avatar || null}
          className="border-2 border-blue-100 flex-shrink-0"
        >
          {user?.nameUser?.charAt(0)?.toUpperCase()}
        </Avatar>

        {/* Input area */}
        <div className="flex-1">
          <TextArea
            rows={3}
            placeholder={`${user?.nameUser || "Bạn"} ơi, chia sẻ điều gì đó với mọi người...`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="rounded-xl border-0 bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-900 resize-none text-base"
            style={{ padding: "12px 16px" }}
          />

          {/* File preview */}
          {file && (
            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-blue-50 rounded-xl border border-blue-200 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <PictureOutlined className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 truncate max-w-xs">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <CloseCircleFilled className="text-lg" />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex mt-4 justify-between items-center">
            <div className="flex gap-1">
              <Upload
                beforeUpload={(f) => {
                  setFile(f);
                  return false;
                }}
                showUploadList={false}
                accept="image/*,video/*"
              >
                <Tooltip title="Thêm ảnh/video">
                  <button className="p-2.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200">
                    <PictureOutlined className="text-xl" />
                  </button>
                </Tooltip>
              </Upload>

              <Upload
                beforeUpload={(f) => {
                  setFile(f);
                  return false;
                }}
                showUploadList={false}
              >
                <Tooltip title="Đính kèm file">
                  <button className="p-2.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200">
                    <PaperClipOutlined className="text-xl" />
                  </button>
                </Tooltip>
              </Upload>

              <Popover
                content={emojiPickerContent}
                trigger="click"
                open={showEmojiPicker}
                onOpenChange={setShowEmojiPicker}
                placement="topLeft"
                arrow={false}
                overlayClassName="emoji-popover"
              >
                <Tooltip title="Thêm emoji">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2.5 rounded-xl text-slate-500 hover:text-amber-500 hover:bg-amber-50 transition-all duration-200"
                  >
                    <SmileOutlined className="text-xl" />
                  </button>
                </Tooltip>
              </Popover>
            </div>

            <Button
              type="primary"
              loading={loading}
              onClick={handlePost}
              disabled={!content.trim() && !file}
              icon={<SendOutlined />}
              className="bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 border-0 rounded-xl px-6 h-10 font-medium shadow-md shadow-blue-200 disabled:opacity-50"
            >
              Đăng bài
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
