import React, { useState, useRef } from "react";
import {
  Card,
  Table,
  Button,
  Select,
  DatePicker,
  Tabs,
  Tag,
  Row,
  Col,
  Statistic,
  Divider,
  Collapse,
  List,
} from "antd";
import {
  DownloadOutlined,
  BarChartOutlined,
  CalendarOutlined,
  RiseOutlined,
  FallOutlined,
  InfoCircleOutlined,
  CaretDownOutlined,
} from "@ant-design/icons";
import { useReactToPrint } from "react-to-print";

const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

// Component chính
const CashFlowDetailPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [comparisonType, setComparisonType] = useState("cashflow");
  const [assetType, setAssetType] = useState("all");
  const [activeIncomeKeys, setActiveIncomeKeys] = useState([]);
  const [activeExpenseKeys, setActiveExpenseKeys] = useState([]);

  // Dữ liệu mẫu
  const transactionData = [
    {
      id: 1,
      name: "Mua AAPL",
      type: "stock",
      quantity: 10,
      amount: 1500.5,
      date: "2023-10-15",
      price: 150.05,
    },
    {
      id: 2,
      name: "Bán BTC",
      type: "crypto",
      quantity: 0.5,
      amount: 13500.75,
      date: "2023-10-12",
      price: 27001.5,
    },
    {
      id: 3,
      name: "Mua TSLA",
      type: "stock",
      quantity: 5,
      amount: 1250.25,
      date: "2023-10-10",
      price: 250.05,
    },
    {
      id: 4,
      name: "Mua ETH",
      type: "crypto",
      quantity: 2,
      amount: 3200.0,
      date: "2023-10-05",
      price: 1600.0,
    },
    {
      id: 5,
      name: "Bán MSFT",
      type: "stock",
      quantity: 8,
      amount: 2560.8,
      date: "2023-10-01",
      price: 320.1,
    },
  ];

  // Dữ liệu chi tiết thu nhập và chi tiêu
  const incomeDetailData = {
    "2023-09": [
      { source: "Lương tháng", amount: 5000, type: "fixed" },
      { source: "Cổ tức AAPL", amount: 1500, type: "investment" },
      { source: "Cổ tức MSFT", amount: 2000, type: "investment" },
      { source: "Lãi từ Bitcoin", amount: 3500, type: "crypto" },
    ],
    "2023-10": [
      { source: "Lương tháng", amount: 5000, type: "fixed" },
      { source: "Cổ tức AAPL", amount: 1800, type: "investment" },
      { source: "Cổ tức TSLA", amount: 2400, type: "investment" },
      { source: "Lãi từ Ethereum", amount: 4200, type: "crypto" },
    ],
  };

  const expenseDetailData = {
    "2023-09": [
      {
        category: "Ăn uống",
        amount: 800,
        items: ["Nhà hàng: $300", "Siêu thị: $500"],
      },
      {
        category: "Đầu tư",
        amount: 2500,
        items: ["Mua cổ phiếu: $1500", "Mua crypto: $1000"],
      },
      {
        category: "Giải trí",
        amount: 300,
        items: ["Xem phim: $100", "Du lịch: $200"],
      },
      {
        category: "Hóa đơn",
        amount: 600,
        items: ["Điện nước: $300", "Internet: $150", "Điện thoại: $150"],
      },
    ],
    "2023-10": [
      {
        category: "Ăn uống",
        amount: 950,
        items: ["Nhà hàng: $400", "Siêu thị: $550"],
      },
      {
        category: "Đầu tư",
        amount: 3550,
        items: ["Mua cổ phiếu: $2750", "Mua crypto: $800"],
      },
      {
        category: "Giải trí",
        amount: 450,
        items: ["Xem phim: $150", "Concert: $300"],
      },
      {
        category: "Hóa đơn",
        amount: 800,
        items: ["Điện nước: $400", "Internet: $200", "Điện thoại: $200"],
      },
    ],
  };

  // Dữ liệu so sánh mẫu
  const comparisonData = {
    cashflow: {
      "2023-09": {
        income: 8500,
        expense: 4200,
        net: 4300,
      },
      "2023-10": {
        income: 9200,
        expense: 5750,
        net: 3450,
      },
    },
    prices: {
      AAPL: {
        "2023-09": {
          open: 148.5,
          close: 150.75,
          high: 152.3,
          low: 147.8,
          change: 1.52,
        },
        "2023-10": {
          open: 150.05,
          close: 153.8,
          high: 155.2,
          low: 149.5,
          change: 2.5,
        },
      },
    },
  };

  const componentRef = useRef();

  // Hàm xử lý xuất PDF
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: "Chi tiết dòng tiền",
  });

  // Định dạng cột cho bảng
  const columns = [
    {
      title: "Tên giao dịch",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Loại giao dịch",
      dataIndex: "type",
      key: "type",
      render: (type) => (
        <Tag color={type === "stock" ? "blue" : "purple"}>
          {type === "stock" ? "Cổ phiếu" : "Crypto"}
        </Tag>
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      render: (price) => `$${price.toLocaleString()}`,
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => `$${amount.toLocaleString()}`,
    },
    {
      title: "Thời điểm",
      dataIndex: "date",
      key: "date",
    },
  ];

  // Lọc dữ liệu theo loại tài sản
  const filteredData =
    assetType === "all"
      ? transactionData
      : transactionData.filter((item) => item.type === assetType);

  // Hàm xử lý mở/đóng collapse
  const handleIncomeCollapse = (key) => {
    setActiveIncomeKeys(key);
  };

  const handleExpenseCollapse = (key) => {
    setActiveExpenseKeys(key);
  };

  // Hàm render chi tiết thu nhập
  const renderIncomeDetail = (period) => (
    <Collapse
      activeKey={activeIncomeKeys}
      onChange={handleIncomeCollapse}
      expandIcon={({ isActive }) => (
        <CaretDownOutlined rotate={isActive ? 180 : 0} />
      )}
    >
      <Panel
        header="Chi tiết thu nhập"
        key="income-detail"
        extra={<InfoCircleOutlined />}
      >
        <List
          dataSource={incomeDetailData[period]}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={item.source}
                description={
                  <Tag
                    color={
                      item.type === "fixed"
                        ? "green"
                        : item.type === "investment"
                        ? "blue"
                        : "purple"
                    }
                  >
                    {item.type === "fixed"
                      ? "Cố định"
                      : item.type === "investment"
                      ? "Đầu tư"
                      : "Crypto"}
                  </Tag>
                }
              />
              <div style={{ fontWeight: "bold", color: "#3f8600" }}>
                +${item.amount.toLocaleString()}
              </div>
            </List.Item>
          )}
        />
      </Panel>
    </Collapse>
  );

  // Hàm render chi tiết chi tiêu
  const renderExpenseDetail = (period) => (
    <Collapse
      activeKey={activeExpenseKeys}
      onChange={handleExpenseCollapse}
      expandIcon={({ isActive }) => (
        <CaretDownOutlined rotate={isActive ? 180 : 0} />
      )}
    >
      <Panel
        header="Chi tiết chi tiêu"
        key="expense-detail"
        extra={<InfoCircleOutlined />}
      >
        <List
          dataSource={expenseDetailData[period]}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={item.category}
                description={
                  <div>
                    {item.items.map((subItem, index) => (
                      <div
                        key={index}
                        style={{ fontSize: "12px", color: "#666" }}
                      >
                        {subItem}
                      </div>
                    ))}
                  </div>
                }
              />
              <div style={{ fontWeight: "bold", color: "#cf1322" }}>
                -${item.amount.toLocaleString()}
              </div>
            </List.Item>
          )}
        />
      </Panel>
    </Collapse>
  );

  return (
    <div
      ref={componentRef}
      style={{
        padding: "24px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: "#0f172b",
                margin: 0,
              }}
            >
              Chi Tiết Dòng Tiền
            </h1>
            <p style={{ color: "#666", margin: 0 }}>Tháng 10, 2023</p>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handlePrint}
              style={{ marginRight: 8 }}
            >
              Xuất PDF
            </Button>
            <Button
              type="primary"
              icon={<BarChartOutlined />}
              style={{ backgroundColor: "#0f172b", borderColor: "#0f172b" }}
            >
              So Sánh
            </Button>
          </Col>
        </Row>
      </div>

      {/* Bộ lọc */}
      <Card style={{ marginBottom: 24 }}>
        <Row align="middle" gutter={16}>
          <Col>
            <CalendarOutlined style={{ color: "#666" }} />
            <span style={{ marginLeft: 8, fontWeight: 500 }}>
              Loại tài sản:
            </span>
          </Col>
          <Col>
            <Select
              value={assetType}
              onChange={setAssetType}
              style={{ width: 120 }}
            >
              <Option value="all">Tất cả</Option>
              <Option value="stock">Cổ phiếu</Option>
              <Option value="crypto">Crypto</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Bảng chi tiết giao dịch */}
      <Card
        title={
          <span>
            <BarChartOutlined style={{ marginRight: 8 }} />
            Chi Tiết Giao Dịch
          </span>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* Phần so sánh */}
      <Card
        title={
          <span>
            <BarChartOutlined style={{ marginRight: 8 }} />
            So Sánh
          </span>
        }
      >
        <Tabs
          activeKey={comparisonType}
          onChange={setComparisonType}
          type="card"
        >
          {/* So sánh thu chi */}
          <TabPane tab="So sánh Thu/Chi" key="cashflow">
            <div style={{ marginBottom: 16 }}>
              <Row gutter={16} align="middle">
                <Col>
                  <span style={{ fontWeight: 500 }}>So sánh theo:</span>
                </Col>
                <Col>
                  <Select
                    value={selectedPeriod}
                    onChange={setSelectedPeriod}
                    style={{ width: 100 }}
                  >
                    <Option value="month">Tháng</Option>
                    <Option value="year">Năm</Option>
                  </Select>
                </Col>
                <Col>
                  <DatePicker
                    picker={selectedPeriod}
                    placeholder="Kỳ thứ nhất"
                  />
                </Col>
                <Col>
                  <DatePicker
                    picker={selectedPeriod}
                    placeholder="Kỳ thứ hai"
                  />
                </Col>
              </Row>
            </div>

            <Row gutter={16}>
              <Col span={12}>
                <Card
                  title="Tháng 9, 2023"
                  size="small"
                  extra={<InfoCircleOutlined style={{ color: "#1890ff" }} />}
                >
                  <Statistic
                    title="Tổng thu"
                    value={comparisonData.cashflow["2023-09"].income}
                    prefix="$"
                    valueStyle={{ color: "#3f8600" }}
                    suffix={<RiseOutlined />}
                  />
                  {renderIncomeDetail("2023-09")}

                  <Divider />

                  <Statistic
                    title="Tổng chi"
                    value={comparisonData.cashflow["2023-09"].expense}
                    prefix="$"
                    valueStyle={{ color: "#cf1322" }}
                    suffix={<FallOutlined />}
                  />
                  {renderExpenseDetail("2023-09")}

                  <Divider />

                  <Statistic
                    title="Chênh lệch"
                    value={comparisonData.cashflow["2023-09"].net}
                    prefix="$"
                    valueStyle={{
                      color:
                        comparisonData.cashflow["2023-09"].net > 0
                          ? "#3f8600"
                          : "#cf1322",
                    }}
                  />
                </Card>
              </Col>

              <Col span={12}>
                <Card
                  title="Tháng 10, 2023"
                  size="small"
                  extra={<InfoCircleOutlined style={{ color: "#1890ff" }} />}
                >
                  <Statistic
                    title="Tổng thu"
                    value={comparisonData.cashflow["2023-10"].income}
                    prefix="$"
                    valueStyle={{ color: "#3f8600" }}
                    suffix={<RiseOutlined />}
                  />
                  {renderIncomeDetail("2023-10")}

                  <Divider />

                  <Statistic
                    title="Tổng chi"
                    value={comparisonData.cashflow["2023-10"].expense}
                    prefix="$"
                    valueStyle={{ color: "#cf1322" }}
                    suffix={<FallOutlined />}
                  />
                  {renderExpenseDetail("2023-10")}

                  <Divider />

                  <Statistic
                    title="Chênh lệch"
                    value={comparisonData.cashflow["2023-10"].net}
                    prefix="$"
                    valueStyle={{
                      color:
                        comparisonData.cashflow["2023-10"].net > 0
                          ? "#3f8600"
                          : "#cf1322",
                    }}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* So sánh giá */}
          <TabPane tab="So sánh Giá" key="prices">
            <div style={{ marginBottom: 16 }}>
              <Row gutter={16} align="middle">
                <Col>
                  <span style={{ fontWeight: 500 }}>Tài sản:</span>
                </Col>
                <Col>
                  <Select defaultValue="AAPL" style={{ width: 150 }}>
                    <Option value="AAPL">Apple (AAPL)</Option>
                    <Option value="BTC">Bitcoin (BTC)</Option>
                    <Option value="ETH">Ethereum (ETH)</Option>
                  </Select>
                </Col>
                <Col>
                  <RangePicker placeholder={["Từ ngày", "Đến ngày"]} />
                </Col>
                <Col>
                  <RangePicker placeholder={["Từ ngày", "Đến ngày"]} />
                </Col>
              </Row>
            </div>

            <Row gutter={16}>
              <Col span={12}>
                <Card title="Tháng 9, 2023" size="small">
                  <Statistic
                    title="Giá mở cửa"
                    value={comparisonData.prices.AAPL["2023-09"].open}
                    prefix="$"
                    precision={2}
                  />
                  <Divider />
                  <Statistic
                    title="Giá đóng cửa"
                    value={comparisonData.prices.AAPL["2023-09"].close}
                    prefix="$"
                    precision={2}
                  />
                  <Divider />
                  <Statistic
                    title="Giá cao nhất"
                    value={comparisonData.prices.AAPL["2023-09"].high}
                    prefix="$"
                    precision={2}
                  />
                  <Divider />
                  <Statistic
                    title="Giá thấp nhất"
                    value={comparisonData.prices.AAPL["2023-09"].low}
                    prefix="$"
                    precision={2}
                  />
                  <Divider />
                  <Statistic
                    title="Thay đổi"
                    value={comparisonData.prices.AAPL["2023-09"].change}
                    suffix="%"
                    valueStyle={{ color: "#3f8600" }}
                    prefix={<RiseOutlined />}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Tháng 10, 2023" size="small">
                  <Statistic
                    title="Giá mở cửa"
                    value={comparisonData.prices.AAPL["2023-10"].open}
                    prefix="$"
                    precision={2}
                  />
                  <Divider />
                  <Statistic
                    title="Giá đóng cửa"
                    value={comparisonData.prices.AAPL["2023-10"].close}
                    prefix="$"
                    precision={2}
                  />
                  <Divider />
                  <Statistic
                    title="Giá cao nhất"
                    value={comparisonData.prices.AAPL["2023-10"].high}
                    prefix="$"
                    precision={2}
                  />
                  <Divider />
                  <Statistic
                    title="Giá thấp nhất"
                    value={comparisonData.prices.AAPL["2023-10"].low}
                    prefix="$"
                    precision={2}
                  />
                  <Divider />
                  <Statistic
                    title="Thay đổi"
                    value={comparisonData.prices.AAPL["2023-10"].change}
                    suffix="%"
                    valueStyle={{ color: "#3f8600" }}
                    prefix={<RiseOutlined />}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default CashFlowDetailPage;
