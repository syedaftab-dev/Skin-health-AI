import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { 
  Building2, 
  MapPin, 
  IndianRupee, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Info,
  ArrowRight,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';

const ClinicSettings = () => {
  const [formData, setFormData] = useState({
    clinic_name: '',
    clinic_address: '',
    clinic_pincode: '',
    consultation_fee: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchClinic = async () => {
      try {
        const response = await api.get('/api/doctor/profile');
        const data = response.data;
        setFormData({
          clinic_name: data.clinic_name || '',
          clinic_address: data.clinic_address || '',
          clinic_pincode: data.clinic_pincode || '',
          consultation_fee: data.consultation_fee || 0
        });
      } catch (err) {
        console.error("Clinic fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClinic();
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
      await api.put('/api/doctor/clinic-settings', formData);
      setMessage({ type: 'success', text: 'CLINICAL_FACILITY_DATA_RECONFIGURED' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (err) {
      setMessage({ type: 'error', text: 'RECONFIGURATION_FAILURE_DETECTED' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse font-mono font-bold uppercase text-2xl">RETRIEVING_FACILITY_GEOMETRY...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="space-y-4 border-b-2 border-foreground pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <h1 className="text-5xl font-black italic uppercase tracking-tighter">Facility_Cfg</h1>
           <p className="font-mono text-muted-foreground font-bold uppercase tracking-wider text-sm flex items-center gap-2">
              <Building2 size={16} /> Configure your physical examination environment
           </p>
        </div>
        <button 
           onClick={handleSubmit} 
           disabled={saving}
           className="brutal-btn px-10 py-3 text-lg flex items-center gap-3 uppercase whitespace-nowrap"
        >
           {saving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Deploy_Changes</>}
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
         {/* Sidebar Stats */}
         <div className="md:col-span-1 space-y-8">
            <div className="brutal-card bg-accent p-8 space-y-6">
               <h3 className="text-2xl font-black italic uppercase italic underline decoration-2 underline-offset-4">REGIONAL_DATA_</h3>
               <div className="space-y-4 font-mono text-xs font-black uppercase">
                  <div className="space-y-1">
                     <p className="opacity-50">Operational_Status</p>
                     <p className="flex items-center gap-2 text-primary font-black italic uppercase underline decoration-2 decoration-foreground">VERIFIED_LOCATION</p>
                  </div>
                  <div className="space-y-1">
                     <p className="opacity-50">Service_Territory</p>
                     <p className="text-foreground">{formData.clinic_pincode || 'NONE_DEFINED'}</p>
                  </div>
               </div>
            </div>

            <div className="brutal-card border-none bg-foreground text-background p-8 space-y-4">
               <div className="flex items-center gap-3">
                  <ShieldCheck className="text-secondary" size={24} />
                  <h4 className="font-mono font-black text-secondary uppercase text-xs">TRUST_METRIC_</h4>
               </div>
               <p className="font-mono text-xs leading-tight italic opacity-80">
                  Accurate clinic details improve your visibility in local searches. High-precision pincode mapping ensures patients within a {formData.clinic_pincode?.startsWith('11') ? '5km' : '10km'} radius are prioritized.
               </p>
            </div>
         </div>

         {/* Form Section */}
         <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="brutal-card bg-card p-10 space-y-10">
               <section className="space-y-6">
                  <h3 className="text-2xl font-black italic uppercase border-b-2 border-foreground pb-2 flex items-center gap-2">
                     <Building2 size={20} className="text-primary" /> CLINIC_IDENTIFICATION
                  </h3>
                  
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="font-mono font-black uppercase text-xs flex items-center gap-2 italic font-black">Official_Facility_Name_ (Required)</label>
                        <input 
                           type="text" 
                           name="clinic_name"
                           required
                           className="w-full border-2 border-foreground p-3 font-mono font-bold bg-white focus:bg-accent/5 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] outline-none"
                           placeholder="HOSPITAL OR CLINIC NAME"
                           value={formData.clinic_name}
                           onChange={handleChange}
                        />
                     </div>
                     
                     <div className="space-y-2">
                        <label className="font-mono font-black uppercase text-xs flex items-center gap-2 italic">Full_Physical_Address_ (Verifiable)</label>
                        <textarea 
                           rows="3" 
                           name="clinic_address"
                           required
                           className="w-full border-2 border-foreground p-3 font-mono focus:bg-accent/5 outline-none resize-none"
                           placeholder="STREET, BUILDING, LANDMARK..."
                           value={formData.clinic_address}
                           onChange={handleChange}
                        />
                     </div>
                  </div>
               </section>

               <section className="space-y-6">
                  <h3 className="text-2xl font-black italic uppercase border-b-2 border-foreground pb-2 flex items-center gap-2">
                     <MapPin size={20} className="text-primary" /> GEOGRAPHIC_SYSTEM_DATA
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="font-mono font-black uppercase text-xs flex items-center gap-2 italic">Regional_Pincode_ (Required)</label>
                        <input 
                           type="text" 
                           name="clinic_pincode"
                           required
                           className="w-full border-2 border-foreground p-3 font-mono focus:bg-accent/5 outline-none"
                           placeholder="XXXXXX"
                           value={formData.clinic_pincode}
                           onChange={handleChange}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="font-mono font-black uppercase text-xs flex items-center gap-2 italic">Consultation_Fee_ (INR)</label>
                        <div className="relative">
                           <input 
                              type="number" 
                              name="consultation_fee"
                              required
                              min="0"
                              className="w-full border-2 border-foreground p-3 pl-10 font-mono focus:bg-accent/5 outline-none"
                              value={formData.consultation_fee}
                              onChange={handleChange}
                           />
                           <IndianRupee size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" />
                        </div>
                     </div>
                  </div>
               </section>

               <div className="pt-6 border-t-2 border-foreground/10 flex flex-col gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="brutal-btn w-full py-5 text-2xl flex items-center justify-center gap-4 uppercase"
                  >
                     {saving ? <Loader2 className="animate-spin" /> : 'SYNCHRONIZE_LOCATION_SYS'}
                  </button>
                  <p className="font-mono text-[10px] font-black italic uppercase text-center opacity-40">
                     Clinical addresses are stored in shared doctor-discovery database for geo-spatial querying.
                  </p>
               </div>
            </form>
         </div>
      </div>

      <div className="brutal-card bg-foreground p-10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
         <div className="w-20 h-20 bg-primary flex-shrink-0 flex items-center justify-center border-2 border-background shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
            <Stethoscope size={40} className="text-secondary" />
         </div>
         <div className="space-y-1">
            <p className="font-mono text-xl font-bold italic leading-tight text-neutral-300">
               Update your clinical fee to reflect recent professional benchmarking. Patients will be notified of fee changes through the platform transparency ledger.
            </p>
         </div>
         <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 scale-150">
            <Building2 size={120} className="text-primary" />
         </div>
      </div>
    </div>
  );
};

export default ClinicSettings;
