import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { AuthProvider } from "./context/authContext";
import { ThemeProvider } from "./context/themeContext";
import { createBrowserRouter, RouterProvider } from "react-router";
import ProtectedRoute from "./context/auth/protectedRoute";
import Navbar from "./components/ui/navBar/navBar";
import NavbarTeacher from "./components/ui/navBar/navBarTeacher";
import { Spin } from "antd";

// ✅ OPTIMIZED: Lazy load all page components for better performance
const HomePage = lazy(() => import("./Pages/client/homePage"));
const Statistic = lazy(() => import("./Pages/client/statistic"));
const Vocabulary = lazy(() => import("./Pages/client/vocabulary"));
const Profile = lazy(() => import("./Pages/client/profile"));
const UserList = lazy(() => import("./Pages/teacher/userList"));
const Login = lazy(() => import("./Pages/client/auth/login"));
const SignUp = lazy(() => import("./Pages/client/auth/signUp"));
const OTP = lazy(() => import("./Pages/client/auth/OTP"));
const NewPassword = lazy(() => import("./Pages/client/auth/newPassword"));
const ForgetPassword = lazy(() => import("./Pages/client/auth/forgetPassword"));
const LandingPage = lazy(() => import("./Pages/landingPage"));
const Test = lazy(() => import("./Pages/client/test/testReview"));
const TestDetail = lazy(() => import("./Pages/client/test/testDetail"));
const StartingPage = lazy(() => import("./Pages/StartingPage"));
const TestManager = lazy(() => import("./Pages/teacher/test/testManager"));
const TestCreate = lazy(() => import("./Pages/teacher/test/testCreate"));
const TestEdit = lazy(() => import("./Pages/teacher/test/testEdit"));
const Grammar = lazy(() => import("./Pages/client/grammar/grammar"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spin size="large" />
  </div>
);

// Wrapper component with Suspense
const LazyRoute = ({ Component }) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
);

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
          { index: true, element: <LazyRoute Component={HomePage} /> },
          { path: "homepage", element: <LazyRoute Component={HomePage} /> },
          { path: "statistic", element: <LazyRoute Component={Statistic} /> },
          { path: "vocabulary", element: <LazyRoute Component={Vocabulary} /> },
          { path: "test", element: <LazyRoute Component={Test} /> },
          { path: "doTest", element: <LazyRoute Component={TestDetail} /> },
          { path: "profile", element: <LazyRoute Component={Profile} /> },
          { path: "startingPage", element: <LazyRoute Component={StartingPage} /> },
          { path: "grammar", element: <LazyRoute Component={Grammar} /> },
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
          { index: true, element: <LazyRoute Component={HomePage} /> },
          { path: "homepage", element: <LazyRoute Component={HomePage} /> },
          { path: "statistic", element: <LazyRoute Component={Statistic} /> },
          { path: "vocabulary", element: <LazyRoute Component={Vocabulary} /> },
          { path: "test", element: <LazyRoute Component={Test} /> },
          { path: "profile", element: <LazyRoute Component={Profile} /> },
          { path: "userList", element: <LazyRoute Component={UserList} /> },
          { path: "doTest", element: <LazyRoute Component={TestDetail} /> },
          { path: "testManager", element: <LazyRoute Component={TestManager} /> },
          { path: "testManager/testCreate", element: <LazyRoute Component={TestCreate} /> },
          { path: "testManager/testEdit/:id", element: <LazyRoute Component={TestEdit} /> },
          { path: "testManager/testDetail/:id", element: <LazyRoute Component={TestDetail} /> },
          { path: "startingPage", element: <LazyRoute Component={StartingPage} /> },
          { path: "grammar", element: <LazyRoute Component={Grammar} /> },
        ],
      },
    ],
  },
  {
    path: "/admin",

    element: <ProtectedRoute />,
    children: [
      {
        path: "/admin",
        element: <NavbarTeacher />,
        children: [
          { index: true, element: <LazyRoute Component={HomePage} /> },
          { path: "homepage", element: <LazyRoute Component={HomePage} /> },
          { path: "statistic", element: <LazyRoute Component={Statistic} /> },
          { path: "vocabulary", element: <LazyRoute Component={Vocabulary} /> },
          { path: "test", element: <LazyRoute Component={Test} /> },
          { path: "profile", element: <LazyRoute Component={Profile} /> },
          { path: "userList", element: <LazyRoute Component={UserList} /> },
          { path: "doTest", element: <LazyRoute Component={TestDetail} /> },
          { path: "testManager/testCreate", element: <LazyRoute Component={TestCreate} /> },
          { path: "testManager/testEdit/:id", element: <LazyRoute Component={TestEdit} /> },
          { path: "testManager", element: <LazyRoute Component={TestManager} /> },
          { path: "grammar", element: <LazyRoute Component={Grammar} /> },
        ],
      },
    ],
  },
  { path: "login", element: <LazyRoute Component={Login} /> },
  { path: "signup", element: <LazyRoute Component={SignUp} /> },
  { path: "OTP", element: <LazyRoute Component={OTP} /> },
  { path: "newPassword", element: <LazyRoute Component={NewPassword} /> },
  { path: "forgetPassword", element: <LazyRoute Component={ForgetPassword} /> },
  { path: "landingPage", element: <LazyRoute Component={LandingPage} /> },
]);
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
