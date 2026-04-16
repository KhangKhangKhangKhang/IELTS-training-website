import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/context/authContext";
import { getAllThreadAPI, getPostByThreadAPI } from "@/services/apiForum";

const { Paragraph, Text } = Typography;

const STATUS_META = {
  auto_approved: { label: "Tự duyệt (AI)", color: "green" },
  needs_review: { label: "Cần duyệt tay", color: "gold" },
  auto_rejected: { label: "Tự từ chối (AI)", color: "red" },
  approved: { label: "Đã duyệt thủ công", color: "blue" },
  rejected: { label: "Đã từ chối", color: "volcano" },
  changes_requested: { label: "Yêu cầu chỉnh sửa", color: "purple" },
};

const SPAM_KEYWORDS = [
  "buy now",
  "free money",
  "casino",
  "đặt cược",
  "kiếm tiền nhanh",
  "click link",
  "airdrop",
  "telegram",
];

const OFFENSIVE_KEYWORDS = ["idiot", "stupid", "ngu", "đồ ngu", "chửi"];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const evaluatePostForModeration = (post) => {
  const content = String(post?.content || "").trim();
  const normalized = content.toLowerCase();
  const reasons = [];
  let score = 55;

  if (content.length >= 80 && content.length <= 900) {
    score += 15;
  }

  if (content.length < 25) {
    score -= 25;
    reasons.push("Nội dung quá ngắn, cần thêm ngữ cảnh học thuật.");
  }

  if (content.length > 1500) {
    score -= 12;
    reasons.push("Nội dung quá dài, cần rà soát rủi ro spam.");
  }

  const urlMatches = normalized.match(/https?:\/\/|www\./g) || [];
  if (urlMatches.length > 0) {
    score -= 15;
    reasons.push("Có liên kết ngoài, cần kiểm tra độ an toàn.");
  }
  if (urlMatches.length > 2) {
    score -= 10;
    reasons.push("Quá nhiều liên kết trong một bài viết.");
  }

  if (/(.)\1{6,}/.test(content)) {
    score -= 10;
    reasons.push("Phát hiện ký tự lặp bất thường.");
  }

  if (/\b(\w{2,})\b(?:\s+\1\b){2,}/i.test(normalized)) {
    score -= 10;
    reasons.push("Phát hiện từ/cụm từ lặp nhiều lần.");
  }

  if (SPAM_KEYWORDS.some((kw) => normalized.includes(kw))) {
    score -= 30;
    reasons.push("Dấu hiệu quảng cáo hoặc spam.");
  }

  if (OFFENSIVE_KEYWORDS.some((kw) => normalized.includes(kw))) {
    score -= 35;
    reasons.push("Có khả năng chứa từ ngữ công kích.");
  }

  if (/[.!?]/.test(content)) {
    score += 5;
  }

  if (post?.file) {
    score += 4;
    reasons.push("Có tệp đính kèm, cần xác nhận mức độ liên quan.");
  }

  if (!reasons.length) {
    reasons.push("Nội dung tương đối an toàn, rủi ro thấp.");
  }

  const finalScore = clamp(Math.round(score), 0, 100);
  let decision = "needs_review";

  if (finalScore >= 80) {
    decision = "auto_approved";
  } else if (finalScore <= 20) {
    decision = "auto_rejected";
  }

  const confidenceBase =
    decision === "needs_review"
      ? 55 - Math.abs(finalScore - 50)
      : Math.abs(finalScore - (decision === "auto_approved" ? 80 : 20)) * 2.5;

  return {
    score: finalScore,
    decision,
    confidence: clamp(Math.round(confidenceBase), 35, 99),
    reasons,
  };
};

const getScoreColor = (score) => {
  if (score >= 80) return "green";
  if (score <= 20) return "red";
  return "gold";
};

const ForumModeration = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [manualActions, setManualActions] = useState({});
  const [previewPost, setPreviewPost] = useState(null);
  const [requestChangesModal, setRequestChangesModal] = useState({
    open: false,
    postId: null,
    note: "",
  });

  const canModerate = user?.role === "ADMIN" || user?.role === "GIAOVIEN";

  const getCurrentStatus = useCallback(
    (record) => manualActions[record.idForumPost]?.status || record.ai.decision,
    [manualActions]
  );

  const applyManualAction = useCallback(
    (postIds, status, note = "") => {
      if (!postIds.length) return;

      const reviewedBy = user?.nameUser || user?.email || "Moderator";
      const reviewedAt = new Date().toISOString();

      setManualActions((prev) => {
        const next = { ...prev };
        postIds.forEach((id) => {
          next[id] = {
            status,
            note,
            reviewedBy,
            reviewedAt,
          };
        });
        return next;
      });

      setSelectedRowKeys([]);

      const labelByStatus = {
        approved: "Đã duyệt",
        rejected: "Đã từ chối",
        changes_requested: "Đã yêu cầu chỉnh sửa",
      };

      message.success(`${labelByStatus[status] || "Đã cập nhật"} ${postIds.length} bài.`);
    },
    [user]
  );

  const clearManualAction = useCallback((postId) => {
    setManualActions((prev) => {
      if (!prev[postId]) return prev;
      const next = { ...prev };
      delete next[postId];
      return next;
    });
  }, []);

  const loadModerationQueue = useCallback(async () => {
    if (!user?.idUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const threadRes = await getAllThreadAPI();
      const threads = Array.isArray(threadRes?.data) ? threadRes.data : [];

      const results = await Promise.all(
        threads.map(async (thread) => {
          try {
            const postRes = await getPostByThreadAPI(thread.idForumThreads, user.idUser);
            const posts = Array.isArray(postRes?.data) ? postRes.data : [];
            return posts.map((post) => ({
              ...post,
              threadId: thread.idForumThreads,
              threadTitle: thread.title,
              ai: evaluatePostForModeration(post),
            }));
          } catch {
            return [];
          }
        })
      );

      const flattenedQueue = results
        .flat()
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

      setQueue(flattenedQueue);
      setSelectedRowKeys([]);
    } catch {
      setQueue([]);
      message.error("Không thể tải hàng đợi moderation.");
    } finally {
      setLoading(false);
    }
  }, [user?.idUser]);

  useEffect(() => {
    loadModerationQueue();
  }, [loadModerationQueue]);

  const filteredQueue = useMemo(() => {
    const needle = keyword.trim().toLowerCase();

    return queue.filter((record) => {
      const status = getCurrentStatus(record);

      if (statusFilter !== "all" && status !== statusFilter) {
        return false;
      }

      if (!needle) {
        return true;
      }

      const author = String(record.user?.nameUser || "").toLowerCase();
      const threadTitle = String(record.threadTitle || "").toLowerCase();
      const content = String(record.content || "").toLowerCase();

      return (
        author.includes(needle) ||
        threadTitle.includes(needle) ||
        content.includes(needle)
      );
    });
  }, [getCurrentStatus, keyword, queue, statusFilter]);

  const summary = useMemo(() => {
    const total = queue.length;
    const needsReview = queue.filter(
      (record) => getCurrentStatus(record) === "needs_review"
    ).length;
    const highRisk = queue.filter((record) => {
      const status = getCurrentStatus(record);
      return status === "auto_rejected" || status === "rejected";
    }).length;
    const approved = queue.filter((record) => {
      const status = getCurrentStatus(record);
      return status === "auto_approved" || status === "approved";
    }).length;
    const manualReviewed = Object.keys(manualActions).length;

    return { total, needsReview, highRisk, approved, manualReviewed };
  }, [getCurrentStatus, manualActions, queue]);

  const columns = useMemo(
    () => [
      {
        title: "Bài viết",
        dataIndex: "content",
        key: "content",
        width: 360,
        render: (_, record) => (
          <div>
            <div className="font-semibold text-slate-800">{record.user?.nameUser || "Ẩn danh"}</div>
            <div className="text-xs text-slate-500 mb-1">{record.threadTitle}</div>
            <Paragraph ellipsis={{ rows: 2 }} className="!mb-1 !text-slate-700">
              {record.content || "(Không có nội dung)"}
            </Paragraph>
            {record.file && <Tag color="cyan">Có ảnh đính kèm</Tag>}
          </div>
        ),
      },
      {
        title: "Điểm AI",
        key: "aiScore",
        width: 130,
        render: (_, record) => (
          <Space direction="vertical" size={2}>
            <Tag color={getScoreColor(record.ai.score)}>{record.ai.score}/100</Tag>
            <Text type="secondary" className="!text-xs">
              Conf: {record.ai.confidence}%
            </Text>
          </Space>
        ),
      },
      {
        title: "Trạng thái",
        key: "status",
        width: 180,
        render: (_, record) => {
          const status = getCurrentStatus(record);
          const meta = STATUS_META[status] || STATUS_META.needs_review;
          return <Tag color={meta.color}>{meta.label}</Tag>;
        },
      },
      {
        title: "Lý do chính",
        key: "reason",
        width: 260,
        render: (_, record) => (
          <Paragraph ellipsis={{ rows: 2 }} className="!mb-0 !text-slate-600">
            {record.ai.reasons[0]}
          </Paragraph>
        ),
      },
      {
        title: "Hành động",
        key: "actions",
        fixed: "right",
        width: 260,
        render: (_, record) => {
          const action = manualActions[record.idForumPost];

          return (
            <Space direction="vertical" size={4}>
              <Space size={6} wrap>
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => applyManualAction([record.idForumPost], "approved")}
                >
                  Duyệt
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => applyManualAction([record.idForumPost], "rejected")}
                >
                  Từ chối
                </Button>
              </Space>

              <Space size={6} wrap>
                <Button
                  size="small"
                  icon={<StopOutlined />}
                  onClick={() =>
                    setRequestChangesModal({
                      open: true,
                      postId: record.idForumPost,
                      note: action?.note || "",
                    })
                  }
                >
                  Yêu cầu sửa
                </Button>
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => setPreviewPost(record)}
                >
                  Chi tiết
                </Button>
              </Space>

              {action && (
                <Button
                  type="link"
                  size="small"
                  className="!px-0"
                  onClick={() => clearManualAction(record.idForumPost)}
                >
                  Khôi phục theo AI
                </Button>
              )}
            </Space>
          );
        },
      },
    ],
    [applyManualAction, clearManualAction, getCurrentStatus, manualActions]
  );

  if (!canModerate) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
        <Card>
          <Text>Bạn không có quyền truy cập trang duyệt bài.</Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Forum Moderation Center</h1>
              <p className="text-slate-600 mt-1">
                Duyệt bài tự động + thủ công theo mô hình ở mục 11 (MVP frontend).
              </p>
            </div>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadModerationQueue}
              loading={loading}
            >
              Tải lại queue
            </Button>
          </div>
        </Card>

        <Alert
          type="info"
          showIcon
          message="MVP moderation"
          description="Điểm AI và trạng thái auto đang được mô phỏng bằng rule-based scorer ở frontend. Quyết định duyệt thủ công có hiệu lực trong phiên hiện tại."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <Card>
            <Statistic title="Tổng bài trong queue" value={summary.total} />
          </Card>
          <Card>
            <Statistic title="Cần duyệt tay" value={summary.needsReview} valueStyle={{ color: "#d48806" }} />
          </Card>
          <Card>
            <Statistic title="Rủi ro cao" value={summary.highRisk} valueStyle={{ color: "#cf1322" }} />
          </Card>
          <Card>
            <Statistic title="Đã duyệt/publish" value={summary.approved} valueStyle={{ color: "#389e0d" }} />
          </Card>
          <Card>
            <Statistic title="Đã review thủ công" value={summary.manualReviewed} valueStyle={{ color: "#1677ff" }} />
          </Card>
        </div>

        <Card>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Input
              allowClear
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tác giả, thread hoặc nội dung"
              prefix={<SearchOutlined />}
              className="w-full md:w-[380px]"
            />

            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-full md:w-[220px]"
              options={[
                { value: "all", label: "Tất cả trạng thái" },
                { value: "needs_review", label: "Cần duyệt tay" },
                { value: "auto_approved", label: "Tự duyệt (AI)" },
                { value: "auto_rejected", label: "Tự từ chối (AI)" },
                { value: "approved", label: "Đã duyệt thủ công" },
                { value: "rejected", label: "Đã từ chối" },
                { value: "changes_requested", label: "Yêu cầu chỉnh sửa" },
              ]}
            />

            <Space wrap>
              <Button
                type="primary"
                disabled={selectedRowKeys.length === 0}
                onClick={() => applyManualAction(selectedRowKeys, "approved")}
              >
                Duyệt đã chọn ({selectedRowKeys.length})
              </Button>
              <Button
                danger
                disabled={selectedRowKeys.length === 0}
                onClick={() => applyManualAction(selectedRowKeys, "rejected")}
              >
                Từ chối đã chọn
              </Button>
            </Space>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Spin size="large" />
            </div>
          ) : filteredQueue.length === 0 ? (
            <Empty description="Không có bài viết phù hợp" />
          ) : (
            <Table
              rowKey="idForumPost"
              columns={columns}
              dataSource={filteredQueue}
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys,
              }}
              pagination={{ pageSize: 8, showSizeChanger: true }}
              scroll={{ x: 1200 }}
            />
          )}
        </Card>
      </div>

      <Modal
        open={Boolean(previewPost)}
        title="Chi tiết moderation"
        width={760}
        footer={null}
        onCancel={() => setPreviewPost(null)}
      >
        {previewPost && (
          <div className="space-y-4">
            <div>
              <Text strong>Thread:</Text> <Text>{previewPost.threadTitle}</Text>
            </div>
            <div>
              <Text strong>Tác giả:</Text> <Text>{previewPost.user?.nameUser || "Ẩn danh"}</Text>
            </div>
            <div>
              <Text strong>Điểm AI:</Text>{" "}
              <Tag color={getScoreColor(previewPost.ai.score)}>{previewPost.ai.score}/100</Tag>
              <Text type="secondary">(Confidence {previewPost.ai.confidence}%)</Text>
            </div>
            <div>
              <Text strong>Nội dung:</Text>
              <Paragraph className="!mt-2 !mb-0 whitespace-pre-line bg-slate-50 rounded-lg p-3 border border-slate-200">
                {previewPost.content || "(Không có nội dung)"}
              </Paragraph>
            </div>
            <div>
              <Text strong>Lý do AI:</Text>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-700">
                {previewPost.ai.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={requestChangesModal.open}
        title="Yêu cầu chỉnh sửa"
        okText="Gửi yêu cầu"
        cancelText="Hủy"
        onCancel={() =>
          setRequestChangesModal({
            open: false,
            postId: null,
            note: "",
          })
        }
        onOk={() => {
          const note = requestChangesModal.note.trim();
          if (!note) {
            message.warning("Vui lòng nhập nội dung góp ý.");
            return;
          }
          applyManualAction([requestChangesModal.postId], "changes_requested", note);
          setRequestChangesModal({
            open: false,
            postId: null,
            note: "",
          });
        }}
      >
        <Input.TextArea
          rows={4}
          placeholder="Ví dụ: Bài viết có link ngoài chưa rõ nguồn, vui lòng thêm nguồn học thuật và chỉnh lại tiêu đề."
          value={requestChangesModal.note}
          onChange={(e) =>
            setRequestChangesModal((prev) => ({
              ...prev,
              note: e.target.value,
            }))
          }
        />
      </Modal>
    </div>
  );
};

export default ForumModeration;
