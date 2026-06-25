import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/authContext";
import { ThemeProvider } from "./context/themeContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import SubscriptionPage from "./Pages/client/subscription";
import SubscriptionReturn from "./Pages/client/subscriptionReturn";
import { createBrowserRouter, RouterProvider } from "react-router";
import ProtectedRoute from "./context/auth/protectedRoute";
import OnlyUserRoute from "./context/auth/onlyUserRoute";
import Navbar from "./components/ui/navBar/navBar";
import NavbarTeacher from "./components/ui/navBar/navBarTeacher";
import NavbarAdmin from "./components/ui/navBar/navBarAdmin";
import { Spin } from "antd";
import { ToastContainer } from "react-toastify";

// ✅ OPTIMIZED: Lazy load all page components for better performance
const HomePage = lazy(() => import("./Pages/client/homePage"));
const Statistic = lazy(() => import("./Pages/client/forum"));
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
const DoTest = lazy(() => import("./Pages/client/test/doTest"));
const TestResultReview = lazy(() => import("./Pages/client/test/testResultReview"));
const StartingPage = lazy(() => import("./Pages/StartingPage"));
const TestManager = lazy(() => import("./Pages/teacher/test/testManager"));
const TestCreate = lazy(() => import("./Pages/teacher/test/testCreate"));
const TestEdit = lazy(() => import("./Pages/teacher/test/testEdit"));
const TeacherDashboard = lazy(() => import("./Pages/teacher/teacherDashboard"));
const ForumModeration = lazy(() => import("./Pages/teacher/forumModeration"));
const Grammar = lazy(() => import("./Pages/client/grammar"));
const GrammarPractice = lazy(() => import("./Pages/client/GrammarPractice"));
const GrammarTopic = lazy(() => import("./Pages/client/grammar/[idGrammar]"));
const VocabDaily = lazy(() => import("./Pages/client/VocabDaily"));
const StudyPlanner = lazy(() => import("./Pages/client/studyPlanner"));
const AdminDashboard = lazy(() => import("./Pages/admin/adminDashboard"));
const AdminUserList = lazy(() => import("./Pages/admin/adminUserList"));
const TeacherReviewHistory = lazy(() => import("./Pages/client/teacherReviewHistory"));
const TeacherQueue = lazy(() => import("./Pages/teacher/TeacherQueueView"));
const TeacherReviewManager = lazy(() => import("./Pages/admin/teacherReviewManager"));
const Weakness = lazy(() => import("./Pages/client/Weakness"));

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
  // --- USER ROUTE: /startingPage (standalone - no Navbar - USER only) ---
  {
    path: "/startingPage",
    element: <ProtectedRoute />,
    children: [
      {
        path: "",
        element: <OnlyUserRoute><LazyRoute Component={StartingPage} /></OnlyUserRoute>,
      },
    ],
  },

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
          { path: "forum", element: <LazyRoute Component={Statistic} /> },
          { path: "weakness", element: <LazyRoute Component={Weakness} /> },
          { path: "vocabulary", element: <LazyRoute Component={Vocabulary} /> },
          { path: "test", element: <LazyRoute Component={Test} /> },
          { path: "test/review/:id", element: <LazyRoute Component={TestResultReview} /> },
          { path: "doTest", element: <LazyRoute Component={DoTest} /> },
          { path: "profile", element: <LazyRoute Component={Profile} /> },
          // startingPage moved to standalone route above
          { path: "grammar", element: <LazyRoute Component={Grammar} /> },
          { path: "grammar/:idGrammar", element: <LazyRoute Component={GrammarTopic} /> },
          { path: "grammar-practice", element: <LazyRoute Component={GrammarPractice} /> },
          { path: "vocab-daily", element: <LazyRoute Component={VocabDaily} /> },
          { path: "study-planner", element: <LazyRoute Component={StudyPlanner} /> },
          { path: "teacher-review-history", element: <LazyRoute Component={TeacherReviewHistory} /> },
          { path: "subscription", element: <LazyRoute Component={SubscriptionPage} /> },
          { path: "subscription/return", element: <LazyRoute Component={SubscriptionReturn} /> },
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
          { index: true, element: <LazyRoute Component={TeacherDashboard} /> },
          { path: "homepage", element: <LazyRoute Component={TeacherDashboard} /> },
          { path: "forum", element: <LazyRoute Component={Statistic} /> },
          { path: "weakness", element: <LazyRoute Component={Weakness} /> },
          { path: "vocabulary", element: <LazyRoute Component={Vocabulary} /> },
          { path: "test", element: <LazyRoute Component={Test} /> },
          { path: "profile", element: <LazyRoute Component={Profile} /> },
          { path: "userList", element: <LazyRoute Component={UserList} /> },
          { path: "doTest", element: <LazyRoute Component={TestDetail} /> },
          { path: "testManager", element: <LazyRoute Component={TestManager} /> },
          { path: "dashboard", element: <LazyRoute Component={TeacherDashboard} /> },
          { path: "testManager/testCreate", element: <LazyRoute Component={TestCreate} /> },
          { path: "testManager/testEdit/:id", element: <LazyRoute Component={TestEdit} /> },
          { path: "testManager/testDetail/:id", element: <LazyRoute Component={TestDetail} /> },
          { path: "grammar", element: <LazyRoute Component={Grammar} /> },
          { path: "grammar/:idGrammar", element: <LazyRoute Component={GrammarTopic} /> },
          { path: "grammar-practice", element: <LazyRoute Component={GrammarPractice} /> },
          { path: "moderation", element: <LazyRoute Component={ForumModeration} /> },
          { path: "teacher-review", element: <LazyRoute Component={TeacherQueue} /> },
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
        element: <NavbarAdmin />,
        children: [
          { index: true, element: <LazyRoute Component={AdminDashboard} /> },
          { path: "dashboard", element: <LazyRoute Component={AdminDashboard} /> },
          { path: "userList", element: <LazyRoute Component={AdminUserList} /> },
          { path: "moderation", element: <LazyRoute Component={ForumModeration} /> },
          { path: "testManager", element: <LazyRoute Component={TestManager} /> },
          { path: "testManager/testCreate", element: <LazyRoute Component={TestCreate} /> },
          { path: "testManager/testEdit/:id", element: <LazyRoute Component={TestEdit} /> },
          { path: "teacher-review", element: <LazyRoute Component={TeacherReviewManager} /> },
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
        <SubscriptionProvider>
          <RouterProvider router={router} />
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
    <ToastContainer position="top-right" autoClose={3000} theme="colored" />
  </StrictMode>
);
