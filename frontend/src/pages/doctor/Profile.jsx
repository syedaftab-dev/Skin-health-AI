import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { 
  User, 
  Mail, 
  Phone, 
  Stethoscope, 
  Briefcase, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Camera
} from 'lucide-react';

const DoctorProfile = () => {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    specialization: '',
    experience_years: 0,
    bio: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/api/doctors/profile');
        const data = response.data;
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          specialization: data.specialization || '',
          experience_years: data.experience_years || 0,
          bio: data.bio || ''
        });
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await api.put('/api/doctors/profile', formData);
      setUser({ ...user, name: formData.name, phone: formData.phone });
      setMessage({ type: 'success', text: 'PROFESSIONAL_IDENTITY_RECONFIGURED' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (err) {
      setMessage({ type: 'error', text: 'IDENTITY_SYNC_FAILURE_DETECTED' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse font-mono font-bold uppercase text-2xl">RETRIEVING_IDENTITY_SYS...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="space-y-4 border-b-2 border-foreground pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <h1 className="text-5xl font-black italic uppercase tracking-tighter">My_Profile</h1>
           <p className="font-mono text-muted-foreground font-bold uppercase tracking-wider text-sm flex items-center gap-2">
              <User size={16} /> Manage your professional medical credentials
           </p>
        </div>
        <button 
           onClick={handleSubmit} 
           disabled={saving}
           className="brutal-btn px-10 py-3 text-lg flex items-center gap-3 uppercase whitespace-nowrap"
        >
           {saving ? <Loader2 className="animate-spin" /> : <><CheckCircle size={20} /> SYNCHRONIZE_IDENTITY</>}
        </button>
      </div>

      {message.text && (
         <div className={`border-2 border-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 font-mono font-black animate-in zoom-in-95 duration-200 ${
           message.type === 'success' ? 'bg-green-400 text-foreground' : 'bg-destructive text-destructive-foreground'
         }`}>
            {message.type === 'success' ? <CheckCircle size={24}/> : <AlertCircle size={24}/>}
            {message.text}
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
         {/* Sidebar Bio Card */}
         <div className="md:col-span-1 space-y-8">
            <div className="brutal-card bg-accent p-10 flex flex-col items-center text-center space-y-6 relative overflow-hidden">
               <div className="w-32 h-32 border-4 border-foreground bg-white flex items-center justify-center font-mono font-black text-6xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                  {user?.profile_photo_url ? (
                    <img src={user.profile_photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.[0].toUpperCase()
                  )}
               </div>
               <button className="absolute bottom-24 right-20 bg-primary p-2 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all">
                  <Camera size={16} />
               </button>
               <div>
                  <h2 className="text-3xl font-black uppercase italic leading-none">{user?.name}</h2>
                  <p className="font-mono text-xs uppercase opacity-60 font-black mt-2 tracking-widest text-primary italic underline decoration-2 underline-offset-4 decoration-foreground">DR_IDENTITY_v2.1</p>
               </div>
               <div className="w-full pt-6 border-t border-foreground/10 space-y-3 font-mono text-xs font-black uppercase text-left">
                  <div className="flex items-center gap-3">
                     <Mail size={16} className="text-primary flex-shrink-0" /> <span className="truncate">{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <ShieldCheck size={16} className="text-primary flex-shrink-0" /> VERIFIED_EXPERT
                  </div>
               </div>
            </div>

            <div className="brutal-card border-none bg-foreground text-background p-10 flex flex-col md:flex-row items-center gap-6">
                <p className="font-mono text-xs leading-tight italic opacity-80 decoration-primary decoration-4 underline underline-offset-8">
                   Identities are verified through regional medical council APIs twice per development cycle. Ensure license numbers match official registry records.
                </p>
            </div>
         </div>

         {/* Form Section */}
         <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="brutal-card bg-card p-10 space-y-10">
               <section className="space-y-6">
                  <h3 className="text-2xl font-black italic uppercase border-b-2 border-foreground pb-2 flex items-center gap-2">
                     <Stethoscope size={20} className="text-primary" /> PROFESSIONAL_IDENTITY
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-6">
                     <div className="space-y-2">
                        <label className="font-mono font-black uppercase text-xs flex items-center gap-2 italic">Full_Professional_Name_ (Required)</label>
                        <input 
                           type="text" 
                           name="name"
                           required
                           className="w-full border-2 border-foreground p-3 font-mono focus:bg-accent/5 outline-none font-bold"
                           value={formData.name}
                           onChange={handleChange}
                        />
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="font-mono font-black uppercase text-xs flex items-center gap-2 italic">Specialization_ (Primary)</label>
                           <input 
                              type="text" 
                              name="specialization"
                              required
                              className="w-full border-2 border-foreground p-3 font-mono focus:bg-accent/5 outline-none font-bold italic"
                              value={formData.specialization}
                              onChange={handleChange}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="font-mono font-black uppercase text-xs flex items-center gap-2 italic">Experience_ (YRS)</label>
                           <div className="relative">
                              <input 
                                 type="number" 
                                 name="experience_years"
                                 required
                                 className="w-full border-2 border-foreground p-3 pl-10 font-mono focus:bg-accent/5 outline-none font-bold"
                                 value={formData.experience_years}
                                 onChange={handleChange}
                              />
                              <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" />
                           </div>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="font-mono font-black uppercase text-xs flex items-center gap-2 italic">Clinical_Contact_</label>
                        <div className="relative">
                           <input 
                              type="tel" 
                              name="phone"
                              required
                              className="w-full border-2 border-foreground p-3 pl-10 font-mono focus:bg-accent/5 outline-none font-bold"
                              value={formData.phone}
                              onChange={handleChange}
                           />
                           <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="font-mono font-black uppercase text-xs flex items-center gap-2 italic">Professional_Biography_ (Patient View)</label>
                        <textarea 
                           rows="5" 
                           name="bio"
                           className="w-full border-2 border-foreground p-4 font-mono focus:bg-accent/5 outline-none resize-none font-medium italic"
                           placeholder="DESCRIBE your experience and approach to dermatology..."
                           value={formData.bio}
                           onChange={handleChange}
                        />
                     </div>
                  </div>
               </section>

               <div className="pt-6 border-t-2 border-foreground/10 flex flex-col gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="brutal-btn w-full py-5 text-2xl flex items-center justify-center gap-4 uppercase"
                  >
                     {saving ? <Loader2 className="animate-spin" /> : 'SYNCHRONIZE_IDENTITY_SYS'}
                  </button>
               </div>
            </form>
         </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
