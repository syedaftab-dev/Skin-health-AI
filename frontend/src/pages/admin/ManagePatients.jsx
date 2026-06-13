import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { 
  Users, 
  Search, 
  Slash, 
  Loader2, 
  AlertCircle, 
  Filter, 
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  Phone,
  Mail,
  ShieldAlert
} from 'lucide-react';

const ManagePatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/patients');
      setPatients(response.data.patients);
    } catch (err) {
      console.error("Fetch patients error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (patientId) => {
    if (!window.confirm("Modify access status for this user?")) return;
    setActionLoading(true);
    try {
      await api.put(`/api/admin/users/${patientId}/block`);
      fetchPatients();
    } catch (err) {
      alert("Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="animate-pulse font-mono font-bold text-2xl uppercase text-accent">REPLICATING_USER_DATABASES...</div>;

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b-2 border-foreground">
        <div className="space-y-4">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter">User_Registry</h1>
          <p className="font-mono text-muted-foreground font-bold uppercase tracking-wider text-sm flex items-center gap-2">
             <Users size={16} /> Oversight of all patient nodes and access permissions
          </p>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative">
              <input 
                type="text" 
                placeholder="SEARCH_BY_NAME_OR_IDENT_"
                className="brutal-card p-3 pl-10 font-mono text-sm leading-none border-2 focus:bg-accent/5 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
         {filteredPatients.length > 0 ? (
           filteredPatients.map((patient) => (
             <div key={patient.id} className="brutal-card bg-card p-8 flex flex-col md:flex-row gap-8 relative overflow-hidden transition-all hover:bg-accent/5 group">
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                  patient.is_active ? 'bg-primary' : 'bg-destructive'
                }`}></div>

                <div className="w-20 h-20 border-2 border-foreground bg-accent/20 flex flex-col items-center justify-center font-mono font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white group-hover:bg-primary transition-all">
                   <span className="text-4xl leading-none group-hover:text-background">{patient.name[0].toUpperCase()}</span>
                   <span className="text-[9px] opacity-40 uppercase font-black tracking-widest mt-1 group-hover:text-background/50">NODE_0{patient.id.slice(-2)}</span>
                </div>

                <div className="flex-1 space-y-6">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                         <h3 className="text-4xl font-black uppercase italic leading-none">{patient.name}</h3>
                         <div className="flex gap-4 font-mono text-xs uppercase font-black italic opacity-60">
                            <span className="flex items-center gap-1"><Mail size={12}/> {patient.email}</span>
                            <span className="flex items-center gap-1"><Phone size={12}/> {patient.phone}</span>
                         </div>
                      </div>
                      <div className="flex gap-4">
                         <div className="flex flex-col items-end gap-1 px-4 border-r-2 border-foreground/10">
                            <p className="font-mono text-[9px] font-black uppercase opacity-60 leading-none">MEMBERSHIP_</p>
                            <p className="font-mono font-black text-sm uppercase italic underline decoration-2 decoration-primary underline-offset-4">{new Date(patient.created_at).toLocaleDateString()}</p>
                         </div>
                         <button 
                           onClick={() => handleToggleBlock(patient.id)}
                           disabled={actionLoading}
                           className={`brutal-btn py-2 px-6 flex items-center justify-center gap-2 text-xs uppercase font-black transition-all ${
                             patient.is_active ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'
                           }`}
                         >
                            {patient.is_active ? <ShieldAlert size={16} /> : <Users size={16} />}
                            {patient.is_active ? 'REVOKE_ACCESS' : 'RESTORE_ACCESS'}
                         </button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-4 border-t border-foreground/10">
                      <div className="space-y-1">
                         <p className="font-mono text-[10px] uppercase font-black opacity-40">AI_PREDICTIONS_</p>
                         <p className="text-2xl font-black italic leading-none text-primary">{patient.predictions_count}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="font-mono text-[10px] uppercase font-black opacity-40">CONSULTATIONS_</p>
                         <p className="text-2xl font-black italic leading-none text-accent">{patient.appointments_count}</p>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                         <p className="font-mono text-[10px] uppercase font-black opacity-40">LATEST_ACTIVITY_</p>
                         <div className="flex items-center gap-3 font-mono font-bold text-xs uppercase leading-tight italic mt-1">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                            NODE_SYNCHRONIZED_STABLE_FLOW
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           ))
         ) : (
           <div className="brutal-card p-20 text-center space-y-4 bg-destructive/5 border-dashed border-2 border-destructive/20">
              <AlertCircle size={48} className="mx-auto opacity-20" />
              <p className="font-mono font-black text-3xl uppercase opacity-20 italic">0_USER_PROFILES_MATCH_CRITERIA</p>
           </div>
         )}
      </div>

      {/* Admin Disclaimer Footer */}
      <div className="brutal-card border-none bg-foreground text-background p-10 flex items-center gap-8 relative overflow-hidden group">
         <div className="w-16 h-16 bg-primary flex-shrink-0 flex items-center justify-center border-2 border-background shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
            <Slash size={24} className="group-hover:rotate-180 transition-transform duration-500" />
         </div>
         <p className="font-mono text-sm font-black italic uppercase leading-tight text-neutral-300 max-w-2xl relative z-10">
            Revoking access immediately terminates all active web-socket handshakes and invalidates current JWT tokens. Patient clinical data remains archived for legal compliance logic.
         </p>
         <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 scale-150">
            <Users size={120} className="text-primary" />
         </div>
      </div>
    </div>
  );
};

export default ManagePatients;
