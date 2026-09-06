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
  PrintputNumber,
  Printput,
  Collapse,
} from "antd";
import {
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { TextArea } = Printput;

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
      message.error("Failed to load ticket history.");
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
      message.error("Failed to load ticket list.");
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
      message.error("Failed to load claimed tickets.");
    } finally {
      setLoading(false);
    }
  };

  const handleClaimTicket = async (idTicket) => {
    if (!user?.idUser) return;
    setClaimingId(idTicket);
    try {
      await claimTicketAPI(user.idUser, idTicket);
      message.success("Ticket claimed successfully!");
      fetchPendingTickets();
    } catch (err) {
      console.error(err);
      message.error("Failed to claim ticket. Please try again.");
    } finally {
      setClaimingId(null);
    }
  };

  const handleUnclaimTicket = async (idTicket) => {
    if (!user?.idUser) return;
    setClaimingId(idTicket);
    try {
      await unclaimTicketAPI(user.idUser, idTicket);
      message.success("Ticket returned.");
      fetchClaimedTickets();
      fetchPendingTickets();
    } catch (err) {
      console.error(err);
      message.error("Failed to return ticket.");
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
      message.error("Failed to load ticket detail.");
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
      message.error("Failed to load ticket detail.");
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
      message.success("Score submitted successfully!");
      setScoringModalVisible(false);
      setSelectedTicket(null);
      setTicketDetail(null);
      form.resetFields();
      fetchClaimedTickets();
    } catch (err) {
      console.error(err);
      message.error("Failed to submit score. Please try again.");
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
      message.success("Score submitted successfully!");
      viewForm.resetFields();
      fetchClaimedTickets();
    } catch (err) {
      console.error(err);
      message.error("Failed to submit score. Please try again.");
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
      dataPrintdex: "idTicket",
      key: "idTicket",
      width: 100,
      render: (id) => (
        <span className="font-mono text-xs">#{id?.slice(0, 8)}</span>
      ),
    },
    {
      title: "Type",
      dataPrintdex: "type",
      key: "type",
      width: 100,
      render: (type) => <Tag color={getTypeColor(type)}>{type || "N/A"}</Tag>,
    },
    {
      title: "Student",
      dataPrintdex: "studentName",
      key: "studentName",
      width: 150,
    },
    {
      title: "Test",
      dataPrintdex: "testTitle",
      key: "testTitle",
    },
    {
      title: "Band AI",
      dataPrintdex: "aiBandScore",
      key: "aiBandScore",
      width: 100,
      render: (score) => (
        <span className="font-bold text-blue-600">{score || "N/A"}</span>
      ),
    },
    {
      title: "Status",
      dataPrintdex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status || "PENDING"}</Tag>
      ),
    },
    {
      title: "Request date",
      dataPrintdex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "N/A",
    },
    {
      title: "Teacher",
      dataPrintdex: "teacherName",
      key: "teacherName",
      width: 130,
      render: (name) =>
        name || <span className="text-gray-400">Unclaimed</span>,
    },
    {
      title: "Action",
      key: "action",
      width: 180,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewTicket(record)}
          >
            View
          </Button>
          {record.status === "PENDING" && (
            <Button
              size="small"
              type="primary"
              loading={claimingId === record.idTicket}
              onClick={() => handleClaimTicket(record.idTicket)}
            >
              Claim
            </Button>
          )}
        </div>
      ),
    },
  ];

  const claimedColumns = [
    {
      title: "ID",
      dataPrintdex: "idTicket",
      key: "idTicket",
      width: 100,
      render: (id) => (
        <span className="font-mono text-xs">#{id?.slice(0, 8)}</span>
      ),
    },
    {
      title: "Type",
      dataPrintdex: "type",
      key: "type",
      width: 100,
      render: (type) => <Tag color={getTypeColor(type)}>{type || "N/A"}</Tag>,
    },
    {
      title: "Student",
      dataPrintdex: "studentName",
      key: "studentName",
      width: 150,
    },
    {
      title: "Test",
      dataPrintdex: "testTitle",
      key: "testTitle",
    },
    {
      title: "Band AI",
      dataPrintdex: "aiBandScore",
      key: "aiBandScore",
      width: 100,
      render: (score) => (
        <span className="font-bold text-blue-600">{score || "N/A"}</span>
      ),
    },
    {
      title: "Status",
      dataPrintdex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status || "CLAIMED"}</Tag>
      ),
    },
    {
      title: "Claimed date",
      dataPrintdex: "claimedAt",
      key: "claimedAt",
      width: 150,
      render: (date) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "N/A",
    },
    {
      title: "Action",
      key: "action",
      width: 200,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewTicket(record)}
          >
            View
          </Button>
          {record.status === "CLAIMED" && record.teacherId === user?.idUser && (
            <Button
              size="small"
              type="primary"
              onClick={() => handleOpenScoring(record)}
            >
              Grade
            </Button>
          )}
        </div>
      ),
    },
  ];

  const completedColumns = [
    {
      title: "ID",
      dataPrintdex: "idTicket",
      key: "idTicket",
      width: 100,
      render: (id) => (
        <span className="font-mono text-xs">#{id?.slice(0, 8)}</span>
      ),
    },
    {
      title: "Type",
      dataPrintdex: "type",
      key: "type",
      width: 100,
      render: (type) => <Tag color={getTypeColor(type)}>{type || "N/A"}</Tag>,
    },
    {
      title: "Student",
      dataPrintdex: "studentName",
      key: "studentName",
      width: 150,
    },
    {
      title: "Test",
      dataPrintdex: "testTitle",
      key: "testTitle",
    },
    {
      title: "Band AI",
      dataPrintdex: "aiBandScore",
      key: "aiBandScore",
      width: 100,
      render: (score) => (
        <span className="font-bold text-blue-600">{score?.toFixed(1) || "N/A"}</span>
      ),
    },
    {
      title: "Band GV",
      dataPrintdex: "teacherBandScore",
      key: "teacherBandScore",
      width: 100,
      render: (score) => (
        <span className="font-bold text-green-600">{score?.toFixed(1) || "N/A"}</span>
      ),
    },
    {
      title: "Commission",
      dataPrintdex: "commissionAmount",
      key: "commissionAmount",
      width: 100,
      render: (amount) => (
        <span className="text-orange-600 font-medium">
          {amount ? `${amount.toLocaleString()} VND` : "-"}
        </span>
      ),
    },
    {
      title: "Graded date",
      dataPrintdex: "submittedAt",
      key: "submittedAt",
      width: 120,
      render: (date) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "N/A",
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewTicket(record)}
        >
          View
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
                Grading queue
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 md:text-base">
                List of Writing/Speaking tests waiting for teacher grading.
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
                  label: "All",
                  children: (
                    <Table
                      columns={pendingColumns}
                      dataSource={pendingTickets}
                      rowKey="idTicket"
                      pagination={{ pageSize: 10 }}
                      locale={{ emptyText: "No tickets." }}
                    />
                  ),
                },
                {
                  key: "claimed",
                  label: "Received",
                  children: (
                    <Table
                      columns={claimedColumns}
                      dataSource={claimedTickets}
                      rowKey="idTicket"
                      pagination={{ pageSize: 10 }}
                      locale={{ emptyText: "No claimed tickets." }}
                    />
                  ),
                },
                {
                  key: "history",
                  label: "History",
                  children: (
                    <Table
                      columns={completedColumns}
                      dataSource={completedTickets}
                      rowKey="idTicket"
                      pagination={{ pageSize: 10 }}
                      locale={{ emptyText: "No graded tests yet." }}
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
                Claim ticket
              </Button>
              <Button
                onClick={() => {
                  setSelectedTicket(null);
                  setTicketDetail(null);
                }}
              >
                Close
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => {
                setSelectedTicket(null);
                setTicketDetail(null);
              }}
            >
              Close
            </Button>
          )
        }
        width={800}
        title={<span className="text-lg font-bold">Detail Ticket</span>}
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
                <Descriptions.Item label="Type">
                  <Tag color={getTypeColor(ticketDetail.type)}>
                    {ticketDetail.type}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Student">
                  {ticketDetail.testResult?.user?.nameUser || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Test">
                  {ticketDetail.testResult?.test?.title || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Band AI">
                  <span className="font-bold text-blue-600">
                    {ticketDetail.aiBandScore || "N/A"}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
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
                            📝 Test
                          </h4>
                          <p className="text-sm text-slate-600 whitespace-pre-wrap mb-2">
                            {task.instructions}
                          </p>
                          {task.taskType === "TASK1" && task.image && (
                            <img
                              src={task.image}
                              alt="Task 1 visual"
                              loading="lazy"
                              className="mt-2 max-h-48 rounded border"
                            />
                          )}
                        </div>
                        <div className="flex-1 bg-blue-50 p-4 rounded-lg border border-blue-100 max-h-[350px] overflow-y-auto">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            👤 Submission
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
                                No submission yet
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
                      👤 Student submission
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
                        {ticketDetail.submissionContent || "No content"}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* AI Feedback - Formatted with Collapse */}
              {ticketDetail.aiFeedback &&
                (() => {
                  const fb = ticketDetail.aiFeedback;
                  const writingItems = [
                    {
                      key: "taskResponse",
                      label: "Task Response",
                      score: fb.taskResponseScore,
                      text: fb.taskResponse,
                    },
                    {
                      key: "coherence",
                      label: "Coherence & Cohesion",
                      score: fb.coherenceScore,
                      text: fb.coherenceAndCohesion,
                    },
                    {
                      key: "lexical",
                      label: "Lexical Resource",
                      score: fb.lexicalScore,
                      text: fb.lexicalResource,
                    },
                    {
                      key: "grammar",
                      label: "Grammatical Range & Accuracy",
                      score: fb.grammarScore,
                      text: fb.grammaticalRangeAndAccuracy,
                    },
                  ];
                  const speakingItems = [
                    {
                      key: "fluency",
                      label: "Fluency & Coherence",
                      score: fb.fluencyScore || fb.scoreFluency,
                      text: fb.fluencyAndCoherence || fb.commentFluency,
                    },
                    {
                      key: "lexical",
                      label: "Lexical Resource",
                      score: fb.lexicalScore || fb.scoreLexical,
                      text: fb.lexicalResource || fb.commentLexical,
                    },
                    {
                      key: "grammar",
                      label: "Grammatical Range",
                      score: fb.grammarScore || fb.scoreGrammar,
                      text: fb.grammaticalRangeAndAccuracy || fb.commentGrammar,
                    },
                    {
                      key: "pronunciation",
                      label: "Pronunciation",
                      score: fb.pronunciationScore || fb.scorePronunciation,
                      text: fb.pronunciation || fb.commentPronunciation,
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
                        🤖 AI Feedback
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
                    📝 Teacher feedback
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
                        rules={[{ required: true, message: "Enter score" }]}
                      >
                        <PrintputNumber
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
                      label="Feedback"
                      rules={[{ required: true, message: "Enter feedback" }]}
                    >
                      <Printput.TextArea
                        rows={3}
                        placeholder="Enter feedback for student..."
                      />
                    </Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={submitting}
                      className="bg-purple-600"
                    >
                      Submit score
                    </Button>
                  </Form>
                </div>
              ) : (
                ticketDetail.teacherBandScore && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100 mt-4">
                    <h4 className="font-semibold mb-2 text-green-800">
                      ✅ Graded
                    </h4>
                    <p className="text-sm">
                      <span className="font-bold">Band Score:</span>{" "}
                      {ticketDetail.teacherBandScore}
                    </p>
                    {ticketDetail.teacherFeedback && (
                      <p className="text-sm mt-1">
                        <span className="font-bold">Feedback:</span>{" "}
                        {typeof ticketDetail.teacherFeedback === "string"
                          ? ticketDetail.teacherFeedback
                          : JSON.stringify(ticketDetail.teacherFeedback)}
                      </p>
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
        title={<span className="text-lg font-bold">Grade test</span>}
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
              Cancel
            </Button>
            <Button
              type="primary"
              loading={submitting}
              onClick={handleSubmitScore}
            >
              Submit score
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
                <Descriptions.Item label="Type">
                  <Tag color={getTypeColor(ticketDetail.type)}>
                    {ticketDetail.type}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Student">
                  {ticketDetail.testResult?.user?.nameUser ||
                    selectedTicket?.studentName ||
                    "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Test" span={2}>
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
                <Descriptions.Item label="Status">
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
                            📝 Test
                          </h4>
                          <p className="text-sm text-slate-600 whitespace-pre-wrap mb-2">
                            {task.instructions}
                          </p>
                          {task.taskType === "TASK1" && task.image && (
                            <img
                              src={task.image}
                              alt="Task 1 visual"
                              loading="lazy"
                              className="mt-2 max-h-48 rounded border"
                            />
                          )}
                        </div>
                        <div className="flex-1 bg-blue-50 p-4 rounded-lg border border-blue-100 max-h-[350px] overflow-y-auto">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            👤 Submission
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
                                No submission yet
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
                      👤 Student submission
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
                        {ticketDetail.submissionContent || "No content"}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* AI Feedback - Formatted with Collapse */}
              {ticketDetail.aiFeedback &&
                (() => {
                  const fb = ticketDetail.aiFeedback;
                  const writingItems = [
                    {
                      key: "taskResponse",
                      label: "Task Response",
                      score: fb.taskResponseScore,
                      text: fb.taskResponse,
                    },
                    {
                      key: "coherence",
                      label: "Coherence & Cohesion",
                      score: fb.coherenceScore,
                      text: fb.coherenceAndCohesion,
                    },
                    {
                      key: "lexical",
                      label: "Lexical Resource",
                      score: fb.lexicalScore,
                      text: fb.lexicalResource,
                    },
                    {
                      key: "grammar",
                      label: "Grammatical Range & Accuracy",
                      score: fb.grammarScore,
                      text: fb.grammaticalRangeAndAccuracy,
                    },
                  ];
                  const speakingItems = [
                    {
                      key: "fluency",
                      label: "Fluency & Coherence",
                      score: fb.fluencyScore || fb.scoreFluency,
                      text: fb.fluencyAndCoherence || fb.commentFluency,
                    },
                    {
                      key: "lexical",
                      label: "Lexical Resource",
                      score: fb.lexicalScore || fb.scoreLexical,
                      text: fb.lexicalResource || fb.commentLexical,
                    },
                    {
                      key: "grammar",
                      label: "Grammatical Range",
                      score: fb.grammarScore || fb.scoreGrammar,
                      text: fb.grammaticalRangeAndAccuracy || fb.commentGrammar,
                    },
                    {
                      key: "pronunciation",
                      label: "Pronunciation",
                      score: fb.pronunciationScore || fb.scorePronunciation,
                      text: fb.pronunciation || fb.commentPronunciation,
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
                        🤖 AI Feedback
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

              {/* Teacher Scoring Form */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-3">Fill in score and feedback:</h4>
                <Form form={form} layout="vertical">
                  <Form.Item
                    name="bandScore"
                    label="Band Score (0 - 9)"
                    rules={[
                      { required: true, message: "Please enter score" },
                      {
                        type: "number",
                        min: 0,
                        max: 9,
                        message: "Score must be 0-9",
                      },
                    ]}
                  >
                    <PrintputNumber
                      min={0}
                      max={9}
                      step={0.5}
                      className="w-full"
                      placeholder="VD: 7.0"
                    />
                  </Form.Item>

                  {isWriting ? (
                    <>
                      <Form.Item
                        name="taskResponse"
                        label="Task Response"
                        rules={[
                          { required: true, message: "Please enter feedback" },
                        ]}
                      >
                        <TextArea
                          rows={2}
                          placeholder="Feedback on idea development, e.g..."
                        />
                      </Form.Item>
                      <Form.Item
                        name="coherenceAndCohesion"
                        label="Coherence & Cohesion"
                        rules={[
                          { required: true, message: "Please enter feedback" },
                        ]}
                      >
                        <TextArea
                          rows={2}
                          placeholder="Feedback on organization, sentence/paragraph linking..."
                        />
                      </Form.Item>
                      <Form.Item
                        name="lexicalResource"
                        label="Lexical Resource"
                        rules={[
                          { required: true, message: "Please enter feedback" },
                        ]}
                      >
                        <TextArea
                          rows={2}
                          placeholder="Feedback on vocabulary..."
                        />
                      </Form.Item>
                      <Form.Item
                        name="grammaticalRangeAndAccuracy"
                        label="Grammatical Range & Accuracy"
                        rules={[
                          { required: true, message: "Please enter feedback" },
                        ]}
                      >
                        <TextArea
                          rows={2}
                          placeholder="Feedback on grammar..."
                        />
                      </Form.Item>
                      <Form.Item
                        name="generalFeedback"
                        label="General Feedback"
                        rules={[
                          { required: true, message: "Please enter feedback" },
                        ]}
                      >
                        <TextArea
                          rows={3}
                          placeholder="General feedback..."
                        />
                      </Form.Item>
                    </>
                  ) : (
                    <>
                      <Form.Item
                        name="fluencyAndCoherence"
                        label="Fluency & Coherence"
                        rules={[
                          { required: true, message: "Please enter feedback" },
                        ]}
                      >
                        <TextArea
                          rows={2}
                          placeholder="Feedback on fluency, coherence..."
                        />
                      </Form.Item>
                      <Form.Item
                        name="lexicalResource"
                        label="Lexical Resource"
                        rules={[
                          { required: true, message: "Please enter feedback" },
                        ]}
                      >
                        <TextArea
                          rows={2}
                          placeholder="Feedback on vocabulary..."
                        />
                      </Form.Item>
                      <Form.Item
                        name="grammaticalRangeAndAccuracy"
                        label="Grammatical Range & Accuracy"
                        rules={[
                          { required: true, message: "Please enter feedback" },
                        ]}
                      >
                        <TextArea
                          rows={2}
                          placeholder="Feedback on grammar..."
                        />
                      </Form.Item>
                      <Form.Item
                        name="pronunciation"
                        label="Pronunciation"
                        rules={[
                          { required: true, message: "Please enter feedback" },
                        ]}
                      >
                        <TextArea
                          rows={2}
                          placeholder="Feedback on pronunciation..."
                        />
                      </Form.Item>
                      <Form.Item
                        name="generalFeedback"
                        label="General Feedback"
                        rules={[
                          { required: true, message: "Please enter feedback" },
                        ]}
                      >
                        <TextArea
                          rows={3}
                          placeholder="General feedback..."
                        />
                      </Form.Item>
                    </>
                  )}
                </Form>
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
};

export default TeacherQueuePage;
