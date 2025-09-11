import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignUp from './Pages/client/auth/signUp';
import ForgetPassword from './Pages/client/auth/forgetPassword';
import OTP from './Pages/client/auth/OTP';
import NewPassword from './Pages/client/auth/newPassword'; 
import HomePage from './Pages/client/homePage';
import Login from './Pages/client/auth/login';
 
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signUp" element={<SignUp />} />
        <Route path="/forgetPassword" element={<ForgetPassword />} />
        <Route path="/OTP" element={<OTP />} />
        <Route path="/newPassword" element={<NewPassword />} />
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
