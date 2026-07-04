import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Shield, Loader2, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

export const VerifyOtpPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const navigate = useNavigate();
  const { login } = useAuth();

  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Timer state (in seconds)
  const [resendTimer, setResendTimer] = useState(60);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  // Handle resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value.replace(/[^0-9]/g, '');
    if (!value) return;

    const newOtp = [...otp];
    // Take the last character typed (in case of double inputs)
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input cell
    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      
      // If active cell has content, clear it.
      if (otp[index]) {
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        // If active cell is empty, clear previous cell and focus it
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').substring(0, 6);
    if (pasteData.length !== 6) return;

    const newOtp = pasteData.split('');
    setOtp(newOtp);

    // Focus last input box
    inputRefs.current[5]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await authApi.verifyOtp(email, code);
      if (response.success && response.data) {
        setSuccessMessage('Email verified successfully! Logging you in...');
        setTimeout(() => {
          login(response.data.user, response.data.token);
          navigate('/dashboard');
        }, 1500);
      } else {
        setError('Verification failed');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid verification code or server error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;

    setResending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await authApi.resendOtp(email);
      setSuccessMessage('A new verification code has been sent to your email.');
      setResendTimer(60); // Reset timer
      // Clear inputs and refocus first cell
      setOtp(new Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to resend code or server error');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="glass-panel p-8 rounded-2xl border border-slate-700/50 shadow-2xl relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
          
          <div className="flex flex-col items-center mb-8 relative z-10">
            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4 border border-blue-500/30">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100">Verify Your Email</h1>
            <p className="text-slate-400 text-sm mt-2 text-center px-4">
              We sent a 6-digit verification code to <span className="text-blue-400 font-medium font-mono">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                <p className="text-sm text-green-200">{successMessage}</p>
              </div>
            )}

            {/* OTP Inputs Cells */}
            <div className="flex justify-between gap-2">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={data}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-12 text-center bg-slate-900/50 border border-slate-700 text-slate-100 text-lg font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.some(v => v === '')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:bg-blue-600/50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>

          {/* Resend Action */}
          <div className="mt-8 text-center relative z-10 border-t border-slate-800 pt-6">
            <button
              onClick={handleResend}
              disabled={resendTimer > 0 || resending}
              className="inline-flex items-center gap-2 text-sm font-medium transition-colors text-blue-400 hover:text-blue-300 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {resendTimer > 0 
                ? `Resend code in ${resendTimer}s` 
                : 'Resend Verification Code'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
