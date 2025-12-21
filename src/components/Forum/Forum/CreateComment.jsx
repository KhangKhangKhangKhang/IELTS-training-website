// CreateComment - Updated with emoji picker
import { useState, useRef, useEffect } from "react";
import { createCommentAPI } from "@/services/apiForum";
import { Input, Button, message, Avatar, Popover } from "antd";
import { SendOutlined, SmileOutlined } from "@ant-design/icons";
import { useAuth } from "@/context/authContext";
import EmojiPicker from "emoji-picker-react";

const CreateComment = ({ idForumPost, onCommentCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);

  const handleComment = async () => {
    if (!content.trim()) return;

    setLoading(true);
    try {
      const res = await createCommentAPI({
        idForumPost,
        idUser: user.idUser,
        content,
      });
      setContent("");
      message.success("Đã bình luận");
      if (onCommentCreated) onCommentCreated(res.data);
    } catch (error) {
      message.error("Lỗi khi bình luận");
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
      className={`flex gap-3 p-4 rounded-2xl transition-all duration-300 ${isFocused
        ? "bg-gradient-to-r from-blue-50 to-blue-50 dark:from-slate-700 dark:to-slate-700 border-2 border-blue-100 dark:border-blue-800"
        : "bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700"
        }`}
    >
      <Avatar
        size={40}
        src={user?.avatar || null}
        className="border-2 border-white dark:border-slate-600 shadow-sm flex-shrink-0"
      >
        {user?.nameUser?.charAt(0)?.toUpperCase()}
      </Avatar>

      <div className="flex-1 flex gap-2">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            placeholder="Viết bình luận của bạn..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="rounded-full border-0 bg-slate-100 dark:bg-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600 focus:bg-white dark:focus:bg-slate-700 pl-4 pr-10 h-10 text-sm"
            onPressEnter={handleComment}
          />
          <Popover
            content={emojiPickerContent}
            trigger="click"
            open={showEmojiPicker}
            onOpenChange={setShowEmojiPicker}
            placement="topRight"
            arrow={false}
            overlayClassName="emoji-popover"
          >
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <SmileOutlined className="text-lg" />
            </button>
          </Popover>
        </div>

        <Button
          onClick={handleComment}
          loading={loading}
          disabled={!content.trim()}
          icon={<SendOutlined />}
          className="bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 border-0 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-blue-900/20 disabled:opacity-50 disabled:shadow-none"
        />
      </div>
    </div>
  );
};

export default CreateComment;
