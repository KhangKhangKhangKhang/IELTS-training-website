import React from "react";

const Statistic = () => {
  return (
    <>
      <div className="flex bg-gray-100 justify-around  items-start m-3">
        <div className="flex-col bg-white w-1/5 h-fit shadow-2xl rounded-3xl text-white p-5 ">
          <ol className="flex flex-col  items-center mt-1  text-xl ">
            <li className="hover:bg-purple-700 p-2 rounded-lg font-bold w-full text-center cursor-pointer">
              Tổng quan
            </li>
            <li className="hover:bg-purple-700 p-2 rounded-lg w-full text-center cursor-pointer">
              Bài làm của học viên
            </li>
            <li className="hover:bg-purple-700 p-2 rounded-lg w-full text-center cursor-pointer">
              Phân tích câu hỏi
            </li>
            <li className="hover:bg-purple-700 p-2 rounded-lg w-full text-center cursor-pointer">
              So sánh kết quả
            </li>
          </ol>
        </div>
        <div className="flex-col mr-3 ml-3 bg-purple-700 text-green-500 w-full  ">
          <h1 className="text-2xl t font-bold">Thống kê</h1>
          <h1 className="text-2xl font-bold">Thống kê</h1>
          <h1 className="text-2xl font-bold">Thống kê</h1>
        </div>
      </div>
    </>
  );
};

export default Statistic;
