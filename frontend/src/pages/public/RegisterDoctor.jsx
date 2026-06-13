import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Loader2, ArrowLeft, Stethoscope, Briefcase, FileText, IndianRupee, MapPin, Building2, User, Mail, Lock, Phone } from 'lucide-react';

const RegisterDoctor = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    license_number: '',
    specialization: '',
    experience_years: 1,
    consultation_fee: 0,
    clinic_name: '',
    clinic_address: '',
    clinic_pincode: '',
    bio: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/api/auth/register/doctor', formData);
      const { access_token, user } = response.data;
      login(access_token, user);
      navigate('/doctor/dashboard');
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

      <div className="w-full max-w-3xl brutal-card bg-card p-10 space-y-10">
        <div className="space-y-2">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter">Doctor_Join_</h1>
          <p className="font-mono text-muted-foreground font-bold uppercase tracking-wider text-sm">Join the professional platform</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border-2 border-destructive p-4 font-mono font-bold text-destructive text-sm uppercase">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Section 1: Personal Info */}
          <section className="space-y-6">
             <h3 className="text-2xl font-black italic uppercase border-b-2 border-foreground pb-2">01_Personal_Information</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="font-mono font-black uppercase text-xs flex items-center gap-2"><User size={14}/> Name_</label>
                   <input type="text" name="name" required className="w-full border-2 border-foreground p-3 font-mono focus:bg-accent/5" placeholder="FULL NAME" value={formData.name} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                   <label className="font-mono font-black uppercase text-xs flex items-center gap-2"><Mail size={14}/> Email_</label>
                   <input type="email" name="email" required className="w-full border-2 border-foreground p-3 font-mono focus:bg-accent/5" placeholder="EMAIL@HOSPITAL.COM" value={formData.email} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                   <label className="font-mono font-black uppercase text-xs flex items-center gap-2"><Phone size={14}/> Phone_</label>
                   <input type="tel" name="phone" required className="w-full border-2 border-foreground p-3 font-mono focus:bg-accent/5" placeholder="XXXXXXXXXX" value={formData.phone} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                   <label className="font-mono font-black uppercase text-xs flex items-center gap-2"><Lock size={14}/> Password_</label>
                   <input type="password" name="password" required className="w-full border-2 border-foreground p-3 font-mono focus:bg-accent/5" placeholder="SECURE_PASSWORD" value={formData.password} onChange={handleChange} />
                </div>
             </div>
          </section>

          {/* Section 2: Professional Details */}
          <section className="space-y-6">
             <h3 className="text-2xl font-black italic uppercase border-b-2 border-foreground pb-2">02_Professional_Details</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="font-mono font-black uppercase text-xs flex items-center gap-2"><FileText size={14}/> License_Number</label>
                   <input type="text" name="license_number" required className="w-full border-2 border-foreground p-3 font-mono focus:bg-accent/5" placeholder="MEDICAL_LICENSE_123" value={formData.license_number} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                   <label className="font-mono font-black uppercase text-xs flex items-center gap-2"><Stethoscope size={14}/> Specialization_</label>
                   <input type="text" name="specialization" required className="w-full border-2 border-foreground p-3 font-mono focus:bg-accent/5" placeholder="DERMATOLOGIST" value={formData.specialization} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                   <label className="font-mono font-black uppercase text-xs flex items-center gap-2"><Briefcase size={14}/> Experience_Years</label>
                   <input type="number" name="experience_years" required min="1" className="w-full border-2 border-foreground p-3 font-mono focus:bg-accent/5" value={formData.experience_years} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                   <label className="font-mono font-black uppercase text-xs flex items-center gap-2"><IndianRupee size={14}/> Fee_</label>
                   <input type="number" name="consultation_fee" required min="0" className="w-full border-2 border-foreground p-3 font-mono focus:bg-accent/5" value={formData.consultation_fee} onChange={handleChange} />
                </div>
             </div>
          </section>

          {/* Section 3: Clinic Details */}
          <section className="space-y-6">
             <h3 className="text-2xl font-black italic uppercase border-b-2 border-foreground pb-2">03_Clinic_Information</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                   <label className="font-mono font-black uppercase text-xs flex items-center gap-2"><Building2 size={14}/> Clinic_Name</label>
                   <input type="text" name="clinic_name" required className="w-full border-2 border-foreground p-3 font-mono focus:bg-accent/5" placeholder="CLINIC_NAME" value={formData.clinic_name} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                   <label className="font-mono font-black uppercase text-xs flex items-center gap-2"><MapPin size={14}/> Clinic_Pincode</label>
                   <input type="text" name="clinic_pincode" required className="w-full border-2 border-foreground p-3 font-mono focus:bg-accent/5" placeholder="XXXXXX" value={formData.clinic_pincode} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                   <label className="font-mono font-black uppercase text-xs flex items-center gap-2"><MapPin size={14}/> Address_</label>
                   <input type="text" name="clinic_address" required className="w-full border-2 border-foreground p-3 font-mono focus:bg-accent/5" placeholder="STREET, AREA, CITY" value={formData.clinic_address} onChange={handleChange} />
                </div>
                <div className="space-y-2 md:col-span-2">
                   <label className="font-mono font-black uppercase text-xs flex items-center gap-2"><FileText size={14}/> Professional_Bio</label>
                   <textarea name="bio" rows="4" className="w-full border-2 border-foreground p-3 font-mono focus:bg-accent/5" placeholder="YOUR_EXPERTISE_AND_PHILOSOPHY" value={formData.bio} onChange={handleChange} />
                </div>
             </div>
          </section>

          <div className="pt-6">
             <button
               type="submit"
               disabled={isLoading}
               className="w-full brutal-btn py-5 text-2xl flex items-center justify-center gap-3"
             >
               {isLoading ? <Loader2 className="animate-spin" /> : 'REGISTER_FOR_APPROVAL'}
             </button>
             <p className="mt-4 font-mono text-center text-xs opacity-50 uppercase font-black">All registrations are subject to manual admin verification.</p>
          </div>
        </form>

        <p className="font-mono text-sm text-center font-bold pb-6">
          ALREADY_JOINED? <Link to="/login" className="text-primary hover:underline italic">SIGN_IN_HERE</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterDoctor;
