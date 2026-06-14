import { useParams, useNavigate } from "react-router";
import { IELTSTestResultReview } from "@/components/magicpath/ielts-test-result-review/IELTSTestResultReview";
import { useAuth } from "@/context/authContext";

const TestResultReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <IELTSTestResultReview
      testResultId={id}
      user={user}
      onBack={() => navigate("/test")}
      onRetake={() =>
        navigate("/doTest", { state: { retake: true, testResultId: id } })
      }
    />
  );
};

export default TestResultReview;
