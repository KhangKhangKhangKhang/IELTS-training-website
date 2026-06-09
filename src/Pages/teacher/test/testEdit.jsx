import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router";
import { Spin, message } from "antd";
import { getDetailInTestAPI } from "@/services/apiDoTest";
import PdfImportModal from "@/components/test/teacher/PdfImportModal";
import { IELTSTestEditor } from "@/components/magicpath/ielts-test-editor/IELTSTestEditor";

const TestEdit = () => {
  const { idTest, id } = useParams();
  const resolvedTestId = idTest || id;
  const locationState = useLocation().state?.exam;

  const [exam, setExam] = useState(locationState || null);
  const [loading, setLoading] = useState(!locationState);
  const [showPdfImportModal, setShowPdfImportModal] = useState(false);

  useEffect(() => {
    const fetchTestData = async () => {
      if (!resolvedTestId) return;
      try {
        setLoading(true);
        const res = await getDetailInTestAPI(resolvedTestId);
        if (res?.data) {
          setExam(res.data);
        } else {
          message.error("Failed to load test info");
        }
      } catch (error) {
        console.error("Error fetching test data:", error);
        if (!locationState) {
          message.error("Failed to load test info");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTestData();
  }, [locationState, resolvedTestId]);

  const handleExamUpdate = (updatedExam) => {
    setExam(updatedExam);
  };

  const handlePdfImportSuccess = async (importedIdTest) => {
    try {
      setLoading(true);
      const res = await getDetailInTestAPI(resolvedTestId);
      if (res?.data) {
        setExam(res.data);
        message.success(
          "PDF imported! Content added to test."
        );
      }
    } catch (error) {
      console.error("Error refreshing after import:", error);
      message.warning(
        "Import succeeded but please reload the page to see new content."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    if (!resolvedTestId) {
      message.warning("No test ID to preview");
      return;
    }
    window.open(`/testDetail/${resolvedTestId}`, "_blank");
  };

  const handlePublish = () => {
    message.info("Test saved as draft. Publish will be enabled when BE is ready.");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  if (!exam) return <p className="text-center py-12">Test not found</p>;

  return (
    <div className="relative">
      <IELTSTestEditor
        idTest={resolvedTestId}
        exam={exam}
        onExamUpdate={handleExamUpdate}
        onImportPdf={() => setShowPdfImportModal(true)}
        onPreview={handlePreview}
        onPublish={handlePublish}
      />

      <PdfImportModal
        visible={showPdfImportModal}
        onClose={() => setShowPdfImportModal(false)}
        idTest={resolvedTestId}
        testType={exam?.testType}
        exam={exam}
        onImportSuccess={handlePdfImportSuccess}
      />
    </div>
  );
};

export default TestEdit;
