import { BrowserRouter , Routes, Route } from 'react-router-dom';
import SignUp from './Pages/client/auth/signUp';
import ForgetPassword from './Pages/client/auth/forgetPassword';
import OTP from './Pages/client/auth/OTP';
import NewPassword from './Pages/client/auth/newPassword'; 
import HomePage from './Pages/client/homePage';
import Login from './Pages/client/auth/login';
import Header from './components/Header';
import Navbar from './components/navBar';
import ProtectedRoute from './context/protectedRoute';
import Otp from './Pages/client/auth/OTP';
import Vocabulary from './Pages/client/vocabulary';
 
function App() {
  return (
    <>
      <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/otp" element={<Otp />} />
        <Route path="/forget-password" element={<ForgetPassword />} />
        <Route path="/new-password" element={<NewPassword />} />
        <Route path="test-vocab" element={<Vocabulary />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Navbar />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/vocabulary" element={<Vocabulary/>} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
