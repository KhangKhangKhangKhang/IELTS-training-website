import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AuthProvider } from "./context/authContext";
import { createBrowserRouter, RouterProvider } from "react-router";
import ProtectedRoute from "./context/auth/protectedRoute";
import path from "path";
import Navbar from "./components/ui/navBar/navBar";
import HomePage from "./Pages/client/homePage";
import Statistic from "./Pages/client/statistic";
import Vocabulary from "./Pages/client/vocabulary";
import NavbarTeacher from "./components/ui/navBar/navBarTeacher";
import Profile from "./Pages/client/profile";
import UserList from "./Pages/teacher/userList";
import Login from "./Pages/client/auth/login";
import SignUp from "./Pages/client/auth/signUp";
import OTP from "./Pages/client/auth/OTP";
import NewPassword from "./Pages/client/auth/newPassword";
import ForgetPassword from "./Pages/client/auth/forgetPassword";
import LandingPage from "./Pages/landingPage";
import Test from "./Pages/client/test/testReview";
import TestDetail from "./Pages/client/test/testDetail";
import CreateTest from "./Pages/teacher/createTest";

const router = createBrowserRouter([
  // --- User Routes ---
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <Navbar />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "homepage", element: <HomePage /> },
          { path: "statistic", element: <Statistic /> },
          { path: "vocabulary", element: <Vocabulary /> }, // match /vocabulary
          { path: "test", element: <Test /> },
          { path: "doTest", element: <TestDetail /> },
          { path: "profile", element: <Profile /> },
        ],
      },
    ],
  },

  // --- Teacher Routes ---
  {
    path: "/teacher",
    element: <ProtectedRoute />,
    children: [
      {
        path: "/teacher",
        element: <NavbarTeacher />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "homepage", element: <HomePage /> },
          { path: "statistic", element: <Statistic /> },
          { path: "vocabulary", element: <Vocabulary /> }, // match /teacher/vocabulary
          { path: "test", element: <Test /> },
          { path: "profile", element: <Profile /> },
          { path: "userList", element: <UserList /> },
          { path: "doTest", element: <TestDetail /> },
          { path: "createTest", element: <CreateTest /> },
        ],
      },
    ],
  },
  { path: "login", element: <Login /> },
  { path: "signup", element: <SignUp /> },
  { path: "OTP", element: <OTP /> },
  { path: "newPassword", element: <NewPassword /> },
  { path: "forgetPassword", element: <ForgetPassword /> },
  { path: "landingPage", element: <LandingPage /> },
  { path: "test-test", element: <Test /> },
]);
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
