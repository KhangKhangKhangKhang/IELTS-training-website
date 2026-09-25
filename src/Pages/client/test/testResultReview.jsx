import { useParams, useNavigate } from "react-router";
import { useState } from "react";
import { IELTSTestResultReview } from "@/components/magicpath/ielts-test-result-review/IELTSTestResultReview";
import { useAuth } from "@/context/authContext";
import { getTestResultByIdAPI } from "@/services/apiDoTest";

const TestResultReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [retaking, setRetaking] = useState(false);

  const handleRetake = async () => {
    if (retaking) return;
    setRetaking(true);
    try {
      // Fetch existing testResult to recover idTest + testType before navigating.
      // /doTest route has no :id param, so testDetail.jsx can't reconstruct from URL alone.
      const res = await getTestResultByIdAPI(id);
      const testResult = res?.data ?? res;
      navigate("/doTest", {
        state: {
          retake: true,
          testResultId: id,
          idTest: testResult?.idTest,
          testType: testResult?.testType,
        },
      });
    } catch (err) {
      // Fallback: navigate without idTest; downstream may still handle retake gracefully.
      navigate("/doTest", { state: { retake: true, testResultId: id } });
    } finally {
      setRetaking(false);
    }
  };

  return (
    <IELTSTestResultReview
      testResultId={id}
      user={user}
      onBack={() => navigate("/test")}
      onRetake={handleRetake}
    />
  );
};

export default TestResultReview;
