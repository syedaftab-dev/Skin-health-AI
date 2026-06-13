import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Loader2, ArrowLeft, User, Phone, Mail, Lock, Calendar, MapPin } from 'lucide-react';

const RegisterPatient = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    date_of_birth: '',
    default_city: '',
    default_location_pincode: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/api/auth/register/patient', formData);
      const { access_token, user } = response.data;
      login(access_token, user);
      navigate('/patient/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-accent/5 flex flex-col items-center justify-center p-6 py-20">
      <Link to="/" className="mb-12 flex items-center gap-2 font-mono font-black text-primary text-xl hover:translate-x-[-4px] transition-transform">
        <ArrowLeft size={20} /> BACK_TO_LANDING
      </Link>

      <div className="w-full max-w-2xl brutal-card bg-card p-10 space-y-10">
        <div className="space-y-2">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter">Registration_</h1>
          <p className="font-mono text-muted-foreground font-bold uppercase tracking-wider text-sm">Join as a patient to start analysis</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border-2 border-destructive p-4 font-mono font-bold text-destructive text-sm uppercase">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4 md:col-span-2">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-mono font-black uppercase text-xs flex items-center gap-2"><User size={14}/> Full_Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full border-2 border-foreground p-3 font-mono focus:outline-none focus:bg-accent/10"
                    placeholder="ENTER FULL NAME"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono font-black uppercase text-xs flex items-center gap-2"><Mail size={14}/> Email_Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full border-2 border-foreground p-3 font-mono focus:outline-none focus:bg-accent/10"
                    placeholder="NAME@EMAIL.COM"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
             </div>
          </div>

          <div className="space-y-2">
            <label className="font-mono font-black uppercase text-xs flex items-center gap-2"><Phone size={14}/> Phone_Number</label>
            <input
              type="tel"
              name="phone"
              required
              className="w-full border-2 border-foreground p-3 font-mono focus:outline-none focus:bg-accent/10"
              placeholder="+91 XXXXX XXXXX"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="font-mono font-black uppercase text-xs flex items-center gap-2"><Lock size={14}/> Password_</label>
            <input
              type="password"
              name="password"
              required
              className="w-full border-2 border-foreground p-3 font-mono focus:outline-none focus:bg-accent/10"
              placeholder="MIN 8 CHARS"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="font-mono font-black uppercase text-xs flex items-center gap-2"><Calendar size={14}/> Date_of_Birth</label>
            <input
              type="date"
              name="date_of_birth"
              className="w-full border-2 border-foreground p-3 font-mono focus:outline-none focus:bg-accent/10"
              value={formData.date_of_birth}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="font-mono font-black uppercase text-xs flex items-center gap-2"><MapPin size={14}/> Pincode_</label>
            <input
              type="text"
              name="default_location_pincode"
              className="w-full border-2 border-foreground p-3 font-mono focus:outline-none focus:bg-accent/10"
              placeholder="XXXXXX"
              value={formData.default_location_pincode}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
             <label className="font-mono font-black uppercase text-xs flex items-center gap-2"><MapPin size={14}/> Default_City</label>
             <input
               type="text"
               name="default_city"
               className="w-full border-2 border-foreground p-3 font-mono focus:outline-none focus:bg-accent/10"
               placeholder="CITY NAME"
               value={formData.default_city}
               onChange={handleChange}
             />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="md:col-span-2 brutal-btn py-4 text-xl flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'CREATE_PATIENT_ACCOUNT'}
          </button>
        </form>

        <p className="font-mono text-sm text-center font-bold">
          ALREADY_JOINED? <Link to="/login" className="text-primary hover:underline italic">SIGN_IN_HERE</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPatient;
