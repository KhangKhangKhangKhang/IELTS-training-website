import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Pages/client/auth/login';
import SignUp from './Pages/client/auth/signUp';
import ForgetPassword from './Pages/client/auth/forgetPassword';
import OTP from './Pages/client/auth/OTP';
import NewPassword from './Pages/client/auth/newPassword';  
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signUp" element={<SignUp />} />
        <Route path="/forgetPassword" element={<ForgetPassword />} />
        <Route path="/OTP" element={<OTP />} />
        <Route path="/newPassword" element={<NewPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
