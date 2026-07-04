import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { DocsPage } from './pages/DocsPage';
import { VerifyOtpPage } from './pages/VerifyOtpPage';
import { ChatPage } from './pages/ChatPage';
import { LogsPage } from './pages/LogsPage';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'placeholder-client-id';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col relative">
          {/* Global Background Elements */}
          <div className="fixed inset-0 bg-[#0f172a] -z-20"></div>
          <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay -z-10 pointer-events-none"></div>
          <Navbar />
          
          <main className="flex-1 flex flex-col relative w-full">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/playground" element={<PlaygroundPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-otp" element={<VerifyOtpPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
