import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { 
  Stethoscope, 
  Search, 
  CheckCircle, 
  XCircle, 
  Slash, 
  MoreVertical, 
  Loader2, 
  AlertCircle,
  Clock,
  Filter,
  ArrowRight,
  ShieldCheck,
  Building2,
  X
} from 'lucide-react';

const ManageDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending, approved, all
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, [activeTab]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const status = activeTab === 'all' ? null : activeTab;
      const response = await api.get(`/api/admin/doctors/all${status ? `?status=${status}` : ''}`);
      setDoctors(response.data.doctors);
    } catch (err) {
      console.error("Fetch doctors error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (docId) => {
    if (!window.confirm("Approve this professional for clinical practice?")) return;
    setActionLoading(true);
    try {
      await api.put(`/api/admin/doctors/${docId}/approve`);
      fetchDoctors();
    } catch (err) {
      alert("Approval failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = (doc) => {
    setSelectedDoctor(doc);
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedDoctor || !rejectionReason) return;
    setActionLoading(true);
    try {
      await api.put(`/api/admin/doctors/${selectedDoctor.id}/reject`, { reason: rejectionReason });
      fetchDoctors();
      setIsRejectModalOpen(false);
      setRejectionReason('');
    } catch (err) {
      alert("Rejection failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBlock = async (docId) => {
    setActionLoading(true);
    try {
      await api.put(`/api/admin/users/${docId}/block`);
      fetchDoctors();
    } catch (err) {
      alert("Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.clinic_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="animate-pulse font-mono font-bold text-2xl uppercase">RETRIEVING_MEDICAL_REGISTRY...</div>;

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b-2 border-foreground">
        <div className="space-y-4">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter">Medical_Registry</h1>
          <p className="font-mono text-muted-foreground font-bold uppercase tracking-wider text-sm flex items-center gap-2">
             <ShieldCheck size={16} /> Verification and oversight of professional medical staff
          </p>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative">
              <input 
                type="text" 
                placeholder="SEARCH_BY_NAME_OR_CLINIC"
                className="brutal-card p-3 pl-10 font-mono text-sm leading-none border-2 focus:bg-accent/5 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-accent/5 p-1 border-2 border-foreground max-w-sm">
         {['pending', 'approved', 'all'].map((tab) => (
           <button
             key={tab}
             onClick={() => setActiveTab(tab)}
             className={`flex-1 py-3 font-mono font-black uppercase text-xs transition-all ${
               activeTab === tab 
               ? 'bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]' 
               : 'hover:bg-accent/10 opacity-50'
             }`}
           >
             {tab.toUpperCase()}
           </button>
         ))}
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-6">
         {filteredDoctors.length > 0 ? (
           filteredDoctors.map((doc) => (
             <div key={doc.id} className="brutal-card bg-card p-6 flex flex-col md:flex-row gap-8 relative overflow-hidden transition-all hover:bg-accent/5">
                {/* Status Indicator */}
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                  doc.is_approved ? 'bg-green-400' : 'bg-yellow-400'
                }`}></div>

                <div className="w-24 h-24 border-2 border-foreground bg-accent/10 flex items-center justify-center overflow-hidden flex-shrink-0 font-mono font-black text-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                   {doc.name[0].toUpperCase()}
                </div>

                <div className="flex-1 space-y-4">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                         <h3 className="text-3xl font-black uppercase italic leading-none">{doc.name}</h3>
                         <div className="flex gap-4">
                            <p className="font-mono text-primary font-black uppercase tracking-tight text-xs underline decoration-2">{doc.specialization}</p>
                            <p className="font-mono text-xs opacity-50 uppercase font-black">LICENSE: {doc.license_number}</p>
                         </div>
                      </div>
                      <div className="flex gap-3">
                         {!doc.is_approved ? (
                            <>
                               <button 
                                 onClick={() => handleApprove(doc.id)}
                                 disabled={actionLoading}
                                 className="bg-green-400 border-2 border-foreground px-6 py-2 font-mono font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
                               >
                                  <CheckCircle size={14} /> APPROVE_CREDENTIALS
                               </button>
                               <button 
                                 onClick={() => handleRejectClick(doc)}
                                 disabled={actionLoading}
                                 className="bg-destructive text-destructive-foreground border-2 border-foreground px-6 py-2 font-mono font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
                               >
                                  <XCircle size={14} /> REJECT_APPLICATION
                               </button>
                            </>
                         ) : (
                            <button 
                              onClick={() => handleToggleBlock(doc.id)}
                              disabled={actionLoading}
                              className={`border-2 border-foreground px-6 py-2 font-mono font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 ${
                                doc.is_active ? 'bg-destructive text-destructive-foreground' : 'bg-green-400'
                              }`}
                            >
                               <Slash size={14} /> {doc.is_active ? 'BLOCK_ACCOUNT' : 'UNBLOCK_ACCOUNT'}
                            </button>
                         )}
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-foreground/5">
                      <div className="space-y-1">
                         <p className="font-mono text-[10px] font-black uppercase opacity-50 flex items-center gap-1"><Building2 size={12}/> FACILITY_</p>
                         <p className="font-mono font-bold text-xs uppercase italic">{doc.clinic_name}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="font-mono text-[10px] font-black uppercase opacity-50 flex items-center gap-1"><Clock size={12}/> EXPERIENCE_</p>
                         <p className="font-mono font-bold text-xs uppercase">{doc.experience_years} YEARS IN PRACTICE</p>
                      </div>
                      <div className="space-y-1">
                         <p className="font-mono text-[10px] font-black uppercase opacity-50 flex items-center gap-1"><AlertCircle size={12}/> CONTACT_IDENTITY_</p>
                         <p className="font-mono font-bold text-xs uppercase">{doc.email}</p>
                      </div>
                   </div>
                </div>
             </div>
           ))
         ) : (
           <div className="brutal-card p-20 text-center space-y-4 bg-accent/5 border-dashed border-2">
              <p className="font-mono font-black text-3xl uppercase opacity-20 italic">0_PROFILES_DETECTED_IN_{activeTab.toUpperCase()}_STAGE</p>
           </div>
         )}
      </div>

      {/* Reject Modal */}
      {isRejectModalOpen && (
         <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="brutal-card bg-card w-full max-w-md p-10 space-y-8 animate-in zoom-in-95 duration-200">
               <div className="space-y-2">
                  <h3 className="text-4xl font-black italic uppercase italic leading-none border-b-2 border-foreground pb-2 flex items-center gap-3">
                     <XCircle className="text-destructive" /> REJECT_?
                  </h3>
                  <p className="font-mono text-sm font-bold opacity-60 uppercase">FOR_{selectedDoctor?.name?.toUpperCase()}</p>
               </div>

               <div className="space-y-4">
                  <label className="font-mono font-black uppercase text-xs italic">Reason_for_Rejection_ (Required)</label>
                  <textarea 
                     rows="4" 
                     className="w-full border-2 border-foreground p-4 font-mono focus:bg-accent/5 outline-none resize-none"
                     placeholder="BRIEF REASON FOR APPLICATION DENIAL..."
                     value={rejectionReason}
                     onChange={(e) => setRejectionReason(e.target.value)}
                  />
               </div>

               <div className="flex gap-4">
                  <button 
                    onClick={() => setIsRejectModalOpen(false)}
                    className="flex-1 font-mono font-bold border-2 border-foreground py-3 bg-accent hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
                  >
                     ABORT_
                  </button>
                  <button 
                    onClick={handleRejectSubmit}
                    disabled={!rejectionReason || actionLoading}
                    className="flex-1 brutal-btn bg-destructive py-3 uppercase"
                  >
                     {actionLoading ? <Loader2 className="animate-spin" /> : 'REJECT_APPLICATION'}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default ManageDoctors;
