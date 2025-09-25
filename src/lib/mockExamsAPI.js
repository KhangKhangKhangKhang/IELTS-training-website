// lib/mockData.js (Dữ liệu mẫu)
export const mockExamsAPI = async (type) => {
  // Giả lập độ trễ API
  await new Promise((resolve) => setTimeout(resolve, 500));

  const allExams = {
    Listening: [
      {
        id: 1,
        type: "Listening",
        title: "TOEFL Listening Practice",
        description: "Bài luyện tập kỹ năng nghe TOEFL",
        duration: 60,
        questions: 150,
        thumbnail: "/images/toefl-listening.jpg",
        createdAt: "2024-01-15",
      },
    ],
    Writing: [
      {
        id: 2,
        type: "Writing",
        title: "IELTS Writing Task 2",
        description: "Phát triển kỹ năng viết học thuật",
        duration: 45,
        questions: 89,
        thumbnail: "/images/ielts-writing.jpg",
        createdAt: "2024-01-10",
      },
    ],
    Reading: [
      {
        id: 3,
        type: "Reading",
        title: "SAT Reading Comprehension",
        description: "Rèn luyện kỹ năng đọc hiểu nâng cao",
        duration: 75,
        questions: 203,
        thumbnail: "/images/sat-reading.jpg",
        createdAt: "2024-01-18",
      },
    ],
  };

  return allExams[type] || [];
};
