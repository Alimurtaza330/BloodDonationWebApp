
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegisterPage from './components/RegisterPage';
import VerifyPage from './components/VerifyPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import LoginPage from './components/LoginPage';
import DetailPage from './components/DetailPage';
function App() {


  return (
    <>
      <Router>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/" element={<LoginPage />} />
          <Route path="/detailpage" element={<DetailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
         <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          {/* Add other routes */}
        </Routes>
      </Router>
    </>
  )
}

export default App
