import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Popconfirm,
  message,
} from "antd";
import { Card, PillButton, Badge, StatCard } from "@/components/magicpath/ielts-admin-dashboard/adminUI";
import {
  adminListPackagesAPI,
  adminCreatePackageAPI,
  adminUpdatePackageAPI,
  adminTogglePackageActiveAPI,
  adminDeletePackageAPI,
} from "@/services/apiAdminSubscription";

const { TextArea } = Input;

const fmtPrice = (n) =>
  new Intl.NumberFormat("vi-VN").format(n ?? 0) + " ₫";

const AdminSubscriptionPackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await adminListPackagesAPI();
      const list = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
      setPackages(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("fetch packages failed", e);
      message.error("Không tải được danh sách gói");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setModalOpen(true);
  };

  // Sync form values when modal opens or editing target changes.
  // Form unmounts on Modal close (destroyOnClose), so we set values
  // after the next paint to ensure the Form instance is alive.
  useEffect(() => {
    if (!modalOpen) return;
    const apply = () => {
      if (editing) {
        form.setFieldsValue({
          ...editing,
          features: Array.isArray(editing.features) ? editing.features : [],
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          billingCycle: "MONTHLY",
          priceUnit: "VND",
          creditsQuota: 0,
          isFeatured: false,
          isActive: true,
          sortOrder: 0,
          features: [],
        });
      }
    };
    const t = setTimeout(apply, 0);
    return () => clearTimeout(t);
  }, [modalOpen, editing, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await adminUpdatePackageAPI(editing.idPackage, values);
        message.success("Đã cập nhật gói");
      } else {
        await adminCreatePackageAPI(values);
        message.success("Đã tạo gói mới");
      }
      setModalOpen(false);
      fetchAll();
    } catch (e) {
      if (e?.errorFields) return;
      console.error(e);
      message.error("Lưu gói thất bại");
    }
  };

  const handleToggleActive = async (idPackage, next) => {
    const prev = packages;
    setPackages((p) =>
      p.map((it) => (it.idPackage === idPackage ? { ...it, isActive: next } : it))
    );
    try {
      await adminTogglePackageActiveAPI(idPackage, next);
      message.success(next ? "Đã kích hoạt" : "Đã ngừng kích hoạt");
    } catch (e) {
      console.error(e);
      message.error("Cập nhật trạng thái thất bại");
      setPackages(prev);
    }
  };

  const handleDelete = async (idPackage) => {
    try {
      await adminDeletePackageAPI(idPackage);
      message.success("Đã ngừng kích hoạt gói");
      fetchAll();
    } catch (e) {
      console.error(e);
      message.error("Xóa thất bại");
    }
  };

  const activeCount = packages.filter((p) => p.isActive).length;
  const featuredCount = packages.filter((p) => p.isFeatured).length;
  const unlimitedCount = packages.filter((p) => p.creditsQuota === 0).length;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f1f1f6] via-[#eef2ff] to-[#f1f1f6] py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        {/* Header */}
        <Card className="!p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#a855f7] to-[#c084fc] flex items-center justify-center text-2xl shadow-[0_4px_0_#7e22ce]">
                👑
              </div>
              <div>
                <h1 className="text-2xl font-black text-[#1e1b4b]">
                  Quản lý gói đăng ký
                </h1>
                <p className="text-sm text-[#64748b] font-medium">
                  Tạo, sửa, ngừng kích hoạt các gói subscription cho người dùng.
                </p>
              </div>
            </div>
            <button
              onClick={openCreate}
              className="px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide rounded-2xl bg-[#a855f7] text-white border-2 border-[#a855f7] shadow-[0_4px_0_#7e22ce] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_2px_0_#7e22ce] transition-all"
            >
              + Thêm gói
            </button>
          </div>
        </Card>

        {/* Stat cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Tổng số gói"
            value={packages.length}
            icon="📦"
            tone="indigo"
            footer={<Badge tone="indigo">Tất cả</Badge>}
          />
          <StatCard
            label="Đang hoạt động"
            value={activeCount}
            icon="✅"
            tone="cyan"
            footer={<Badge tone="cyan">Active</Badge>}
          />
          <StatCard
            label="Nổi bật"
            value={featuredCount}
            icon="⭐"
            tone="amber"
            footer={<Badge tone="amber">Featured</Badge>}
          />
          <StatCard
            label="Không giới hạn"
            value={unlimitedCount}
            icon="♾️"
            tone="purple"
            footer={<Badge tone="purple">Credits = 0</Badge>}
          />
        </section>

        {/* Table card */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold text-[#1e1b4b]">
              Danh sách gói
            </h2>
            <button
              onClick={fetchAll}
              className="text-xs font-extrabold text-[#6366f1] hover:scale-110 transition-transform"
            >
              ↻ Làm mới
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-sm font-bold text-[#64748b]">
              Đang tải…
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-2">📦</div>
              <p className="text-sm font-bold text-[#64748b]">
                Chưa có gói nào. Bấm "+ Thêm gói" để tạo.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-extrabold uppercase tracking-wide text-[#64748b]">
                    <th className="py-3 px-3">Tên</th>
                    <th className="py-3 px-3">Chu kỳ</th>
                    <th className="py-3 px-3">Giá</th>
                    <th className="py-3 px-3">Credits</th>
                    <th className="py-3 px-3">Badge</th>
                    <th className="py-3 px-3">Nổi bật</th>
                    <th className="py-3 px-3">Hoạt động</th>
                    <th className="py-3 px-3">Thứ tự</th>
                    <th className="py-3 px-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((r) => (
                    <tr
                      key={r.idPackage}
                      className="border-t-2 border-[#e6e6ed] hover:bg-[#f8f8fc] transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-[#1e1b4b] text-sm">
                          {r.name}
                        </div>
                        {r.description && (
                          <div className="text-xs text-[#64748b] font-medium truncate max-w-xs">
                            {r.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <Badge tone={r.billingCycle === "ANNUAL" ? "purple" : "indigo"}>
                          {r.billingCycle === "ANNUAL" ? "Hàng năm" : "Hàng tháng"}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-extrabold text-[#1e1b4b] text-sm">
                        {fmtPrice(r.price)}
                      </td>
                      <td className="py-3 px-3 text-sm font-bold text-[#1e1b4b]">
                        {r.creditsQuota === 0 ? (
                          <Badge tone="cyan">Không giới hạn</Badge>
                        ) : (
                          r.creditsQuota
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {r.badge ? (
                          <Badge tone="amber">⭐ {r.badge}</Badge>
                        ) : (
                          <span className="text-[#64748b]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {r.isFeatured ? (
                          <Badge tone="purple">Featured</Badge>
                        ) : (
                          <span className="text-[#64748b]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <Switch
                          checked={!!r.isActive}
                          onChange={(next) => handleToggleActive(r.idPackage, next)}
                        />
                      </td>
                      <td className="py-3 px-3 text-sm font-bold text-[#64748b]">
                        {r.sortOrder}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => openEdit(r)}
                            className="px-3 py-1.5 text-xs font-extrabold uppercase rounded-xl bg-white border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] text-[#6366f1] hover:border-[#6366f1] active:translate-y-[1px] active:shadow-none transition-all"
                          >
                            Sửa
                          </button>
                          <Popconfirm
                            title="Ngừng kích hoạt gói này?"
                            okText="Ngừng"
                            cancelText="Hủy"
                            onConfirm={() => handleDelete(r.idPackage)}
                          >
                            <button className="px-3 py-1.5 text-xs font-extrabold uppercase rounded-xl bg-[#fb7185] text-white border-2 border-[#fb7185] shadow-[0_2px_0_#e11d48] hover:brightness-110 active:translate-y-[1px] active:shadow-none transition-all">
                              Xóa
                            </button>
                          </Popconfirm>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={editing ? "Lưu thay đổi" : "Tạo gói"}
        cancelText="Hủy"
        width={760}
        destroyOnClose
        footer={null}
        closable={false}
        styles={{
          content: {
            padding: 0,
            borderRadius: 24,
            border: "2px solid #e6e6ed",
            boxShadow: "0 6px 0 #e6e6ed",
            overflow: "hidden",
          },
          body: { padding: 0 },
        }}
      >
        {/* Header strip */}
        <div className="relative px-6 py-5 bg-gradient-to-br from-[#a855f7] via-[#c084fc] to-[#f0abfc] border-b-2 border-[#7e22ce]">
          <button
            onClick={() => setModalOpen(false)}
            className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white border-2 border-[#7e22ce] shadow-[0_2px_0_#7e22ce] text-[#7e22ce] font-black text-base hover:bg-[#fdf4ff] active:translate-y-[1px] active:shadow-none transition-all"
          >
            ✕
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white border-2 border-[#7e22ce] shadow-[0_3px_0_#7e22ce] flex items-center justify-center text-2xl">
              {editing ? "✏️" : "✨"}
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-white/80">
                {editing ? "Chỉnh sửa" : "Tạo mới"}
              </div>
              <h2 className="text-xl font-black text-white leading-tight">
                {editing ? editing.name : "Gói đăng ký mới"}
              </h2>
              <p className="text-xs text-white/90 font-medium mt-0.5">
                {editing
                  ? "Cập nhật thông tin gói bên dưới"
                  : "Điền thông tin để thêm gói mới"}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 bg-white max-h-[70vh] overflow-y-auto">
          <Form form={form} layout="vertical" preserve={false}>
            {/* Section: Thông tin cơ bản */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-[#ede9fe] border-2 border-[#a855f7] flex items-center justify-center text-sm">
                  📝
                </span>
                <span className="text-sm font-extrabold uppercase tracking-wide text-[#1e1b4b]">
                  Thông tin cơ bản
                </span>
              </div>
              <div className="space-y-3 pl-1">
                <Form.Item
                  label={<span className="font-bold text-[#1e1b4b]">Tên gói</span>}
                  name="name"
                  rules={[{ required: true, message: "Nhập tên gói" }]}
                  className="!mb-2"
                >
                  <Input
                    placeholder="Monthly Pro"
                    size="large"
                    style={{ borderRadius: 12, borderWidth: 2 }}
                  />
                </Form.Item>
                <Form.Item
                  label={<span className="font-bold text-[#1e1b4b]">Mô tả</span>}
                  name="description"
                  className="!mb-0"
                >
                  <TextArea
                    rows={2}
                    placeholder="Mô tả ngắn về gói"
                    style={{ borderRadius: 12, borderWidth: 2 }}
                  />
                </Form.Item>
              </div>
            </div>

            {/* Section: Giá & chu kỳ */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-[#fef3c7] border-2 border-[#f59e0b] flex items-center justify-center text-sm">
                  💰
                </span>
                <span className="text-sm font-extrabold uppercase tracking-wide text-[#1e1b4b]">
                  Giá & chu kỳ
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pl-1">
                <Form.Item
                  label={<span className="font-bold text-[#1e1b4b]">Chu kỳ</span>}
                  name="billingCycle"
                  rules={[{ required: true, message: "Chọn chu kỳ" }]}
                  className="!mb-0"
                >
                  <Select
                    size="large"
                    style={{ borderRadius: 12 }}
                    options={[
                      { value: "MONTHLY", label: "📅 Hàng tháng" },
                      { value: "ANNUAL", label: "📆 Hàng năm" },
                    ]}
                  />
                </Form.Item>
                <Form.Item
                  label={<span className="font-bold text-[#1e1b4b]">Giá (VND)</span>}
                  name="price"
                  rules={[{ required: true, message: "Nhập giá" }]}
                  className="!mb-0"
                >
                  <InputNumber
                    min={0}
                    style={{ width: "100%", borderRadius: 12 }}
                    size="large"
                    formatter={(v) =>
                      `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(v) => Number((v ?? "").replace(/,/g, ""))}
                  />
                </Form.Item>
              </div>
            </div>

            {/* Section: Quota & tính năng */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-[#cffafe] border-2 border-[#06b6d4] flex items-center justify-center text-sm">
                  ⚡
                </span>
                <span className="text-sm font-extrabold uppercase tracking-wide text-[#1e1b4b]">
                  Quota & tính năng
                </span>
              </div>
              <div className="space-y-3 pl-1">
                <div className="grid grid-cols-2 gap-3">
                  <Form.Item
                    label={
                      <span className="font-bold text-[#1e1b4b]">
                        Credits quota
                        <span className="ml-1 text-xs font-medium text-[#64748b]">
                          (0 = ∞)
                        </span>
                      </span>
                    }
                    name="creditsQuota"
                    rules={[{ required: true, message: "Nhập credits" }]}
                    className="!mb-0"
                  >
                    <InputNumber
                      min={0}
                      style={{ width: "100%", borderRadius: 12 }}
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item
                    label={<span className="font-bold text-[#1e1b4b]">Đơn vị giá</span>}
                    name="priceUnit"
                    className="!mb-0"
                  >
                    <Input
                      placeholder="VND"
                      size="large"
                      style={{ borderRadius: 12, borderWidth: 2 }}
                    />
                  </Form.Item>
                </div>
                <Form.Item
                  label={<span className="font-bold text-[#1e1b4b]">Tính năng</span>}
                  name="features"
                  className="!mb-0"
                >
                  <Select
                    mode="tags"
                    size="large"
                    placeholder="Nhập và Enter để thêm"
                    style={{ borderRadius: 12 }}
                  />
                </Form.Item>
              </div>
            </div>

            {/* Section: Hiển thị */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-[#fce7f3] border-2 border-[#ec4899] flex items-center justify-center text-sm">
                  🎨
                </span>
                <span className="text-sm font-extrabold uppercase tracking-wide text-[#1e1b4b]">
                  Hiển thị
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pl-1">
                <Form.Item
                  label={<span className="font-bold text-[#1e1b4b]">Badge</span>}
                  name="badge"
                  className="!mb-0"
                >
                  <Input
                    placeholder="Popular"
                    size="large"
                    style={{ borderRadius: 12, borderWidth: 2 }}
                  />
                </Form.Item>
                <Form.Item
                  label={<span className="font-bold text-[#1e1b4b]">Thứ tự</span>}
                  name="sortOrder"
                  className="!mb-0"
                >
                  <InputNumber
                    min={0}
                    style={{ width: "100%", borderRadius: 12 }}
                    size="large"
                  />
                </Form.Item>
              </div>
              <div className="mt-3 pl-1 flex items-center justify-between bg-[#fdf4ff] border-2 border-[#f0abfc] rounded-2xl px-4 py-3">
                <div>
                  <div className="font-extrabold text-[#1e1b4b] text-sm">
                    ⭐ Nổi bật
                  </div>
                  <div className="text-xs text-[#64748b] font-medium">
                    Hiển thị gói này nổi bật trên trang đăng ký
                  </div>
                </div>
                <Form.Item
                  name="isFeatured"
                  valuePropName="checked"
                  className="!mb-0"
                >
                  <Switch />
                </Form.Item>
              </div>
            </div>
          </Form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#f8f8fc] border-t-2 border-[#e6e6ed] flex items-center justify-between gap-3">
          <div className="text-xs text-[#64748b] font-medium">
            {editing
              ? `Đang sửa: ${editing.name}`
              : "Các trường có dấu * là bắt buộc"}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide rounded-2xl bg-white text-[#64748b] border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] hover:border-[#64748b] active:translate-y-[2px] active:shadow-none transition-all"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide rounded-2xl bg-[#6366f1] text-white border-2 border-[#6366f1] shadow-[0_4px_0_#4338ca] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_2px_0_#4338ca] transition-all"
            >
              {editing ? "💾 Lưu thay đổi" : "✨ Tạo gói"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminSubscriptionPackages;