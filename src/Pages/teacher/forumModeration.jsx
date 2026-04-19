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
import { getModerationQueueAPI, reviewForumPostAPI } from "@/services/apiForum";

const { Paragraph, Text } = Typography;

const STATUS_META = {
  pending: { label: "Đang chờ AI", color: "default" },
  auto_approved: { label: "Tự duyệt (AI)", color: "green" },
  needs_review: { label: "Cần duyệt tay", color: "gold" },
  auto_rejected: { label: "Tự từ chối (AI)", color: "red" },
  approved: { label: "Đã duyệt thủ công", color: "blue" },
  rejected: { label: "Đã từ chối", color: "volcano" },
  changes_requested: { label: "Yêu cầu chỉnh sửa", color: "purple" },
};

const REVIEWABLE_STATUSES = ["approved", "rejected", "changes_requested"];

const getStatus = (record) => record?.moderation?.status || "pending";

const getPrimaryReason = (record) => {
  const explanation = record?.moderation?.explanation;
  const reasons = Array.isArray(record?.moderation?.reasons)
    ? record.moderation.reasons
    : [];

  if (typeof explanation === "string" && explanation.trim()) {
    return explanation;
  }
  if (reasons.length > 0) {
    return reasons[0];
  }
  return "Không có lý do chi tiết từ AI.";
};

const getScoreColor = (score) => {
  if (typeof score !== "number") return "default";
  if (score >= 80) return "green";
  if (score <= 20) return "red";
  return "gold";
};

const ForumModeration = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [previewPost, setPreviewPost] = useState(null);
  const [requestChangesModal, setRequestChangesModal] = useState({
    open: false,
    postId: null,
    note: "",
  });

  const canModerate = user?.role === "ADMIN" || user?.role === "GIAOVIEN";

  const applyManualAction = useCallback(
    async (postIds, status, note = "") => {
      if (!postIds.length) return;
      if (!user?.idUser) {
        message.error("Không tìm thấy người duyệt hiện tại.");
        return;
      }

      try {
        setActionLoading(true);

        const results = await Promise.allSettled(
          postIds.map((idForumPost) =>
            reviewForumPostAPI(idForumPost, {
              idReviewer: user.idUser,
              status,
              note,
            })
          )
        );

        const successRecords = results
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value?.data)
          .filter(Boolean);

        if (!successRecords.length) {
          throw new Error("No record updated");
        }

        const updateMap = new Map(
          successRecords.map((record) => [record.idForumPost, record])
        );

        setQueue((prev) =>
          prev.map((record) => updateMap.get(record.idForumPost) || record)
        );

        setSelectedRowKeys([]);

        const labelByStatus = {
          approved: "Đã duyệt",
          rejected: "Đã từ chối",
          changes_requested: "Đã yêu cầu chỉnh sửa",
        };

        message.success(
          `${labelByStatus[status] || "Đã cập nhật"} ${successRecords.length} bài.`
        );

        const failedCount = results.length - successRecords.length;
        if (failedCount > 0) {
          message.warning(`${failedCount} bài chưa cập nhật được, vui lòng thử lại.`);
        }
      } catch {
        message.error("Không thể cập nhật trạng thái moderation.");
      } finally {
        setActionLoading(false);
      }
    },
    [user?.idUser]
  );

  const loadModerationQueue = useCallback(async () => {
    if (!user?.idUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const queueRes = await getModerationQueueAPI(user.idUser);
      const queueData = Array.isArray(queueRes?.data) ? queueRes.data : [];
      setQueue(queueData);
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
      const status = getStatus(record);

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
  }, [keyword, queue, statusFilter]);

  const summary = useMemo(() => {
    const total = queue.length;
    const needsReview = queue.filter((record) => getStatus(record) === "needs_review").length;
    const highRisk = queue.filter((record) => {
      const status = getStatus(record);
      return status === "auto_rejected" || status === "rejected";
    }).length;
    const approved = queue.filter((record) => {
      const status = getStatus(record);
      return status === "auto_approved" || status === "approved";
    }).length;
    const manualReviewed = queue.filter((record) => {
      const status = getStatus(record);
      return REVIEWABLE_STATUSES.includes(status);
    }).length;

    return { total, needsReview, highRisk, approved, manualReviewed };
  }, [queue]);

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
            <div className="text-xs text-slate-500 mb-1">{record.threadTitle || "(Không có thread)"}</div>
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
        width: 140,
        render: (_, record) => {
          const score = record?.moderation?.score;
          const confidence = record?.moderation?.confidence;

          return (
            <Space direction="vertical" size={2}>
              <Tag color={getScoreColor(score)}>
                {typeof score === "number" ? `${score}/100` : "N/A"}
              </Tag>
              <Text type="secondary" className="!text-xs">
                Conf: {typeof confidence === "number" ? `${confidence}%` : "N/A"}
              </Text>
            </Space>
          );
        },
      },
      {
        title: "Trạng thái",
        key: "status",
        width: 180,
        render: (_, record) => {
          const status = getStatus(record);
          const meta = STATUS_META[status] || STATUS_META.pending;
          return <Tag color={meta.color}>{meta.label}</Tag>;
        },
      },
      {
        title: "Lý do chính",
        key: "reason",
        width: 260,
        render: (_, record) => (
          <Paragraph ellipsis={{ rows: 2 }} className="!mb-0 !text-slate-600">
            {getPrimaryReason(record)}
          </Paragraph>
        ),
      },
      {
        title: "Hành động",
        key: "actions",
        fixed: "right",
        width: 260,
        render: (_, record) => (
          <Space direction="vertical" size={4}>
            <Space size={6} wrap>
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={actionLoading}
                onClick={() => applyManualAction([record.idForumPost], "approved")}
              >
                Duyệt
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                loading={actionLoading}
                onClick={() => applyManualAction([record.idForumPost], "rejected")}
              >
                Từ chối
              </Button>
            </Space>

            <Space size={6} wrap>
              <Button
                size="small"
                icon={<StopOutlined />}
                loading={actionLoading}
                onClick={() =>
                  setRequestChangesModal({
                    open: true,
                    postId: record.idForumPost,
                    note: record?.moderation?.note || "",
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
          </Space>
        ),
      },
    ],
    [actionLoading, applyManualAction]
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
                Duyệt bài tự động + thủ công theo luồng 11.1 và 11.2.
              </p>
            </div>
            <Button icon={<ReloadOutlined />} onClick={loadModerationQueue} loading={loading}>
              Tải lại queue
            </Button>
          </div>
        </Card>

        <Alert
          type="info"
          showIcon
          message="Gemini moderation đang hoạt động"
          description="Điểm AI và lý do được lấy trực tiếp từ backend (Gemini prompt scoring) rồi trả về frontend để duyệt."
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
                { value: "pending", label: "Đang chờ AI" },
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
                loading={actionLoading}
                disabled={selectedRowKeys.length === 0}
                onClick={() => applyManualAction(selectedRowKeys, "approved")}
              >
                Duyệt đã chọn ({selectedRowKeys.length})
              </Button>
              <Button
                danger
                loading={actionLoading}
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
              <Text strong>Thread:</Text> <Text>{previewPost.threadTitle || "(Không có thread)"}</Text>
            </div>
            <div>
              <Text strong>Tác giả:</Text> <Text>{previewPost.user?.nameUser || "Ẩn danh"}</Text>
            </div>
            <div>
              <Text strong>Điểm AI:</Text>{" "}
              <Tag color={getScoreColor(previewPost?.moderation?.score)}>
                {typeof previewPost?.moderation?.score === "number"
                  ? `${previewPost.moderation.score}/100`
                  : "N/A"}
              </Tag>
              <Text type="secondary">
                (Confidence{" "}
                {typeof previewPost?.moderation?.confidence === "number"
                  ? `${previewPost.moderation.confidence}%`
                  : "N/A"}
                )
              </Text>
            </div>
            <div>
              <Text strong>Nội dung:</Text>
              <Paragraph className="!mt-2 !mb-0 whitespace-pre-line bg-slate-50 rounded-lg p-3 border border-slate-200">
                {previewPost.content || "(Không có nội dung)"}
              </Paragraph>
            </div>
            <div>
              <Text strong>Lý do AI:</Text>
              {Array.isArray(previewPost?.moderation?.reasons) &&
              previewPost.moderation.reasons.length > 0 ? (
                <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-700">
                  {previewPost.moderation.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              ) : (
                <Paragraph className="!mt-2 !mb-0 text-slate-600">
                  {getPrimaryReason(previewPost)}
                </Paragraph>
              )}
            </div>
            {previewPost?.moderation?.note && (
              <div>
                <Text strong>Góp ý từ người duyệt:</Text>
                <Paragraph className="!mt-2 !mb-0 text-slate-700">
                  {previewPost.moderation.note}
                </Paragraph>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={requestChangesModal.open}
        title="Yêu cầu chỉnh sửa"
        okText="Gửi yêu cầu"
        cancelText="Hủy"
        confirmLoading={actionLoading}
        onCancel={() =>
          setRequestChangesModal({
            open: false,
            postId: null,
            note: "",
          })
        }
        onOk={async () => {
          const note = requestChangesModal.note.trim();
          if (!note) {
            message.warning("Vui lòng nhập nội dung góp ý.");
            return;
          }

          await applyManualAction(
            [requestChangesModal.postId],
            "changes_requested",
            note
          );

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
