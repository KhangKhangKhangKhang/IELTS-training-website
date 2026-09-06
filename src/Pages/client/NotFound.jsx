import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-7xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-4">
          404
        </h1>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Không tìm thấy trang
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Trang bạn tìm không tồn tại hoặc đã bị xoá.
        </p>
        <button
          onClick={() => navigate("/homepage")}
          className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all"
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
};

export default NotFound;