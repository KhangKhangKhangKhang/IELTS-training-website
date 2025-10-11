import React from "react";
import { useParams } from "react-router";

const TestDetail = () => {
  const { idDe } = useParams;
  return <div>Teacher Test Detail Page</div>;
};

export default TestDetail;
