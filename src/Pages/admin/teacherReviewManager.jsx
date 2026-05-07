import React, { useEffect, useState } from 'react';
import {
  getAllTicketsAdminAPI,
  getTicketStatsAPI,
  getTeachersLoadAPI,
  getAssignModeAPI,
  updateAssignModeAPI,
} from '@/services/apiTeacherReview';
import {
  Table,
  Tag,
  Button,
  Modal,
  Tabs,
  Spin,
  message,
  Card,
  Statistic,
  Row,
  Col,
  Switch,
  Select,
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  TeamOutlined,
  DashboardOutlined,
} from '@ant-design/icons';

const TeacherReviewManager = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    claimed: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    totalCommission: 0,
  });
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [assignMode, setAssignMode] = useState('MANUAL');
  const [updatingMode, setUpdatingMode] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, statsRes, teachersRes, modeRes] = await Promise.all([
        getAllTicketsAdminAPI({
          status: activeTab === 'ALL' ? undefined : activeTab,
        }),
        getTicketStatsAPI(),
        getTeachersLoadAPI(),
        getAssignModeAPI(),
      ]);

      setTickets(ticketsRes.data || []);
      setStats(statsRes);
      setTeachers(teachersRes);
      setAssignMode(modeRes.mode || 'MANUAL');
    } catch (err) {
      console.error('Error fetching data:', err);
      message.error('Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAssignMode = async (checked) => {
    const newMode = checked ? 'AUTO' : 'MANUAL';
    setUpdatingMode(true);
    try {
      await updateAssignModeAPI(newMode);
      setAssignMode(newMode);
      message.success(`Đã chuyển sang chế độ ${newMode === 'AUTO' ? 'tự động' : 'thủ công'}`);
    } catch (err) {
      console.error('Error updating mode:', err);
      message.error('Không thể cập nhật chế độ.');
    } finally {
      setUpdatingMode(false);
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
        return 'Chờ';
      case 'CLAIMED':
        return 'Đã nhận';
      case 'IN_PROGRESS':
        return 'Đang chấm';
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
      title: 'Học viên',
      key: 'student',
      render: (_, record) => (
        <div>
          <p className="font-medium">
            {record.testResult?.user?.nameUser || 'N/A'}
          </p>
        </div>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 80,
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
      width: 70,
      render: (score) => (
        <span className="font-bold text-blue-600">
          {score?.toFixed(1) || 'N/A'}
        </span>
      ),
    },
    {
      title: 'Band GV',
      dataIndex: 'teacherBandScore',
      key: 'teacherBandScore',
      width: 70,
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
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: 'Giáo viên',
      key: 'teacher',
      width: 120,
      render: (_, record) =>
        record.teacher?.nameUser || (
          <span className="text-gray-400">Chưa có</span>
        ),
    },
    {
      title: 'Commission',
      dataIndex: 'commissionAmount',
      key: 'commissionAmount',
      width: 100,
      render: (amount) => (
        <span className="text-orange-600 font-medium">
          {amount ? `${amount.toLocaleString()}đ` : '-'}
        </span>
      ),
    },
    {
      title: 'Ngày',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 100,
      render: (date) =>
        date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-6 transition-colors duration-300">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Header */}
        <header className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white/85 dark:bg-slate-800/95 p-5 shadow-sm backdrop-blur-sm md:p-6 transition-colors duration-300">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-indigo-600">
                <TeamOutlined className="text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white md:text-3xl">
                  Quản lý Chấm bài Giáo viên
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Theo dõi và quản lý các yêu cầu chấm bài
                </p>
              </div>
            </div>

            {/* Assign Mode Toggle */}
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
              <span className="text-sm font-medium">Chế độ phân công:</span>
              <Switch
                checked={assignMode === 'AUTO'}
                onChange={handleToggleAssignMode}
                loading={updatingMode}
                checkedChildren="Tự động"
                unCheckedChildren="Thủ công"
              />
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Đang chờ"
                value={stats.pending}
                valueStyle={{ color: '#fa8c16' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Đã nhận"
                value={stats.claimed}
                valueStyle={{ color: '#1890ff' }}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Đang chấm"
                value={stats.inProgress}
                valueStyle={{ color: '#13c2c2' }}
                prefix={<DashboardOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Hoàn thành"
                value={stats.completed}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Teachers Load */}
        <Card title="Tải công việc của Giáo viên" size="small">
          <div className="flex flex-wrap gap-4">
            {teachers.map((teacher) => (
              <div
                key={teacher.idUser}
                className="bg-slate-50 dark:bg-slate-700 px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <span className="font-medium">{teacher.nameUser}</span>
                <Tag color={teacher.currentLoad > 5 ? 'red' : 'green'}>
                  {teacher.currentLoad} ticket
                </Tag>
              </div>
            ))}
          </div>
        </Card>

        {/* Tickets Table */}
        <Card className="shadow-sm dark:bg-slate-800/95">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'ALL', label: `Tất cả (${stats.pending + stats.claimed + stats.inProgress + stats.completed + stats.cancelled})` },
              { key: 'PENDING', label: `Chờ (${stats.pending})` },
              { key: 'CLAIMED', label: `Đã nhận (${stats.claimed})` },
              { key: 'IN_PROGRESS', label: `Đang chấm (${stats.inProgress})` },
              { key: 'COMPLETED', label: `Hoàn thành (${stats.completed})` },
              { key: 'CANCELLED', label: `Đã hủy (${stats.cancelled})` },
            ]}
          />

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Spin size="large" />
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={tickets}
              rowKey="idTicket"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default TeacherReviewManager;
