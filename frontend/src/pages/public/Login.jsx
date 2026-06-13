import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { access_token, user } = response.data;
      login(access_token, user);

      // Role-based redirect
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'doctor') navigate('/doctor/dashboard');
      else navigate('/patient/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-accent/5 flex flex-col items-center justify-center p-6">
      <Link to="/" className="mb-12 flex items-center gap-2 font-mono font-black text-primary text-xl hover:translate-x-[-4px] transition-transform">
        <ArrowLeft size={20} /> BACK_TO_LANDING
      </Link>

      <div className="w-full max-w-md brutal-card bg-card p-10 space-y-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter">Login_</h1>
          <p className="font-mono text-muted-foreground font-bold uppercase tracking-wider text-sm">Access your medical portal</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border-2 border-destructive p-4 font-mono font-bold text-destructive text-sm uppercase">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="font-mono font-black uppercase text-xs">Email_Address</label>
            <input
              type="email"
              required
              className="w-full border-2 border-foreground p-3 font-mono focus:outline-none focus:bg-accent/10 transition-colors"
              placeholder="YOUR@EMAIL.COM"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="font-mono font-black uppercase text-xs">Password_</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full border-2 border-foreground p-3 font-mono focus:outline-none focus:bg-accent/10 transition-colors"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full brutal-btn py-4 text-xl flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'SIGN_IN'}
          </button>
        </form>

        <div className="pt-6 border-t-2 border-foreground/10 space-y-4">
          <p className="font-mono text-sm text-center font-bold">
            NEW_HERE? <br />
            <Link to="/register/patient" className="text-primary hover:underline italic">JOIN_AS_PATIENT</Link>
            <span className="mx-2 opacity-20">|</span>
            <Link to="/register/doctor" className="text-accent hover:underline italic">JOIN_AS_DOCTOR</Link>
          </p>
          <p className="text-center">
            <Link to="/forgot-password" title="Mockup: Defer to Phase 5" className="text-xs font-mono opacity-50 hover:opacity-100 uppercase underline decoration-2 underline-offset-2">Forgot_Password?</Link>
          </p>
        </div>
      </div>
      
      <div className="mt-12 text-center opacity-30 font-mono text-[10px] uppercase font-black space-y-1">
        <p>SkinAI v2.0 Platform</p>
        <p>Protected by SHA-256 Encryption</p>
      </div>
    </div>
  );
};

export default Login;
