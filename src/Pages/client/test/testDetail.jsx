import { useLocation, useNavigate } from "react-router-dom";
import Listening from "@/components/test/listening";
import Reading from "@/components/test/reading";
import Writing from "@/components/test/writing";
import { useState, useEffect } from "react";
import { Spin } from "antd";

const testComponents = {
  LISTENING: Listening,
  READING: Reading,
  WRITING: Writing,
};

const TestDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { idDe, loaiDe } = location.state || {};
  const [timedOut, setTimedOut] = useState(false);

  const Comp = testComponents[loaiDe?.toUpperCase()];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!idDe || !loaiDe) {
        setTimedOut(true);
        navigate("/test", { replace: true }); // hoặc "/teacher/test" nếu đang ở role teacher
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [idDe, loaiDe, navigate]);

  if (timedOut) {
    return (
      <div className="text-center py-12 text-gray-500">
        Không tải được dữ liệu đề thi. Quay lại trang Test...
      </div>
    );
  }

  if (!idDe || !loaiDe) {
    return (
      <div className="text-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (!Comp) {
    return (
      <div className="text-center py-12 text-gray-500">
        Không tìm thấy loại đề: {loaiDe}
      </div>
    );
  }

  return <Comp idDe={idDe} />;
};

export default TestDetail;
