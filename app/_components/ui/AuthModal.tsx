import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (token: string) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const body: any = { username, password };
      if (mode === 'register') body.email = email;
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown error');
      if (mode === 'login') {
        onAuthSuccess(data.token);
        onClose();
      } else {
        setMode('login');
        setSuccess('Registration successful! Please log in.');
        setUsername('');
        setPassword('');
        setEmail('');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex justify-center items-center overflow-y-auto min-h-screen py-8 bg-black bg-opacity-70 transition-all">
      <div className="relative bg-[#20232a] rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center border border-[#23262F] animate-fade-in">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl focus:outline-none"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        {/* Logo/Title */}
        <div className="mb-6 flex flex-col items-center w-full">
          <span className="text-3xl font-bold text-white mb-2 tracking-tight" style={{ fontFamily: 'Poppins, Inter, Montserrat, Arial, sans-serif' }}>Sign {mode === 'login' ? 'In' : 'Up'}</span>
        </div>
        {/* Tabs */}
        <div className="flex w-full mb-6 rounded-lg overflow-hidden border border-[#23262F]">
          <button
            className={`flex-1 py-2 font-semibold transition-colors ${mode === 'login' ? 'bg-[#23262F] text-white' : 'bg-[#23262F]/50 text-gray-400 hover:bg-[#23262F] hover:text-white'}`}
            onClick={() => setMode('login')}
            type="button"
          >
            Login
          </button>
          <button
            className={`flex-1 py-2 font-semibold transition-colors ${mode === 'register' ? 'bg-[#23262F] text-white' : 'bg-[#23262F]/50 text-gray-400 hover:bg-[#23262F] hover:text-white'}`}
            onClick={() => setMode('register')}
            type="button"
          >
            Register
          </button>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          {mode === 'register' && (
            <div className="relative">
              <label className="block text-sm text-white mb-1">Email</label>
              <input
                className="w-full bg-[#23262F] border border-[#23262F] text-white p-3 rounded focus:outline-none focus:border-[#1A73E8] pl-10"
                placeholder="Enter your email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <Mail className="absolute left-3 top-9 w-5 h-5 text-gray-400" />
            </div>
          )}
          <div className="relative">
            <label className="block text-sm text-white mb-1">Username</label>
            <input
              className="w-full bg-[#23262F] border border-[#23262F] text-white p-3 rounded focus:outline-none focus:border-[#1A73E8] pl-10"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
            <User className="absolute left-3 top-9 w-5 h-5 text-gray-400" />
          </div>
          <div className="relative">
            <label className="block text-sm text-white mb-1">Password</label>
            <input
              className="w-full bg-[#23262F] border border-[#23262F] text-white p-3 rounded focus:outline-none focus:border-[#1A73E8] pl-10 pr-10"
              placeholder="Enter your password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <Lock className="absolute left-3 top-9 w-5 h-5 text-gray-400" />
            <button
              type="button"
              className="absolute right-3 top-9 text-gray-400 hover:text-white focus:outline-none"
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {mode === 'login' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="accent-[#1A73E8]"
              />
              <label htmlFor="rememberMe" className="text-xs text-gray-300">Remember me</label>
            </div>
          )}
          {error && <div className="text-red-500 text-sm text-center font-semibold bg-red-900/30 rounded py-2 px-3">{error}</div>}
          {success && <div className="text-green-400 text-sm text-center font-semibold bg-green-900/30 rounded py-2 px-3">{success}</div>}
          <button
            type="submit"
            className="w-full bg-[#1A73E8] hover:bg-blue-700 text-white py-3 rounded font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading && <span className="loader border-white border-t-transparent border-2 w-4 h-4 rounded-full animate-spin"></span>}
            {mode === 'login' ? 'Sign in' : 'Register'}
          </button>
        </form>
        {/* Divider and Links */}
        <div className="w-full flex items-center my-6">
          <div className="flex-1 h-px bg-[#23262F]" />
          <span className="mx-3 text-gray-500 text-xs">OR</span>
          <div className="flex-1 h-px bg-[#23262F]" />
        </div>
        <div className="w-full flex flex-col items-center gap-2">
          <button className="text-[#1A73E8] text-sm font-semibold hover:underline" type="button" disabled>
            Forgot Password
          </button>
          <span className="text-gray-400 text-xs">
            {mode === 'login' ? (
              <>Don&apos;t have an account?{' '}
                <button className="text-[#1A73E8] hover:underline" onClick={() => setMode('register')} type="button">Register an Account</button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button className="text-[#1A73E8] hover:underline" onClick={() => setMode('login')} type="button">Sign in</button>
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
};

export default AuthModal; 