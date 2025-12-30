import React, { useState, useRef, useEffect } from "react";
import { Button, Tooltip } from "antd";
import { SoundOutlined, LoadingOutlined } from "@ant-design/icons";

/**
 * Component phát âm text sử dụng Web Speech API
 * @param {string} text - Nội dung cần đọc
 * @param {string} lang - Mã ngôn ngữ (mặc định: en-US)
 * @param {string} size - Kích thước nút: 'small' | 'middle' | 'large'
 * @param {string} className - CSS class tùy chỉnh
 * @param {boolean} autoPlay - Tự động phát khi text thay đổi
 */
const TextToSpeech = ({
    text,
    lang = "en-US",
    size = "middle",
    className = "",
    type = "default",
    autoPlay = false
}) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const utteranceRef = useRef(null);

    useEffect(() => {
        // Cleanup khi component unmount
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // Auto-play khi text thay đổi (nếu autoPlay = true)
    useEffect(() => {
        if (!autoPlay || !text || text.trim() === "") {
            return;
        }

        // Kiểm tra browser support
        if (!window.speechSynthesis) {
            return;
        }

        // Delay nhỏ để đảm bảo component đã render xong
        const timer = setTimeout(() => {
            // Tạo utterance mới
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;

            utterance.onstart = () => {
                setIsSpeaking(true);
            };

            utterance.onend = () => {
                setIsSpeaking(false);
            };

            utterance.onerror = (event) => {
                console.error("Speech synthesis error:", event);
                setIsSpeaking(false);
            };

            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [text, autoPlay, lang]);

    const handleSpeak = () => {
        if (!text || text.trim() === "") {
            return;
        }

        // Kiểm tra browser support
        if (!window.speechSynthesis) {
            alert("Trình duyệt của bạn không hỗ trợ Text-to-Speech");
            return;
        }

        // Nếu đang nói thì dừng lại
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        // Tạo utterance mới
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9; // Tốc độ nói (0.1 - 10)
        utterance.pitch = 1; // Cao độ giọng nói (0 - 2)
        utterance.volume = 1; // Âm lượng (0 - 1)

        // Event handlers
        utterance.onstart = () => {
            setIsSpeaking(true);
        };

        utterance.onend = () => {
            setIsSpeaking(false);
        };

        utterance.onerror = (event) => {
            console.error("Speech synthesis error:", event);
            setIsSpeaking(false);
        };

        utteranceRef.current = utterance;

        // Phát âm
        window.speechSynthesis.speak(utterance);
    };

    return (
        <Tooltip title={isSpeaking ? "Đang phát..." : "Nghe câu hỏi"}>
            <Button
                type={type}
                size={size}
                icon={isSpeaking ? <LoadingOutlined spin /> : <SoundOutlined />}
                onClick={handleSpeak}
                className={className}
                loading={isSpeaking}
            >
                {size === "large" && (isSpeaking ? "Đang phát..." : "Nghe câu hỏi")}
            </Button>
        </Tooltip>
    );
};

export default TextToSpeech;
