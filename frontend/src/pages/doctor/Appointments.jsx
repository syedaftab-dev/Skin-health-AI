import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  XCircle, 
  Stethoscope, 
  FileText,
  User,
  ArrowRight,
  TrendingUp,
  X
} from 'lucide-react';

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('confirmed'); // confirmed, completed, cancelled
  
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [consultData, setConsultData] = useState({
    diagnosis: '',
    prescription: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [activeTab]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/appointments/doctor?status=${activeTab}`);
      setAppointments(response.data.appointments);
    } catch (err) {
      console.error("Fetch appointments error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConsult = (appt) => {
    setSelectedAppt(appt);
    setIsConsultModalOpen(true);
  };

  const handleConsultSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    console.log('Submitting consultation for appointment:', selectedAppt.id); // Debug log
    console.log('Consult data:', consultData); // Debug log
    
    try {
      const response = await api.post(`/api/doctors/appointments/${selectedAppt.id}/complete`, {
        doctor_diagnosis: consultData.diagnosis,
        prescription: consultData.prescription,
        notes: consultData.notes
      });
      console.log('Consultation response:', response.data); // Debug log
      fetchAppointments();
      setIsConsultModalOpen(false);
      setConsultData({ diagnosis: '', prescription: '', notes: '' });
    } catch (err) {
      console.error('Consultation error:', err); // Debug log
      console.error('Error response:', err.response?.data); // Debug log
      alert("Failed to complete appointment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="space-y-4 border-b-2 border-foreground pb-6">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter">Queue_Management</h1>
        <p className="font-mono text-muted-foreground font-bold uppercase tracking-wider text-sm flex items-center gap-2">
           <Calendar size={16} /> Manage your professional consultations and diagnoses
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-accent/5 p-1 border-2 border-foreground max-w-md">
         {['confirmed', 'completed', 'cancelled'].map((tab) => (
           <button
             key={tab}
             onClick={() => setActiveTab(tab)}
             className={`flex-1 py-3 font-mono font-black uppercase text-xs transition-all ${
               activeTab === tab 
               ? 'bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]' 
               : 'hover:bg-accent/10 opacity-50'
             }`}
           >
             {tab === 'confirmed' ? 'UPCOMING' : tab}
           </button>
         ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="animate-pulse font-mono font-bold text-2xl uppercase">RETRIEVING_QUEUE_DATA...</div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
           {appointments.length > 0 ? (
             appointments.map((appt) => (
               <div key={appt.id} className="brutal-card bg-card p-8 flex flex-col md:flex-row gap-8 relative overflow-hidden transition-all hover:bg-accent/5">
                  {/* Status Indicator */}
                  <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                    appt.status === 'confirmed' ? 'bg-primary' : 
                    appt.status === 'completed' ? 'bg-green-400' : 'bg-destructive'
                  }`}></div>

                  <div className="flex-1 space-y-6">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                           <h3 className="text-4xl font-black uppercase italic leading-none">{appt.patient_name}</h3>
                           <p className="font-mono text-primary font-black uppercase tracking-tight italic opacity-60">ID: {appt.patient_id.slice(-8)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           <div className="flex items-center gap-2 font-mono font-black text-xl uppercase">
                              <Calendar size={20} className="text-accent" /> {appt.appointment_date}
                           </div>
                           <div className="flex items-center gap-2 font-mono font-black text-xl uppercase italic opacity-60">
                              <Clock size={20} /> {appt.appointment_time}
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-foreground/10">
                        <div className="space-y-2">
                           <p className="font-mono text-[10px] font-black uppercase opacity-50 text-primary">AI_DIAGNOSES_CONTEXT_</p>
                           {appt.prediction ? (
                              <div className="bg-accent/10 p-4 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4">
                                 <div className="w-12 h-12 border border-foreground bg-white overflow-hidden">
                                    <img src={`http://localhost:8000${appt.prediction.image_url}`} alt="" className="w-full h-full object-cover" />
                                 </div>
                                 <div>
                                    <p className="font-mono font-black uppercase text-sm leading-none italic">{appt.prediction.disease_name}</p>
                                    <p className="font-mono text-[10px] font-black uppercase opacity-60">{appt.prediction.confidence_score}% CONFIRMATION_PROB</p>
                                 </div>
                              </div>
                           ) : (
                              <p className="font-mono italic text-sm text-muted-foreground p-3 border-2 border-dashed border-foreground/20">NO_SYSTEM_PREDICTION_FOUND</p>
                           )}
                        </div>
                        <div className="space-y-2">
                           <p className="font-mono text-[10px] font-black uppercase opacity-50 text-primary">COMPLAINT_DETAILS_</p>
                           <p className="font-mono italic text-sm text-muted-foreground p-3 border-2 border-accent border-dashed bg-accent/5">
                              "{appt.patient_notes || 'NONE_PROVIDED'}"
                           </p>
                        </div>
                     </div>

                     {/* AI Diagnosis Context */}
                     {appt.prediction && (
                        <div className="mt-6 bg-primary/5 border-2 border-primary/20 p-6 space-y-4 brutal-card shadow-none">
                           <h4 className="flex items-center gap-2 font-mono font-black uppercase text-primary">
                              <FileText size={20} className="text-primary" /> AI_DIAGNOSIS_CONTEXT
                           </h4>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                 <div className="space-y-1">
                                    <p className="font-mono text-[10px] uppercase font-black opacity-60">AI_PREDICTED_CONDITION</p>
                                    <p className="font-mono font-black text-lg italic text-primary">{appt.prediction.disease_name}</p>
                                    <p className="font-mono text-xs opacity-60 italic">({appt.prediction.disease_medical_term})</p>
                                 </div>
                                 
                                 <div className="space-y-1">
                                    <p className="font-mono text-[10px] uppercase font-black opacity-60">CONFIDENCE_SCORE</p>
                                    <p className="font-mono font-bold text-lg">{appt.prediction.confidence_score}%</p>
                                 </div>
                                 
                                 <div className="space-y-1">
                                    <p className="font-mono text-[10px] uppercase font-black opacity-60">SEVERITY_LEVEL</p>
                                    <p className={`font-mono font-bold text-sm px-3 py-1 inline-block border-2 ${
                                       appt.prediction.severity === 'High' ? 'bg-destructive text-destructive-foreground border-destructive' :
                                       appt.prediction.severity === 'Medium' ? 'bg-yellow-400 text-foreground border-yellow-400' :
                                       'bg-green-400 text-foreground border-green-400'
                                     }`}>
                                       {appt.prediction.severity}
                                     </p>
                                 </div>
                              </div>
                              
                              <div className="space-y-3">
                                 <div className="space-y-1">
                                    <p className="font-mono text-[10px] uppercase font-black opacity-60">AI_DESCRIPTION</p>
                                    <p className="font-mono text-sm leading-tight">{appt.prediction.description}</p>
                                 </div>
                                 
                                 <div className="space-y-1">
                                    <p className="font-mono text-[10px] uppercase font-black opacity-60">URGENCY_RECOMMENDATION</p>
                                    <p className="font-mono font-bold text-sm text-primary">{appt.prediction.recommendation}</p>
                                 </div>
                                 
                                 {appt.prediction.image_url && (
                                    <div className="space-y-1">
                                       <p className="font-mono text-[10px] uppercase font-black opacity-60">ORIGINAL_SCAN</p>
                                       <div className="w-24 h-24 border-2 border-foreground overflow-hidden bg-white">
                                          <img src={`http://localhost:8000${appt.prediction.image_url}`} alt="Patient scan" className="w-full h-full object-cover" />
                                       </div>
                                    </div>
                                 )}
                              </div>
                           </div>
                           
                           {appt.prediction.recommended_actions && appt.prediction.recommended_actions.length > 0 && (
                              <div className="border-t border-primary/20 pt-4">
                                 <p className="font-mono text-[10px] uppercase font-black opacity-60 mb-2">AI_RECOMMENDED_ACTIONS</p>
                                 <ul className="space-y-1 font-mono text-sm">
                                    {appt.prediction.recommended_actions.map((action, i) => (
                                       <li key={i} className="flex items-start gap-2">
                                          <span className="text-primary font-black">•</span>
                                          <span>{action}</span>
                                       </li>
                                    ))}
                                 </ul>
                              </div>
                           )}
                        </div>
                     )}

                     {activeTab === 'confirmed' && (
                        <div className="flex gap-4 pt-6">
                           <button 
                             onClick={() => handleOpenConsult(appt)}
                             className="brutal-btn uppercase text-sm px-10 py-3 flex items-center gap-2"
                           >
                              <Stethoscope size={18} /> COMPLETE_CONSULTATION
                           </button>
                           <button className="text-destructive font-mono font-black uppercase text-xs hover:underline flex items-center gap-2">
                              <XCircle size={16} /> CANCEL_EXAMINATION
                           </button>
                        </div>
                     )}

                     {appt.status === 'completed' && appt.consultation && (
                        <div className="mt-8 bg-green-500/10 border-2 border-green-500/50 p-6 space-y-4 brutal-card shadow-none">
                           <h4 className="flex items-center gap-2 font-mono font-black uppercase">
                              <CheckCircle size={20} className="text-green-500" /> FINALIZED_DIAGNOSES_REPORT
                           </h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-1">
                                 <p className="font-mono text-[10px] uppercase font-black opacity-60">DOCTOR_DIAGNOSIS_</p>
                                 <p className="font-mono font-black text-lg italic text-green-700">{appt.consultation.doctor_diagnosis}</p>
                              </div>
                              <div className="space-y-1">
                                 <p className="font-mono text-[10px] uppercase font-black opacity-60">PRESCRIPTION_</p>
                                 <p className="font-mono font-bold text-sm whitespace-pre-line">{appt.consultation.prescription}</p>
                              </div>
                           </div>
                        </div>
                     )}
                     
                     {appt.status === 'cancelled' && (
                        <div className="mt-4 p-4 bg-destructive/5 border-2 border-destructive/20 font-mono text-xs italic">
                           <span className="font-black uppercase not-italic mr-2">CANCELLATION_STATUS:</span>
                           {appt.cancellation_reason || 'TERMINATED_BY_SYSTEM_OR_ADMIN'}
                        </div>
                     )}
                  </div>
               </div>
             ))
           ) : (
             <div className="brutal-card p-20 text-center space-y-6 bg-accent/5 border-dashed border-2">
                <AlertCircle size={48} className="mx-auto opacity-20" />
                <p className="font-mono font-black text-2xl uppercase opacity-30 italic">NO_{activeTab.toUpperCase()}_APPOINTMENTS_IN_QUEUE</p>
             </div>
           )}
        </div>
      )}

      {/* Consultation Completion Modal */}
      {isConsultModalOpen && (
         <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <form onSubmit={handleConsultSubmit} className="brutal-card bg-card w-full max-w-2xl p-10 space-y-8 animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto">
               <div className="flex items-center justify-between border-b-2 border-foreground pb-4">
                  <div className="space-y-1">
                     <h3 className="text-4xl font-black italic uppercase italic leading-none">CONSULTATION_REPORT</h3>
                     <p className="font-mono text-xs font-bold opacity-60 uppercase">FOR_{selectedAppt?.patient_name?.toUpperCase()}</p>
                  </div>
                  <button type="button" onClick={() => setIsConsultModalOpen(false)} className="brutal-btn p-2 shadow-none bg-accent"><X size={24} /></button>
               </div>

               {/* AI Diagnosis Reference */}
               {selectedAppt?.prediction && (
                  <div className="bg-primary/5 border-2 border-primary/20 p-6 space-y-4 brutal-card shadow-none">
                     <h4 className="flex items-center gap-2 font-mono font-black uppercase text-primary">
                        <FileText size={16} className="text-primary" /> AI_ANALYSIS_REFERENCE
                     </h4>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                           <p className="font-mono text-[10px] uppercase font-black opacity-60">AI_Prediction</p>
                           <p className="font-mono font-bold">{selectedAppt.prediction.disease_name}</p>
                           <p className="font-mono text-xs opacity-60">({selectedAppt.prediction.confidence_score}% confidence)</p>
                        </div>
                        <div>
                           <p className="font-mono text-[10px] uppercase font-black opacity-60">Severity</p>
                           <p className={`font-mono font-bold text-xs px-2 py-1 inline-block border ${
                              selectedAppt.prediction.severity === 'High' ? 'bg-destructive text-destructive-foreground border-destructive' :
                              selectedAppt.prediction.severity === 'Medium' ? 'bg-yellow-400 text-foreground border-yellow-400' :
                              'bg-green-400 text-foreground border-green-400'
                            }`}>
                              {selectedAppt.prediction.severity}
                            </p>
                        </div>
                     </div>
                     
                     {selectedAppt.prediction.recommended_actions && selectedAppt.prediction.recommended_actions.length > 0 && (
                        <div>
                           <p className="font-mono text-[10px] uppercase font-black opacity-60 mb-2">AI_Recommended_Actions</p>
                           <ul className="space-y-1 font-mono text-xs">
                              {selectedAppt.prediction.recommended_actions.slice(0, 3).map((action, i) => (
                                 <li key={i} className="flex items-start gap-1">
                                    <span className="text-primary font-black">•</span>
                                    <span>{action}</span>
                                 </li>
                              ))}
                              {selectedAppt.prediction.recommended_actions.length > 3 && (
                                 <li className="text-primary font-mono text-xs italic">+{selectedAppt.prediction.recommended_actions.length - 3} more recommendations...</li>
                              )}
                           </ul>
                        </div>
                     )}
                  </div>
               )}

               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="font-mono font-black uppercase text-xs italic flex items-center gap-2"><ArrowRight size={14} className="text-primary"/> Final_Diagnosis_ (Required)</label>
                     <input 
                        type="text" 
                        required
                        className="w-full border-2 border-foreground p-4 font-mono focus:bg-accent/5 outline-none"
                        placeholder="SPECIFIC MEDICAL CONDITION NAME"
                        value={consultData.diagnosis}
                        onChange={(e) => setConsultData({ ...consultData, diagnosis: e.target.value })}
                     />
                  </div>

                  <div className="space-y-2">
                     <label className="font-mono font-black uppercase text-xs italic flex items-center gap-2"><ArrowRight size={14} className="text-primary"/> Prescription_ / Treatment_Plan_ (Required)</label>
                     <textarea 
                        rows="5" 
                        required
                        className="w-full border-2 border-foreground p-4 font-mono focus:bg-accent/5 outline-none resize-none"
                        placeholder="MEDICATIONS, DOSAGE, AND CARE INSTRUCTIONS..."
                        value={consultData.prescription}
                        onChange={(e) => setConsultData({ ...consultData, prescription: e.target.value })}
                     />
                  </div>

                  <div className="space-y-2">
                     <label className="font-mono font-black uppercase text-xs italic flex items-center gap-2"><ArrowRight size={14} className="text-primary"/> Private_Clinical_Notes (Internal Only)</label>
                     <textarea 
                        rows="3" 
                        className="w-full border-2 border-foreground p-4 font-mono focus:bg-accent/5 outline-none resize-none"
                        placeholder="ADDITIONAL NOTES FOR PATIENT HISTORY..."
                        value={consultData.notes}
                        onChange={(e) => setConsultData({ ...consultData, notes: e.target.value })}
                     />
                  </div>
               </div>

               <div className="pt-6 border-t-2 border-foreground/10 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsConsultModalOpen(false)}
                    className="flex-1 font-mono font-bold border-2 border-foreground py-4 hover:bg-accent/5 transition-all uppercase"
                  >
                     Keep_Open
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="flex-1 brutal-btn py-4 text-xl flex items-center justify-center gap-3 uppercase"
                  >
                     {saving ? <Loader2 className="animate-spin" /> : 'SUBMIT_FINAL_REPORT_SYS'}
                  </button>
               </div>

               <div className="bg-foreground text-background p-4 flex items-center gap-4 text-xs font-mono font-bold uppercase overflow-hidden relative">
                  <TrendingUp className="text-primary flex-shrink-0" size={20} />
                  <p className="opacity-70 italic leading-none whitespace-nowrap">AUTHENTICATING_DOC_SIGNATURE... ENCRYPTING_PATIENT_RECORDS... COMMITTING_TO_HISTORY...</p>
               </div>
            </form>
         </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
