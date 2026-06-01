"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/authContext";
import {
  getAllPendingTicketsAPI,
  claimTicketAPI,
  unclaimTicketAPI,
  getTicketDetailAPI,
  getTeacherQueueAPI,
  submitTeacherScoreAPI,
  getTeacherCompletedTicketsAPI,
} from "@/services/apiTeacherQueue";
import { getAllWritingTasksAPI } from "@/services/apiWriting";
import { getAllSpeakingTasks } from "@/services/apiSpeaking";
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Descriptions,
  message,
  Spin,
  Tabs,
  Form,
  InputNumber,
  Input,
  Collapse,
} from "antd";
import {
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { TextArea } = Input;

const TeacherQueuePage = () => {
  const { user } = useAuth();
  const [pendingTickets, setPendingTickets] = useState([]);
  const [claimedTickets, setClaimedTickets] = useState([]);
  const [completedTickets, setCompletedTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetail, setTicketDetail] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [claimingId, setClaimingId] = useState(null);
  const [scoringModalVisible, setScoringModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [viewForm] = Form.useForm();
  const [testPrompts, setTestPrompts] = useState(null);
  const [loadingPrompts, setLoadingPrompts] = useState(false);

  useEffect(() => {
    fetchPendingTickets();
  }, []);

  useEffect(() => {
    if (activeTab === "claimed") {
      fetchClaimedTickets();
    } else if (activeTab === "history") {
      fetchCompletedTickets();
    }
  }, [activeTab]);

  const fetchCompletedTickets = async () => {
    if (!user?.idUser) return;
    setLoading(true);
    try {
      const res = await getTeacherCompletedTicketsAPI(user.idUser);
      const rawArray = Array.isArray(res) ? res : res?.data || [];
      setCompletedTickets(rawArray);
    } catch (err) {
      console.error("Failed to fetch completed tickets:", err);
      message.error("Không thể tải lịch sử ticket.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingTickets = async () => {
    setLoading(true);
    try {
      const res = await getAllPendingTicketsAPI({ status: "PENDING" });
      setPendingTickets(res.data || []);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      message.error("Không thể tải danh sách ticket.");
    } finally {
      setLoading(false);
    }
  };

  const fetchClaimedTickets = async () => {
    if (!user?.idUser) return;
    setLoading(true);
    try {
      const res = await getTeacherQueueAPI(user.idUser);
      // API returns { message, data, status } — normalize to array with flattened fields
      const rawArray = Array.isArray(res) ? res : res?.data || [];
      const ticketArray = rawArray.map((ticket) => ({
        ...ticket,
        teacherId: ticket.teacherId ?? ticket.idTeacher,
        studentName: ticket.testResult?.user?.nameUser,
        testTitle: ticket.testResult?.test?.title,
      }));
      setClaimedTickets(ticketArray);
    } catch (err) {
      console.error("Failed to fetch claimed tickets:", err);
      message.error("Không thể tải danh sách ticket đã nhận.");
    } finally {
      setLoading(false);
    }
  };

  const handleClaimTicket = async (idTicket) => {
    if (!user?.idUser) return;
    setClaimingId(idTicket);
    try {
      await claimTicketAPI(user.idUser, idTicket);
      message.success("Đã nhận ticket thành công!");
      fetchPendingTickets();
    } catch (err) {
      console.error(err);
      message.error("Không thể nhận ticket. Vui lòng thử lại.");
    } finally {
      setClaimingId(null);
    }
  };

  const handleUnclaimTicket = async (idTicket) => {
    if (!user?.idUser) return;
    setClaimingId(idTicket);
    try {
      await unclaimTicketAPI(user.idUser, idTicket);
      message.success("Đã bỏ nhận ticket.");
      fetchClaimedTickets();
      fetchPendingTickets();
    } catch (err) {
      console.error(err);
      message.error("Không thể bỏ nhận ticket.");
    } finally {
      setClaimingId(null);
    }
  };

  const handleViewTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setTicketLoading(true);
    try {
      const res = await getTicketDetailAPI(ticket.idTicket);
      setTicketDetail(res.data);
      // Task prompts are already in res.data.test.writingTasks / speakingTasks
    } catch (err) {
      console.error("Failed to fetch ticket detail:", err);
      message.error("Không thể tải chi tiết ticket.");
    } finally {
      setTicketLoading(false);
    }
  };

  const handleOpenScoring = async (ticket) => {
    setSelectedTicket(ticket);
    setTicketLoading(true);
    setLoadingPrompts(true);
    setTestPrompts(null);
    try {
      const res = await getTicketDetailAPI(ticket.idTicket);
      setTicketDetail(res.data);
      // Task prompts are already in res.data.test.writingTasks / speakingTasks
      setScoringModalVisible(true);
      form.resetFields();
    } catch (err) {
      console.error("Failed to fetch ticket detail:", err);
      message.error("Không thể tải chi tiết ticket.");
    } finally {
      setTicketLoading(false);
      setLoadingPrompts(false);
    }
  };

  const handleSubmitScore = async () => {
    if (!user?.idUser || !selectedTicket) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await submitTeacherScoreAPI(user.idUser, selectedTicket.idTicket, {
        bandScore: values.bandScore,
        feedback: {
          taskResponse: values.taskResponse,
          coherenceAndCohesion: values.coherenceAndCohesion,
          lexicalResource: values.lexicalResource,
          grammaticalRangeAndAccuracy: values.grammaticalRangeAndAccuracy,
          generalFeedback: values.generalFeedback,
          // Speaking fields
          fluencyAndCoherence: values.fluencyAndCoherence,
          pronunciation: values.pronunciation,
        },
      });
      message.success("Đã nộp điểm thành công!");
      setScoringModalVisible(false);
      setSelectedTicket(null);
      setTicketDetail(null);
      form.resetFields();
      fetchClaimedTickets();
    } catch (err) {
      console.error(err);
      message.error("Không thể nộp điểm. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitScoreFromView = async (values) => {
    if (!user?.idUser || !selectedTicket) return;
    try {
      setSubmitting(true);
      await submitTeacherScoreAPI(user.idUser, selectedTicket.idTicket, {
        bandScore: values.bandScore,
        feedback: {
          generalFeedback: values.feedback,
        },
      });
      message.success("Đã nộp điểm thành công!");
      viewForm.resetFields();
      fetchClaimedTickets();
    } catch (err) {
      console.error(err);
      message.error("Không thể nộp điểm. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toUpperCase()) {
      case "WRITING":
        return "blue";
      case "SPEAKING":
        return "purple";
      default:
        return "default";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return "orange";
      case "CLAIMED":
        return "blue";
      case "IN_PROGRESS":
        return "cyan";
      case "COMPLETED":
        return "green";
      default:
        return "default";
    }
  };

  const pendingColumns = [
    {
      title: "ID",
      dataIndex: "idTicket",
      key: "idTicket",
      width: 100,
      render: (id) => (
        <span className="font-mono text-xs">#{id?.slice(0, 8)}</span>
      ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type) => <Tag color={getTypeColor(type)}>{type || "N/A"}</Tag>,
    },
    {
      title: "Học viên",
      dataIndex: "studentName",
      key: "studentName",
      width: 150,
    },
    {
      title: "Bài test",
      dataIndex: "testTitle",
      key: "testTitle",
    },
    {
      title: "Band AI",
      dataIndex: "aiBandScore",
      key: "aiBandScore",
      width: 100,
      render: (score) => (
        <span className="font-bold text-blue-600">
          {typeof score === 'number' ? score?.toFixed(1) : score?.score || "N/A"}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status || "PENDING"}</Tag>
      ),
    },
    {
      title: "Ngày yêu cầu",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "N/A",
    },
    {
      title: "Giáo viên",
      dataIndex: "teacherName",
      key: "teacherName",
      width: 130,
      render: (name) =>
        name || <span className="text-gray-400">Chưa nhận</span>,
    },
    {
      title: "Hành động",
      key: "action",
      width: 180,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewTicket(record)}
          >
            Xem
          </Button>
          {record.status === "PENDING" && (
            <Button
              size="small"
              type="primary"
              loading={claimingId === record.idTicket}
              onClick={() => handleClaimTicket(record.idTicket)}
            >
              Nhận
            </Button>
          )}
        </div>
      ),
    },
  ];

  const claimedColumns = [
    {
      title: "ID",
      dataIndex: "idTicket",
      key: "idTicket",
      width: 100,
      render: (id) => (
        <span className="font-mono text-xs">#{id?.slice(0, 8)}</span>
      ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type) => <Tag color={getTypeColor(type)}>{type || "N/A"}</Tag>,
    },
    {
      title: "Học viên",
      dataIndex: "studentName",
      key: "studentName",
      width: 150,
    },
    {
      title: "Bài test",
      dataIndex: "testTitle",
      key: "testTitle",
    },
    {
      title: "Band AI",
      dataIndex: "aiBandScore",
      key: "aiBandScore",
      width: 100,
      render: (score) => (
        <span className="font-bold text-blue-600">
          {typeof score === 'number' ? score?.toFixed(1) : score?.score || "N/A"}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status || "CLAIMED"}</Tag>
      ),
    },
    {
      title: "Ngày nhận",
      dataIndex: "claimedAt",
      key: "claimedAt",
      width: 150,
      render: (date) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "N/A",
    },
    {
      title: "Hành động",
      key: "action",
      width: 200,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewTicket(record)}
          >
            Xem
          </Button>
          {record.status === "CLAIMED" && record.teacherId === user?.idUser && (
            <Button
              size="small"
              type="primary"
              onClick={() => handleOpenScoring(record)}
            >
              Chấm bài
            </Button>
          )}
        </div>
      ),
    },
  ];

  const completedColumns = [
    {
      title: "ID",
      dataIndex: "idTicket",
      key: "idTicket",
      width: 100,
      render: (id) => (
        <span className="font-mono text-xs">#{id?.slice(0, 8)}</span>
      ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type) => <Tag color={getTypeColor(type)}>{type || "N/A"}</Tag>,
    },
    {
      title: "Học viên",
      dataIndex: "studentName",
      key: "studentName",
      width: 150,
    },
    {
      title: "Bài test",
      dataIndex: "testTitle",
      key: "testTitle",
    },
    {
      title: "Band AI",
      dataIndex: "aiBandScore",
      key: "aiBandScore",
      width: 100,
      render: (score) => (
        <span className="font-bold text-blue-600">
          {typeof score === 'number' ? score?.toFixed(1) : score?.score || "N/A"}
        </span>
      ),
    },
    {
      title: "Band GV",
      dataIndex: "teacherBandScore",
      key: "teacherBandScore",
      width: 100,
      render: (score) => (
        <span className="font-bold text-green-600">
          {typeof score === 'number' ? score?.toFixed(1) : score?.score || "N/A"}
        </span>
      ),
    },
    {
      title: "Commission",
      dataIndex: "commissionAmount",
      key: "commissionAmount",
      width: 100,
      render: (amount) => (
        <span className="text-orange-600 font-medium">
          {amount ? `${amount.toLocaleString()}đ` : "-"}
        </span>
      ),
    },
    {
      title: "Ngày chấm",
      dataIndex: "submittedAt",
      key: "submittedAt",
      width: 120,
      render: (date) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "N/A",
    },
    {
      title: "Hành động",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewTicket(record)}
        >
          Xem
        </Button>
      ),
    },
  ];

  const isWriting = ticketDetail?.type === "WRITING";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-6 transition-colors duration-300">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white/85 dark:bg-slate-800/95 p-5 shadow-sm backdrop-blur-sm md:p-6 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-indigo-600">
              <ClockCircleOutlined className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white md:text-3xl">
                Hàng đợi chấm bài
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 md:text-base">
                Danh sách các bài Writing/Speaking cần được chấm bởi giáo viên.
              </p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spin size="large" />
          </div>
        ) : (
          <Card className="shadow-sm dark:bg-slate-800/95">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: "pending",
                  label: "Tất cả",
                  children: (
                    <Table
                      columns={pendingColumns}
                      dataSource={pendingTickets}
                      rowKey="idTicket"
                      pagination={{ pageSize: 10 }}
                      locale={{ emptyText: "Không có ticket nào." }}
                    />
                  ),
                },
                {
                  key: "claimed",
                  label: "Đã nhận",
                  children: (
                    <Table
                      columns={claimedColumns}
                      dataSource={claimedTickets}
                      rowKey="idTicket"
                      pagination={{ pageSize: 10 }}
                      locale={{ emptyText: "Không có ticket đã nhận." }}
                    />
                  ),
                },
                {
                  key: "history",
                  label: "Lịch sử",
                  children: (
                    <Table
                      columns={completedColumns}
                      dataSource={completedTickets}
                      rowKey="idTicket"
                      pagination={{ pageSize: 10 }}
                      locale={{ emptyText: "Chưa có bài nào được chấm." }}
                    />
                  ),
                },
              ]}
            />
          </Card>
        )}
      </div>

      {/* View Ticket Modal */}
      <Modal
        open={!!selectedTicket && !scoringModalVisible}
        onCancel={() => {
          setSelectedTicket(null);
          setTicketDetail(null);
        }}
        footer={
          selectedTicket?.status === "PENDING" ? (
            <div className="flex justify-end gap-2">
              <Button
                type="primary"
                onClick={() => {
                  handleClaimTicket(selectedTicket.idTicket);
                  setSelectedTicket(null);
                  setTicketDetail(null);
                }}
              >
                Nhận ticket
              </Button>
              <Button
                onClick={() => {
                  setSelectedTicket(null);
                  setTicketDetail(null);
                }}
              >
                Đóng
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => {
                setSelectedTicket(null);
                setTicketDetail(null);
              }}
            >
              Đóng
            </Button>
          )
        }
        width={800}
        title={<span className="text-lg font-bold">Chi tiết Ticket</span>}
      >
        {ticketLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spin />
          </div>
        ) : (
          ticketDetail && (
            <div className="space-y-4">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="ID Ticket">
                  <span className="font-mono">{ticketDetail.idTicket}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Loại">
                  <Tag color={getTypeColor(ticketDetail.type)}>
                    {ticketDetail.type}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Học viên">
                  {ticketDetail.testResult?.user?.nameUser || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Bài test">
                  {ticketDetail.testResult?.test?.title || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Band AI">
                  <span className="font-bold text-blue-600">
                    {ticketDetail.aiBandScore || "N/A"}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color={getStatusColor(ticketDetail.status)}>
                    {ticketDetail.status}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              {/* Split Panel: Test Prompts vs Student Submission - Tabbed */}
              {isWriting ? (
                <Tabs
                  items={ticketDetail.test?.writingTasks?.map((task) => ({
                    key: task.idWritingTask,
                    label: task.taskType === "TASK1" ? "Task 1" : "Task 2",
                    children: (
                      <div className="flex gap-4">
                        <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-200 max-h-[350px] overflow-y-auto">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            📝 Đề bài
                          </h4>
                          <p className="text-sm text-slate-600 whitespace-pre-wrap mb-2">
                            {task.instructions}
                          </p>
                          {task.taskType === "TASK1" && task.image && (
                            <img
                              src={task.image}
                              alt="Task 1 visual"
                              className="mt-2 max-h-48 rounded border"
                            />
                          )}
                        </div>
                        <div className="flex-1 bg-blue-50 p-4 rounded-lg border border-blue-100 max-h-[350px] overflow-y-auto">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            👤 Bài làm
                          </h4>
                          {/* Try testResult.writingSubmissions first, fallback to submissionContent */}
                          {(() => {
                            const submissions =
                              ticketDetail.testResult?.writingSubmissions || [];
                            const sub = submissions.find(
                              (s) => s.idWritingTask === task.idWritingTask,
                            );
                            if (sub?.submissionText) {
                              return (
                                <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                                  {sub.submissionText}
                                </p>
                              );
                            }
                            // Fallback: show submissionContent if it exists (single combined submission)
                            if (ticketDetail.submissionContent) {
                              return (
                                <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                                  {ticketDetail.submissionContent}
                                </p>
                              );
                            }
                            return (
                              <p className="text-sm text-slate-400 italic">
                                Chưa có bài làm
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    ),
                  }))}
                  size="small"
                />
              ) : (
                <div className="flex gap-4">
                  {/* Left: Speaking Topics */}
                  <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-200 max-h-[300px] overflow-y-auto">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      📝 Topics
                    </h4>
                    {ticketLoading ? (
                      <Spin size="small" />
                    ) : (
                      <div className="space-y-3">
                        {(ticketDetail.test?.speakingTasks || []).map(
                          (task) => (
                            <div
                              key={task.idSpeakingTask}
                              className="bg-white p-3 rounded border border-slate-100"
                            >
                              <div className="font-semibold text-slate-800 mb-1">
                                Part {task.part}: {task.topic || task.title}
                              </div>
                              {task.description && (
                                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                  {/* Right: Student Submission */}
                  <div className="flex-1 bg-blue-50 p-4 rounded-lg border border-blue-100 max-h-[300px] overflow-y-auto">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      👤 Bài làm của học viên
                    </h4>
                    {ticketDetail.testResult?.speakingSubmissions?.length >
                    0 ? (
                      <div className="space-y-3">
                        {ticketDetail.testResult.speakingSubmissions.map(
                          (sub) => (
                            <div key={sub.idSpeakingSubmission}>
                              {sub.audioUrl && (
                                <audio
                                  controls
                                  src={sub.audioUrl}
                                  className="w-full h-10"
                                />
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                        {ticketDetail.submissionContent || "Không có nội dung"}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* AI Feedback - Formatted with Collapse */}
              {ticketDetail.aiFeedback &&
                (() => {
                  const fb = ticketDetail.aiFeedback;
                  const getText = (val) => {
                    if (!val) return null;
                    if (typeof val === 'string') return val;
                    if (typeof val === 'object' && val !== null) {
                      return val.comment || val.text || JSON.stringify(val);
                    }
                    return String(val);
                  };
                  const writingItems = [
                    {
                      key: "taskResponse",
                      label: "Task Response",
                      score: typeof fb.taskResponseScore === 'object' ? fb.taskResponseScore?.score : fb.taskResponseScore,
                      text: getText(fb.taskResponse),
                    },
                    {
                      key: "coherence",
                      label: "Coherence & Cohesion",
                      score: typeof fb.coherenceScore === 'object' ? fb.coherenceScore?.score : fb.coherenceScore,
                      text: getText(fb.coherenceAndCohesion),
                    },
                    {
                      key: "lexical",
                      label: "Lexical Resource",
                      score: typeof fb.lexicalScore === 'object' ? fb.lexicalScore?.score : fb.lexicalScore,
                      text: getText(fb.lexicalResource),
                    },
                    {
                      key: "grammar",
                      label: "Grammatical Range & Accuracy",
                      score: typeof fb.grammarScore === 'object' ? fb.grammarScore?.score : fb.grammarScore,
                      text: getText(fb.grammaticalRangeAndAccuracy),
                    },
                  ];
                  const speakingItems = [
                    {
                      key: "fluency",
                      label: "Fluency & Coherence",
                      score: typeof (fb.fluencyScore || fb.scoreFluency) === 'object'
                        ? (fb.fluencyScore || fb.scoreFluency)?.score
                        : (fb.fluencyScore || fb.scoreFluency),
                      text: getText(fb.fluencyAndCoherence || fb.commentFluency),
                    },
                    {
                      key: "lexical",
                      label: "Lexical Resource",
                      score: typeof (fb.lexicalScore || fb.scoreLexical) === 'object'
                        ? (fb.lexicalScore || fb.scoreLexical)?.score
                        : (fb.lexicalScore || fb.scoreLexical),
                      text: getText(fb.lexicalResource || fb.commentLexical),
                    },
                    {
                      key: "grammar",
                      label: "Grammatical Range",
                      score: typeof (fb.grammarScore || fb.scoreGrammar) === 'object'
                        ? (fb.grammarScore || fb.scoreGrammar)?.score
                        : (fb.grammarScore || fb.scoreGrammar),
                      text: getText(fb.grammaticalRangeAndAccuracy || fb.commentGrammar),
                    },
                    {
                      key: "pronunciation",
                      label: "Pronunciation",
                      score: typeof (fb.pronunciationScore || fb.scorePronunciation) === 'object'
                        ? (fb.pronunciationScore || fb.scorePronunciation)?.score
                        : (fb.pronunciationScore || fb.scorePronunciation),
                      text: getText(fb.pronunciation || fb.commentPronunciation),
                    },
                  ];
                  const collapseItems = (
                    isWriting ? writingItems : speakingItems
                  )
                    .filter((item) => item.text)
                    .map((item) => ({
                      key: item.key,
                      label: (
                        <span className="flex items-center gap-2">
                          {item.label}
                          {item.score !== undefined && (
                            <Tag color="blue" className="ml-2">
                              {item.score}/9
                            </Tag>
                          )}
                        </span>
                      ),
                      children: (
                        <p className="text-slate-700 whitespace-pre-wrap">
                          {item.text}
                        </p>
                      ),
                    }));

                  return collapseItems.length > 0 ? (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-800">
                        🤖 Phản hồi AI
                      </h4>
                      <Collapse
                        items={collapseItems}
                        defaultActiveKey={["taskResponse"]}
                        size="small"
                      />
                      {fb.generalFeedback && (
                        <div className="mt-3 p-3 bg-white rounded border border-blue-100">
                          <span className="font-semibold text-blue-700">
                            General Feedback:{" "}
                          </span>
                          <p className="text-slate-700 mt-1">
                            {fb.generalFeedback}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}

              {/* Teacher Feedback Section - for View Modal */}
              {ticketDetail.status === "CLAIMED" ||
              ticketDetail.status === "IN_PROGRESS" ? (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100 mt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-purple-800">
                    📝 Phản hồi giáo viên
                  </h4>
                  <Form
                    form={viewForm}
                    layout="vertical"
                    onFinish={handleSubmitScoreFromView}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <Form.Item
                        name="bandScore"
                        label="Band Score (0-9)"
                        rules={[{ required: true, message: "Nhập điểm" }]}
                      >
                        <InputNumber
                          min={0}
                          max={9}
                          step={0.5}
                          className="w-full"
                          placeholder="VD: 7.5"
                        />
                      </Form.Item>
                    </div>
                    <Form.Item
                      name="feedback"
                      label="Nhận xét"
                      rules={[{ required: true, message: "Nhập nhận xét" }]}
                    >
                      <Input.TextArea
                        rows={3}
                        placeholder="Nhập phản hồi cho học viên..."
                      />
                    </Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={submitting}
                      className="bg-purple-600"
                    >
                      Nộp điểm
                    </Button>
                  </Form>
                </div>
              ) : (
                ticketDetail.teacherBandScore && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200 mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-green-800 text-lg flex items-center gap-2">
                        ✅ Đã chấm điểm
                      </h4>
                      <div className="flex items-center gap-4">
                        <div className="text-center px-4 py-2 bg-white rounded-lg border border-green-200">
                          <div className="text-xs text-gray-500">Band GV</div>
                          <div className="text-2xl font-bold text-green-600">
                            {typeof ticketDetail.teacherBandScore === 'number'
                              ? ticketDetail.teacherBandScore.toFixed(1)
                              : ticketDetail.teacherBandScore}
                          </div>
                        </div>
                        {ticketDetail.aiBandScore && (
                          <div className="text-center px-4 py-2 bg-white rounded-lg border border-blue-200">
                            <div className="text-xs text-gray-500">Band AI</div>
                            <div className="text-2xl font-bold text-blue-600">
                              {typeof ticketDetail.aiBandScore === 'number'
                                ? ticketDetail.aiBandScore.toFixed(1)
                                : ticketDetail.aiBandScore}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Detailed Feedback Breakdown */}
                    {ticketDetail.teacherFeedback && (() => {
                      const tf = ticketDetail.teacherFeedback;

                      const criteria = [];
                      if (tf.taskResponse) {
                        criteria.push({
                          label: 'Task Response',
                          text: tf.taskResponse,
                          color: 'blue'
                        });
                      }
                      if (tf.coherenceAndCohesion) {
                        criteria.push({
                          label: 'Coherence & Cohesion',
                          text: tf.coherenceAndCohesion,
                          color: 'cyan'
                        });
                      }
                      if (tf.lexicalResource) {
                        criteria.push({
                          label: 'Lexical Resource',
                          text: tf.lexicalResource,
                          color: 'purple'
                        });
                      }
                      if (tf.grammaticalRangeAndAccuracy) {
                        criteria.push({
                          label: 'Grammatical Range & Accuracy',
                          text: tf.grammaticalRangeAndAccuracy,
                          color: 'magenta'
                        });
                      }

                      return criteria.length > 0 ? (
                        <div className="mt-4 space-y-3">
                          <h5 className="font-semibold text-gray-700 text-sm">Chi tiết đánh giá:</h5>
                          {criteria.map((item, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-gray-100">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-800 text-sm">{item.label}</span>
                              </div>
                              {item.text && (
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.text}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : null;
                    })()}

                    {/* General Feedback */}
                    {ticketDetail.teacherFeedback?.generalFeedback && (
                      <div className="mt-4 p-3 bg-white rounded-lg border border-gray-100">
                        <h5 className="font-semibold text-gray-700 text-sm mb-2">Nhận xét chung:</h5>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {ticketDetail.teacherFeedback.generalFeedback}
                        </p>
                      </div>
                    )}

                    {/* Simple string feedback fallback */}
                    {typeof ticketDetail.teacherFeedback === 'string' && !ticketDetail.teacherFeedback?.generalFeedback && (
                      <div className="mt-4 p-3 bg-white rounded-lg border border-gray-100">
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {ticketDetail.teacherFeedback}
                        </p>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )
        )}
      </Modal>

      {/* Scoring Modal */}
      <Modal
        open={scoringModalVisible}
        onCancel={() => {
          setScoringModalVisible(false);
          setSelectedTicket(null);
          setTicketDetail(null);
          setTestPrompts(null);
          form.resetFields();
        }}
        title={<span className="text-lg font-bold">Chấm bài</span>}
        width={1000}
        bodyStyle={{ maxHeight: "80vh", overflowY: "auto" }}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setScoringModalVisible(false);
                setSelectedTicket(null);
                setTicketDetail(null);
                setTestPrompts(null);
                form.resetFields();
              }}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              loading={submitting}
              onClick={handleSubmitScore}
            >
              Nộp điểm
            </Button>
          </div>
        }
      >
        {ticketLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spin />
          </div>
        ) : (
          ticketDetail && (
            <div className="space-y-4">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Loại">
                  <Tag color={getTypeColor(ticketDetail.type)}>
                    {ticketDetail.type}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Học viên">
                  {ticketDetail.testResult?.user?.nameUser ||
                    selectedTicket?.studentName ||
                    "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Bài test" span={2}>
                  {ticketDetail.testResult?.test?.title ||
                    selectedTicket?.testTitle ||
                    "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Band AI">
                  <span className="font-bold text-blue-600">
                    {ticketDetail.aiBandScore ||
                      selectedTicket?.aiBandScore ||
                      "N/A"}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color={getStatusColor(ticketDetail.status)}>
                    {ticketDetail.status}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              {/* Split Panel: Test Prompts vs Student Submission - Tabbed for Writing */}
              {isWriting ? (
                <Tabs
                  items={ticketDetail.test?.writingTasks?.map((task) => ({
                    key: task.idWritingTask,
                    label: task.taskType === "TASK1" ? "Task 1" : "Task 2",
                    children: (
                      <div className="flex gap-4">
                        <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-200 max-h-[350px] overflow-y-auto">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            📝 Đề bài
                          </h4>
                          <p className="text-sm text-slate-600 whitespace-pre-wrap mb-2">
                            {task.instructions}
                          </p>
                          {task.taskType === "TASK1" && task.image && (
                            <img
                              src={task.image}
                              alt="Task 1 visual"
                              className="mt-2 max-h-48 rounded border"
                            />
                          )}
                        </div>
                        <div className="flex-1 bg-blue-50 p-4 rounded-lg border border-blue-100 max-h-[350px] overflow-y-auto">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            👤 Bài làm
                          </h4>
                          {(() => {
                            const submissions =
                              ticketDetail.testResult?.writingSubmissions || [];
                            const sub = submissions.find(
                              (s) => s.idWritingTask === task.idWritingTask,
                            );
                            if (sub?.submissionText) {
                              return (
                                <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                                  {sub.submissionText}
                                </p>
                              );
                            }
                            if (ticketDetail.submissionContent) {
                              return (
                                <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                                  {ticketDetail.submissionContent}
                                </p>
                              );
                            }
                            return (
                              <p className="text-sm text-slate-400 italic">
                                Chưa có bài làm
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    ),
                  }))}
                  size="small"
                />
              ) : (
                <div className="flex gap-4">
                  {/* Left: Speaking Topics */}
                  <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-200 max-h-[350px] overflow-y-auto">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      📝 Topics
                    </h4>
                    {ticketLoading ? (
                      <Spin size="small" />
                    ) : (
                      <div className="space-y-3">
                        {(ticketDetail.test?.speakingTasks || []).map(
                          (task) => (
                            <div
                              key={task.idSpeakingTask}
                              className="bg-white p-3 rounded border border-slate-100"
                            >
                              <div className="font-semibold text-slate-800 mb-1">
                                Part {task.part}: {task.topic || task.title}
                              </div>
                              {task.description && (
                                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                                  {task.description}
                                </p>
                              )}
                              {task.audioUrl && (
                                <audio
                                  controls
                                  src={task.audioUrl}
                                  className="mt-2 w-full h-8"
                                />
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                  {/* Right: Student Submission */}
                  <div className="flex-1 bg-blue-50 p-4 rounded-lg border border-blue-100 max-h-[350px] overflow-y-auto">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      👤 Bài làm của học viên
                    </h4>
                    {ticketDetail.testResult?.speakingSubmissions?.length >
                    0 ? (
                      <div className="space-y-3">
                        {ticketDetail.testResult.speakingSubmissions.map(
                          (sub) => (
                            <div key={sub.idSpeakingSubmission}>
                              {sub.audioUrl && (
                                <audio
                                  controls
                                  src={sub.audioUrl}
                                  className="w-full h-10"
                                />
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                        {ticketDetail.submissionContent || "Không có nội dung"}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* AI Feedback - Formatted with Collapse */}
              {ticketDetail.aiFeedback &&
                (() => {
                  const fb = ticketDetail.aiFeedback;
                  const getText = (val) => {
                    if (!val) return null;
                    if (typeof val === 'string') return val;
                    if (typeof val === 'object' && val !== null) {
                      return val.comment || val.text || JSON.stringify(val);
                    }
                    return String(val);
                  };
                  const writingItems = [
                    {
                      key: "taskResponse",
                      label: "Task Response",
                      score: typeof fb.taskResponseScore === 'object' ? fb.taskResponseScore?.score : fb.taskResponseScore,
                      text: getText(fb.taskResponse),
                    },
                    {
                      key: "coherence",
                      label: "Coherence & Cohesion",
                      score: typeof fb.coherenceScore === 'object' ? fb.coherenceScore?.score : fb.coherenceScore,
                      text: getText(fb.coherenceAndCohesion),
                    },
                    {
                      key: "lexical",
                      label: "Lexical Resource",
                      score: typeof fb.lexicalScore === 'object' ? fb.lexicalScore?.score : fb.lexicalScore,
                      text: getText(fb.lexicalResource),
                    },
                    {
                      key: "grammar",
                      label: "Grammatical Range & Accuracy",
                      score: typeof fb.grammarScore === 'object' ? fb.grammarScore?.score : fb.grammarScore,
                      text: getText(fb.grammaticalRangeAndAccuracy),
                    },
                  ];
                  const speakingItems = [
                    {
                      key: "fluency",
                      label: "Fluency & Coherence",
                      score: typeof (fb.fluencyScore || fb.scoreFluency) === 'object'
                        ? (fb.fluencyScore || fb.scoreFluency)?.score
                        : (fb.fluencyScore || fb.scoreFluency),
                      text: getText(fb.fluencyAndCoherence || fb.commentFluency),
                    },
                    {
                      key: "lexical",
                      label: "Lexical Resource",
                      score: typeof (fb.lexicalScore || fb.scoreLexical) === 'object'
                        ? (fb.lexicalScore || fb.scoreLexical)?.score
                        : (fb.lexicalScore || fb.scoreLexical),
                      text: getText(fb.lexicalResource || fb.commentLexical),
                    },
                    {
                      key: "grammar",
                      label: "Grammatical Range",
                      score: typeof (fb.grammarScore || fb.scoreGrammar) === 'object'
                        ? (fb.grammarScore || fb.scoreGrammar)?.score
                        : (fb.grammarScore || fb.scoreGrammar),
                      text: getText(fb.grammaticalRangeAndAccuracy || fb.commentGrammar),
                    },
                    {
                      key: "pronunciation",
                      label: "Pronunciation",
                      score: typeof (fb.pronunciationScore || fb.scorePronunciation) === 'object'
                        ? (fb.pronunciationScore || fb.scorePronunciation)?.score
                        : (fb.pronunciationScore || fb.scorePronunciation),
                      text: getText(fb.pronunciation || fb.commentPronunciation),
                    },
                  ];
                  const collapseItems = (
                    isWriting ? writingItems : speakingItems
                  )
                    .filter((item) => item.text)
                    .map((item) => ({
                      key: item.key,
                      label: (
                        <span className="flex items-center gap-2">
                          {item.label}
                          {item.score !== undefined && (
                            <Tag color="blue" className="ml-2">
                              {item.score}/9
                            </Tag>
                          )}
                        </span>
                      ),
                      children: (
                        <p className="text-slate-700 whitespace-pre-wrap">
                          {item.text}
                        </p>
                      ),
                    }));

                  return collapseItems.length > 0 ? (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-800">
                        🤖 Phản hồi AI
                      </h4>
                      <Collapse
                        items={collapseItems}
                        defaultActiveKey={["taskResponse"]}
                        size="small"
                      />
                      {fb.generalFeedback && (
                        <div className="mt-3 p-3 bg-white rounded border border-blue-100">
                          <span className="font-semibold text-blue-700">
                            General Feedback:{" "}
                          </span>
                          <p className="text-slate-700 mt-1">
                            {fb.generalFeedback}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}

              {/* Teacher Scoring Form - Only show if not completed */}
              {ticketDetail.status !== "COMPLETED" && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    ✍️ Điền điểm và phản hồi
                  </h4>
                  <Form form={form} layout="vertical">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <Form.Item
                        name="bandScore"
                        label="Band Score (0 - 9)"
                        rules={[
                          { required: true, message: "Vui lòng nhập điểm" },
                          {
                            type: "number",
                            min: 0,
                            max: 9,
                            message: "Điểm phải từ 0 đến 9",
                          },
                        ]}
                      >
                        <InputNumber
                          min={0}
                          max={9}
                          step={0.5}
                          className="w-full"
                          placeholder="VD: 7.0"
                        />
                      </Form.Item>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Band AI hiện tại</div>
                          <div className="text-xl font-bold text-blue-600">
                            {ticketDetail.aiBandScore || "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {isWriting ? (
                    <>
                      <Form.Item
                        name="taskResponse"
                        label="Task Response"
                        rules={[
                          { required: true, message: "Vui lòng nhập phản hồi" },
                        ]}
                      >
                        <TextArea
                          rows={2}
                          placeholder="Phản hồi về việc phát triển ý tưởng, ví dụ..."
                        />
                      </Form.Item>
                      <Form.Item
                        name="coherenceAndCohesion"
                        label="Coherence & Cohesion"
                        rules={[
                          { required: true, message: "Vui lòng nhập phản hồi" },
                        ]}
                      >
                        <TextArea
                          rows={2}
                          placeholder="Phản hồi về tổ chức, liên kết câu, đoạn..."
                        />
                      </Form.Item>
                      <Form.Item
                        name="lexicalResource"
                        label="Lexical Resource"
                        rules={[
                          { required: true, message: "Vui lòng nhập phản hồi" },
                        ]}
                      >
                        <TextArea
                          rows={2}
                          placeholder="Phản hồi về từ vựng..."
                        />
                      </Form.Item>
                      <Form.Item
                        name="grammaticalRangeAndAccuracy"
                        label="Grammatical Range & Accuracy"
                        rules={[
                          { required: true, message: "Vui lòng nhập phản hồi" },
                        ]}
                      >
                        <TextArea
                          rows={2}
                          placeholder="Phản hồi về ngữ pháp..."
                        />
                      </Form.Item>
                      <Form.Item
                        name="generalFeedback"
                        label="General Feedback"
                        rules={[
                          { required: true, message: "Vui lòng nhập phản hồi" },
                        ]}
                      >
                        <TextArea
                          rows={3}
                          placeholder="Nhận xét tổng quát..."
                        />
                      </Form.Item>
                    </>
                  ) : (
                    <>
                      <Form.Item
                        name="fluencyAndCoherence"
                        label="Fluency & Coherence"
                        rules={[
                          { required: true, message: "Vui lòng nhập phản hồi" },
                        ]}
                      >
                        <TextArea
                          rows={2}
                          placeholder="Phản hồi về sự lưu loát, mạch lạc..."
                        />
                      </Form.Item>
                      <Form.Item
                        name="lexicalResource"
                        label="Lexical Resource"
                        rules={[
                          { required: true, message: "Vui lòng nhập phản hồi" },
                        ]}
                      >
                        <TextArea
                          rows={2}
                          placeholder="Phản hồi về từ vựng..."
                        />
                      </Form.Item>
                      <Form.Item
                        name="grammaticalRangeAndAccuracy"
                        label="Grammatical Range & Accuracy"
                        rules={[
                          { required: true, message: "Vui lòng nhập phản hồi" },
                        ]}
                      >
                        <TextArea
                          rows={2}
                          placeholder="Phản hồi về ngữ pháp..."
                        />
                      </Form.Item>
                      <Form.Item
                        name="pronunciation"
                        label="Pronunciation"
                        rules={[
                          { required: true, message: "Vui lòng nhập phản hồi" },
                        ]}
                      >
                        <TextArea
                          rows={2}
                          placeholder="Phản hồi về phát âm..."
                        />
                      </Form.Item>
                      <Form.Item
                        name="generalFeedback"
                        label="General Feedback"
                        rules={[
                          { required: true, message: "Vui lòng nhập phản hồi" },
                        ]}
                      >
                        <TextArea
                          rows={3}
                          placeholder="Nhận xét tổng quát..."
                        />
                      </Form.Item>
                    </>
                  )}
                </Form>
              </div>
              )}
            </div>
          )
        )}
      </Modal>
    </div>
  );
};

export default TeacherQueuePage;
