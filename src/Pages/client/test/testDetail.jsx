import { useLocation, useParams } from "react-router-dom";
import Listening from "@/components/test/listening";
import Reading from "@/components/test/reading";
import Writing from "@/components/test/writing";
import { useState } from "react";
import { Spin } from "antd";

const testComponents = {
  LISTENING: Listening,
  READING: Reading,
  WRITING: Writing,
};

const TestDetail = () => {
  const { loaiDe, idDe } = useLocation();
  const Comp = testComponents[loaiDe?.toUpperCase()];

  if (!loaiDe || !idDe) {
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

  return <Comp />;
};

export default TestDetail;
