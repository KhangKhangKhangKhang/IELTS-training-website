import React from "react";
import { useParams } from "react-router";

const TestEdit = () => {
  const { idDe } = useParams();
  return <div>Teacher Test Edit Page for Test ID: {idDe}</div>;
};

export default TestEdit;
