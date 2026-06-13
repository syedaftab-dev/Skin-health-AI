import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Edit3, 
  CheckCircle, 
  Loader2,
  Lock,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';

const PatientProfile = () => {
  const { user, setUser } = useAuth();
  console.log('Profile component - user:', user); // Debug log
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date_of_birth: '',
    default_city: '',
    default_location_pincode: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('Profile useEffect - user:', user); // Debug log
    if (!user) {
      console.log('No user found, skipping profile fetch');
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        console.log('Fetching profile...'); // Debug log
        const response = await api.get('/api/patient/profile');
        console.log('Profile response:', response.data); // Debug log
        const data = response.data;
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          date_of_birth: data.date_of_birth || '',
          default_city: data.default_city || '',
          default_location_pincode: data.default_location_pincode || ''
        });
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError('Failed to load profile. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await api.put('/api/patient/profile', formData);
      setUser({ ...user, name: formData.name, phone: formData.phone });
      setMessage({ type: 'success', text: 'PROFILE_UPDATED_SUCCESSFULLY' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (err) {
      setMessage({ type: 'error', text: 'FAILED_TO_UPDATE_PROFILE' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse font-mono font-bold uppercase text-2xl">RETRIEVING_IDENTITY_SYS...</div>;

  if (!user) {
    return (
      <div className="brutal-card bg-destructive/10 border-2 border-destructive p-10 text-center">
        <h3 className="text-2xl font-mono font-bold text-destructive uppercase mb-4">NOT_AUTHENTICATED</h3>
        <p className="font-mono mb-4">Please log in to access this page.</p>
        <Link to="/login" className="brutal-btn">GO_TO_LOGIN</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="space-y-4 border-b-2 border-foreground pb-6">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter">My_Profile</h1>
        <p className="font-mono text-muted-foreground font-bold uppercase tracking-wider text-sm flex items-center gap-2">
           <User size={16} /> Manage your personal and medical identification
        </p>
      </div>

      {error && (
         <div className="bg-destructive/10 border-2 border-destructive p-4 font-mono font-bold text-destructive text-sm uppercase flex items-center gap-3">
            <AlertTriangle size={20} /> {error}
         </div>
      )}

      {message.text && (
         <div className={`border-2 border-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 font-mono font-black animate-in zoom-in-95 duration-200 ${
           message.type === 'success' ? 'bg-green-400 text-foreground' : 'bg-destructive text-destructive-foreground'
         }`}>
            {message.type === 'success' ? <CheckCircle size={24}/> : <Shield size={24}/>}
            {message.text}
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
         {/* Sidebar Bio Card */}
         <div className="md:col-span-1 space-y-8">
            <div className="brutal-card bg-accent p-10 flex flex-col items-center text-center space-y-6">
               <div className="w-32 h-32 border-4 border-foreground bg-white flex items-center justify-center font-mono font-black text-6xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  {user?.name?.[0].toUpperCase()}
               </div>
               <div>
                  <h2 className="text-3xl font-black uppercase italic leading-none">{user?.name}</h2>
                  <p className="font-mono text-xs uppercase opacity-60 font-black mt-2 tracking-widest">ID: {user?.id.slice(-8)}</p>
               </div>
               <div className="w-full pt-6 border-t border-foreground/10 space-y-3">
                  <div className="flex items-center gap-3 font-mono text-xs font-black uppercase">
                     <Mail size={16} className="text-primary" /> {user?.email}
                  </div>
                  <div className="flex items-center gap-3 font-mono text-xs font-black uppercase text-left">
                     <Shield size={16} className="text-primary" /> ACCOUNT_VERIFIED
                  </div>
               </div>
            </div>

            <div className="brutal-card border-none bg-foreground text-background p-8 space-y-4">
               <h3 className="font-mono font-black text-primary uppercase text-xs">Security_Log</h3>
               <p className="font-mono text-sm leading-tight italic opacity-80">
                  Last login registered at {new Date().toLocaleTimeString()} from local IP. All medical data is stored with end-to-end encryption.
               </p>
            </div>
         </div>

         {/* Form Section */}
         <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="brutal-card bg-card p-10 space-y-10">
               <section className="space-y-6">
                  <h3 className="text-2xl font-black italic uppercase border-b-2 border-foreground pb-2 flex items-center gap-2">
                     <Edit3 size={20} className="text-primary" /> PROFILE_INFORMATION
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-6">
                     <div className="space-y-2">
                        <label className="font-mono font-black uppercase text-xs flex items-center gap-2 italic">Full_Legal_Name</label>
                        <input 
                           type="text" 
                           name="name"
                           required
                           className="w-full border-2 border-foreground p-3 font-mono focus:bg-accent/5 outline-none"
                           value={formData.name}
                           onChange={handleChange}
                        />
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="font-mono font-black uppercase text-xs flex items-center gap-2 italic">Phone_Number</label>
                           <input 
                              type="tel" 
                              name="phone"
                              required
                              className="w-full border-2 border-foreground p-3 font-mono focus:bg-accent/5 outline-none"
                              value={formData.phone}
                              onChange={handleChange}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="font-mono font-black uppercase text-xs flex items-center gap-2 italic">Date_of_Birth</label>
                           <input 
                              type="date" 
                              name="date_of_birth"
                              className="w-full border-2 border-foreground p-3 font-mono focus:bg-accent/5 outline-none"
                              value={formData.date_of_birth}
                              onChange={handleChange}
                           />
                        </div>
                     </div>
                  </div>
               </section>

               <section className="space-y-6">
                  <h3 className="text-2xl font-black italic uppercase border-b-2 border-foreground pb-2 flex items-center gap-2">
                     <MapPin size={20} className="text-primary" /> GEOGRAPHIC_DATA
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="font-mono font-black uppercase text-xs flex items-center gap-2 italic">City_</label>
                        <input 
                           type="text" 
                           name="default_city"
                           className="w-full border-2 border-foreground p-3 font-mono focus:bg-accent/5 outline-none"
                           value={formData.default_city}
                           onChange={handleChange}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="font-mono font-black uppercase text-xs flex items-center gap-2 italic">Regional_Pincode</label>
                        <input 
                           type="text" 
                           name="default_location_pincode"
                           className="w-full border-2 border-foreground p-3 font-mono focus:bg-accent/5 outline-none"
                           value={formData.default_location_pincode}
                           onChange={handleChange}
                        />
                     </div>
                  </div>
               </section>

               <div className="pt-6 flex flex-col gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="brutal-btn w-full py-5 text-2xl flex items-center justify-center gap-4"
                  >
                     {saving ? <Loader2 className="animate-spin" /> : 'SAVE_CHANGES_SYS'}
                  </button>
                  
                  <Link to="/change-password" title="Phase 5 Feature" className="font-mono font-bold uppercase text-xs text-center opacity-50 flex items-center justify-center gap-2 hover:opacity-100 transition-opacity">
                     <Lock size={14} /> Update_Security_Credentials_ <ArrowRight size={14} />
                  </Link>
               </div>
            </form>
         </div>
      </div>
    </div>
  );
};

export default PatientProfile;
