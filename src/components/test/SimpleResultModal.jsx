// components/test/reading/SimpleResultModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Modal, Table, Tag, Typography, Spin, message } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { getTestResultAndAnswersAPI } from "@/services/apiDoTest"; // Import API

const { Text } = Typography;

const SimpleResultModal = ({ open, onClose, idTestResult }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  // --- LOGIC 1: Gọi API khi Modal mở ---
  useEffect(() => {
    if (open && idTestResult) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const res = await getTestResultAndAnswersAPI(idTestResult);
          if (res && res.data) {
            setData(res.data);
          } else {
            message.warning("Không tìm thấy dữ liệu chi tiết.");
          }
        } catch (error) {
          console.error("Lỗi tải chi tiết:", error);
          message.error("Lỗi kết nối khi tải đáp án.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      // Reset data khi đóng modal để lần sau mở lại không hiện data cũ
      setData(null);
    }
  }, [open, idTestResult]);

  // --- LOGIC 2: Xử lý dữ liệu hiển thị (Mapping) ---
  const dataSource = useMemo(() => {
    if (!data || !data.test || !data.userAnswer) return [];

    // Tạo map: idQuestion -> Thông tin câu hỏi & Đáp án đúng
    const questionMap = {};

    if (data.test.parts) {
      data.test.parts.forEach((part) => {
        if (part.groupOfQuestions) {
          part.groupOfQuestions.forEach((group) => {
            if (group.question) {
              group.question.forEach((q) => {
                // Tìm đáp án đúng
                const correctAns = q.answers?.find((a) => {
                  const val = a.matching_value?.toUpperCase();
                  return val === "CORRECT" || val === "TRUE" || val === "YES";
                });

                // Fallback text hiển thị
                const correctText = correctAns
                  ? correctAns.matching_key ||
                    correctAns.matching_value ||
                    correctAns.answer_text
                  : q.answers?.[0]?.answer_text || "N/A";

                questionMap[q.idQuestion] = {
                  number: q.numberQuestion,
                  content: q.content,
                  correctText: correctText,
                };
              });
            }
          });
        }
      });
    }

    // Map UserAnswer vào bảng
    return data.userAnswer
      .map((ua) => {
        const qInfo = questionMap[ua.idQuestion] || {};

        let userDisplay = ua.answerText;
        // Logic hiển thị đẹp cho MCQ/Matching (Hiện A, B thay vì text dài)
        if (ua.userAnswerType === "MCQ" || ua.userAnswerType === "MATCHING") {
          userDisplay = ua.matching_key || ua.answerText;
        }
        if (
          ua.userAnswerType === "YES_NO_NOTGIVEN" ||
          ua.userAnswerType === "TFNG"
        ) {
          userDisplay = ua.matching_value || ua.answerText;
        }

        return {
          key: ua.idUserAnswer,
          number: qInfo.number || "Unknown",
          questionContent: qInfo.content,
          userAnswer: userDisplay,
          correctAnswer: qInfo.correctText,
          isCorrect: ua.isCorrect,
        };
      })
      .sort((a, b) => a.number - b.number);
  }, [data]);

  // Cấu hình cột bảng
  const columns = [
    {
      title: "Câu",
      dataIndex: "number",
      key: "number",
      width: 70,
      align: "center",
      render: (text) => <b>{text}</b>,
    },
    {
      title: "Bạn chọn",
      dataIndex: "userAnswer",
      key: "userAnswer",
      render: (text, record) => (
        <Text type={record.isCorrect ? "success" : "danger"} strong>
          {text || "(Trống)"}
        </Text>
      ),
    },
    {
      title: "Đáp án đúng",
      dataIndex: "correctAnswer",
      key: "correctAnswer",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Kết quả",
      dataIndex: "isCorrect",
      key: "isCorrect",
      width: 100,
      align: "center",
      render: (isCorrect) =>
        isCorrect ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Đúng
          </Tag>
        ) : (
          <Tag color="error" icon={<CloseCircleOutlined />}>
            Sai
          </Tag>
        ),
    },
  ];

  return (
    <Modal
      title="Chi tiết bài làm (Review)"
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      bodyStyle={{ minHeight: "300px" }}
    >
      {loading ? (
        <div className="flex justify-center items-center h-[300px]">
          <Spin tip="Đang tải dữ liệu..." size="large" />
        </div>
      ) : (
        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          scroll={{ y: 500 }}
          bordered
          size="small"
          rowKey="key"
          locale={{ emptyText: "Chưa có dữ liệu" }}
        />
      )}
    </Modal>
  );
};

export default SimpleResultModal;
