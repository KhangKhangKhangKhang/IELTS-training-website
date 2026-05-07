import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/authContext';
import {
  getStudentTicketsAPI,
  getTicketDetailAPI,
  cancelTicketAPI,
} from '@/services/apiTeacherReview';
import {
  Table,
  Tag,
  Button,
  Modal,
  Tabs,
  Collapse,
  Spin,
  message,
  Card,
  Empty,
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';

const TeacherReviewHistory = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetail, setTicketDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user?.idUser) {
      fetchTickets();
    }
  }, [user?.idUser, activeTab]);

  const fetchTickets = async () => {
    if (!user?.idUser) return;
    setLoading(true);
    try {
      const filters = {};
      if (activeTab !== 'all') {
        filters.status = activeTab.toUpperCase();
      }
      const res = await getStudentTicketsAPI(user.idUser, filters);
      setTickets(res.data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      message.error('Không thể tải danh sách yêu cầu.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (ticket) => {
    setSelectedTicket(ticket);
    setDetailLoading(true);
    try {
      const res = await getTicketDetailAPI(ticket.idTicket);
      setTicketDetail(res.data);
    } catch (err) {
      console.error('Error fetching ticket detail:', err);
      message.error('Không thể tải chi tiết yêu cầu.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCancelTicket = async (idTicket) => {
    try {
      await cancelTicketAPI(idTicket);
      message.success('Đã hủy yêu cầu thành công!');
      fetchTickets();
    } catch (err) {
      console.error('Error cancelling ticket:', err);
      message.error('Không thể hủy yêu cầu.');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'orange';
      case 'CLAIMED':
        return 'blue';
      case 'IN_PROGRESS':
        return 'cyan';
      case 'COMPLETED':
        return 'green';
      case 'CANCELLED':
        return 'red';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'Đang chờ';
      case 'CLAIMED':
        return 'Đã nhận';
      case 'IN_PROGRESS':
        return '�ang chấm';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'idTicket',
      key: 'idTicket',
      width: 100,
      render: (id) => (
        <span className="font-mono text-xs">#{id?.slice(0, 8)}</span>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => (
        <Tag color={type === 'WRITING' ? 'blue' : 'purple'}>
          {type === 'WRITING' ? 'Viết' : 'Nói'}
        </Tag>
      ),
    },
    {
      title: 'Bài test',
      key: 'test',
      render: (_, record) => (
        <span>{record.testResult?.test?.title || 'N/A'}</span>
      ),
    },
    {
      title: 'Band AI',
      dataIndex: 'aiBandScore',
      key: 'aiBandScore',
      width: 80,
      render: (score) => (
        <span className="font-bold text-blue-600">{score?.toFixed(1) || 'N/A'}</span>
      ),
    },
    {
      title: 'Band GV',
      dataIndex: 'teacherBandScore',
      key: 'teacherBandScore',
      width: 80,
      render: (score) => (
        <span className="font-bold text-green-600">
          {score ? score.toFixed(1) : '-'}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: 'Giáo viên',
      key: 'teacher',
      width: 130,
      render: (_, record) =>
        record.teacher?.nameUser || (
          <span className="text-gray-400">Chưa có</span>
        ),
    },
    {
      title: 'Ngày yêu cầu',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) =>
        date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A',
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            Chi tiết
          </Button>
          {record.status === 'PENDING' && (
            <Button
              size="small"
              danger
              onClick={() => handleCancelTicket(record.idTicket)}
            >
              Hủy
            </Button>
          )}
        </div>
      ),
    },
  ];

  const isWriting = ticketDetail?.type === 'WRITING';

  const renderComparison = () => {
    if (!ticketDetail) return null;

    const aiFeedback = ticketDetail.aiFeedback || {};
    const teacherFeedback = ticketDetail.teacherFeedback || {};

    if (ticketDetail.status !== 'COMPLETED') {
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">🤖 Điểm AI</h4>
            <p className="text-lg font-bold text-blue-600">
              Band Score: {ticketDetail.aiBandScore?.toFixed(1) || 'N/A'}
            </p>
          </div>

          {ticketDetail.status === 'PENDING' && (
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <p className="text-orange-800">
                Đang chờ giáo viên nhận bài để chấm...
              </p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Score Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">🤖 Điểm AI</h4>
            <p className="text-3xl font-bold text-blue-600">
              {ticketDetail.aiBandScore?.toFixed(1) || 'N/A'}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">👨‍🏫 Điểm GV</h4>
            <p className="text-3xl font-bold text-green-600">
              {ticketDetail.teacherBandScore?.toFixed(1) || 'N/A'}
            </p>
          </div>
        </div>

        {/* AI Feedback */}
        {(aiFeedback.taskResponse || aiFeedback.generalFeedback) && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h4 className="font-semibold text-blue-800 mb-3">
              🤖 Phản hồi AI
            </h4>
            <Collapse
              items={[
                aiFeedback.taskResponse && {
                  key: '1',
                  label: 'Task Response',
                  children: <p className="whitespace-pre-wrap">{aiFeedback.taskResponse}</p>,
                },
                aiFeedback.coherenceAndCohesion && {
                  key: '2',
                  label: 'Coherence & Cohesion',
                  children: <p className="whitespace-pre-wrap">{aiFeedback.coherenceAndCohesion}</p>,
                },
                aiFeedback.lexicalResource && {
                  key: '3',
                  label: 'Lexical Resource',
                  children: <p className="whitespace-pre-wrap">{aiFeedback.lexicalResource}</p>,
                },
                aiFeedback.grammaticalRangeAndAccuracy && {
                  key: '4',
                  label: 'Grammatical Range',
                  children: <p className="whitespace-pre-wrap">{aiFeedback.grammaticalRangeAndAccuracy}</p>,
                },
                aiFeedback.generalFeedback && {
                  key: '5',
                  label: 'General Feedback',
                  children: <p className="whitespace-pre-wrap">{aiFeedback.generalFeedback}</p>,
                },
              ].filter(Boolean)}
            />
          </div>
        )}

        {/* Teacher Feedback */}
        {(teacherFeedback.taskResponse || teacherFeedback.generalFeedback) && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h4 className="font-semibold text-green-800 mb-3">
              👨‍🏫 Phản hồi Giáo viên
            </h4>
            <Collapse
              items={[
                teacherFeedback.taskResponse && {
                  key: '1',
                  label: 'Task Response',
                  children: <p className="whitespace-pre-wrap">{teacherFeedback.taskResponse}</p>,
                },
                teacherFeedback.coherenceAndCohesion && {
                  key: '2',
                  label: 'Coherence & Cohesion',
                  children: <p className="whitespace-pre-wrap">{teacherFeedback.coherenceAndCohesion}</p>,
                },
                teacherFeedback.lexicalResource && {
                  key: '3',
                  label: 'Lexical Resource',
                  children: <p className="whitespace-pre-wrap">{teacherFeedback.lexicalResource}</p>,
                },
                teacherFeedback.grammaticalRangeAndAccuracy && {
                  key: '4',
                  label: 'Grammatical Range',
                  children: <p className="whitespace-pre-wrap">{teacherFeedback.grammaticalRangeAndAccuracy}</p>,
                },
                teacherFeedback.generalFeedback && {
                  key: '5',
                  label: 'General Feedback',
                  children: <p className="whitespace-pre-wrap">{teacherFeedback.generalFeedback}</p>,
                },
              ].filter(Boolean)}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-6 transition-colors duration-300">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Header */}
        <header className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white/85 dark:bg-slate-800/95 p-5 shadow-sm backdrop-blur-sm md:p-6 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-indigo-600">
              <ClockCircleOutlined className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white md:text-3xl">
                Lịch sử yêu cầu chấm bài
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 md:text-base">
                Theo dõi tiến độ yêu cầu giáo viên chấm bài Writing/Speaking của bạn.
              </p>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <Card className="shadow-sm dark:bg-slate-800/95">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'all', label: 'Tất cả' },
              { key: 'pending', label: 'Đang chờ' },
              { key: 'completed', label: 'Hoàn thành' },
              { key: 'cancelled', label: 'Đã hủy' },
            ]}
          />

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Spin size="large" />
            </div>
          ) : tickets.length === 0 ? (
            <Empty description="Chưa có yêu cầu nào" />
          ) : (
            <Table
              columns={columns}
              dataSource={tickets}
              rowKey="idTicket"
              pagination={{ pageSize: 10 }}
            />
          )}
        </Card>
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!selectedTicket}
        onCancel={() => {
          setSelectedTicket(null);
          setTicketDetail(null);
        }}
        footer={null}
        width={800}
        title={<span className="text-lg font-bold">Chi tiết yêu cầu</span>}
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spin />
          </div>
        ) : (
          ticketDetail && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Loại</p>
                  <Tag color={ticketDetail.type === 'WRITING' ? 'blue' : 'purple'}>
                    {ticketDetail.type === 'WRITING' ? 'Viết' : 'Nói'}
                  </Tag>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trạng thái</p>
                  <Tag color={getStatusColor(ticketDetail.status)}>
                    {getStatusText(ticketDetail.status)}
                  </Tag>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bài test</p>
                  <p className="font-medium">
                    {ticketDetail.testResult?.test?.title || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Giáo viên</p>
                  <p className="font-medium">
                    {ticketDetail.teacher?.nameUser || 'Chưa có'}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-3">So sánh điểm & Phản hồi</h4>
                {renderComparison()}
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
};

export default TeacherReviewHistory;
