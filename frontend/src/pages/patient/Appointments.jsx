import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  ChevronRight,
  MoreVertical,
  ArrowRight,
  Stethoscope,
  X,
  RefreshCw
} from 'lucide-react';

const PatientAppointments = () => {
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('confirmed'); // confirmed, completed, cancelled
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  
  const bookedSuccess = searchParams.get('booked') === 'success';

  useEffect(() => {
    fetchAppointments();
    // Auto-refresh when coming from successful booking
    if (bookedSuccess) {
      // Clear the URL parameter
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [activeTab, bookedSuccess]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      console.log('Fetching appointments for status:', activeTab); // Debug log
      const response = await api.get(`/api/appointments/patient?status=${activeTab}`);
      console.log('Appointments response:', response.data); // Debug log
      setAppointments(response.data.appointments || []);
    } catch (err) {
      console.error("Fetch appointments error:", err);
      setAppointments([]); // Ensure empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Add manual refresh function
  const handleRefresh = () => {
    fetchAppointments();
  };

  const handleCancelClick = (apptId) => {
    setCancellingId(apptId);
    setIsCancelModalOpen(true);
  };

  const handleCancelSubmit = async () => {
    if (!cancellingId) return;
    try {
      await api.patch(`/api/appointments/${cancellingId}/cancel`, { reason: cancelReason });
      fetchAppointments();
      setIsCancelModalOpen(false);
      setCancellingId(null);
      setCancelReason('');
    } catch (err) {
      alert("Cancellation failed. Please try again.");
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="space-y-4 border-b-2 border-foreground pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <h1 className="text-5xl font-black italic uppercase tracking-tighter">My_Appointments</h1>
           <p className="font-mono text-muted-foreground font-bold uppercase tracking-wider text-sm flex items-center gap-2">
              <Calendar size={16} /> Manage your professional consultations
           </p>
        </div>
        <button 
           onClick={handleRefresh}
           disabled={loading}
           className="brutal-btn px-6 py-3 text-lg flex items-center gap-2 uppercase whitespace-nowrap"
        >
           <RefreshCw className={`${loading ? 'animate-spin' : ''}`} size={20} />
           REFRESH
        </button>
      </div>

      {bookedSuccess && (
         <div className="bg-green-400 border-2 border-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4 text-foreground font-mono font-black italic uppercase text-lg">
               <CheckCircle size={32} /> APPOINTMENT_BOOKED_SUCCESSFULLY
            </div>
            <Link to="/patient/dashboard" className="font-mono font-bold text-sm underline decoration-2 underline-offset-4">DASHBOARD_SYS</Link>
         </div>
      )}

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
        <div className="animate-pulse font-mono font-bold text-2xl uppercase">RETRIEVING_SCHEDULE...</div>
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
                           <h3 className="text-4xl font-black uppercase italic leading-none">{appt.doctor_name}</h3>
                           <p className="font-mono text-primary font-black uppercase tracking-tight italic">{appt.doctor_specialization}</p>
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
                           <p className="font-mono text-[10px] font-black uppercase opacity-50">FACILITY_LOCATION</p>
                           <p className="font-mono font-bold text-sm flex items-start gap-2">
                              <MapPin size={16} className="text-primary flex-shrink-0" />
                              {appt.clinic_name} // {appt.doctor_clinic_pincode || 'REGIONAL_CENTER'}
                           </p>
                        </div>
                        <div className="space-y-2">
                           <p className="font-mono text-[10px] font-black uppercase opacity-50">PATIENT_NOTES</p>
                           <p className="font-mono italic text-sm text-muted-foreground">
                              "{appt.patient_notes || 'NONE_PROVIDED'}"
                           </p>
                        </div>
                     </div>

                     {/* Consultation Details for Comleted */}
                     {appt.status === 'completed' && appt.consultation && (
                        <div className="mt-8 bg-green-500/10 border-2 border-green-500 p-6 space-y-4 brutal-card shadow-none">
                           <h4 className="flex items-center gap-2 font-mono font-black uppercase text-green-700">
                              <Stethoscope size={20} /> DOCTOR_DIAGNOSIS_RECEIVED
                           </h4>
                           <div className="space-y-4">
                              <div className="space-y-1">
                                 <p className="font-mono text-[10px] uppercase font-black opacity-60">DIAGNOSIS_</p>
                                 <p className="font-mono font-black text-lg italic">{appt.consultation.doctor_diagnosis}</p>
                              </div>
                              <div className="space-y-1">
                                 <p className="font-mono text-[10px] uppercase font-black opacity-60">PRESCRIPTION_</p>
                                 <p className="font-mono font-bold whitespace-pre-line">{appt.consultation.prescription}</p>
                              </div>
                           </div>
                        </div>
                     )}

                     {activeTab === 'confirmed' && (
                        <div className="flex gap-4 pt-6">
                           <button 
                             onClick={() => handleCancelClick(appt.id)}
                             className="text-destructive font-mono font-black uppercase text-xs hover:underline flex items-center gap-2"
                           >
                              <XCircle size={16} /> CANCEL_APPOINTMENT
                           </button>
                           <Link to={`/patient/doctor/${appt.doctor_id}`} className="text-accent font-mono font-black uppercase text-xs hover:underline flex items-center gap-2">
                              <ArrowRight size={16} /> RESCHEDULE_SYS
                           </Link>
                        </div>
                     )}
                     
                     {appt.status === 'cancelled' && appt.cancellation_reason && (
                        <div className="mt-4 p-4 bg-destructive/5 border-2 border-destructive/20 font-mono text-xs italic">
                           <span className="font-black uppercase not-italic mr-2">REASON_FOR_CANCELLATION:</span>
                           {appt.cancellation_reason}
                        </div>
                     )}
                  </div>
               </div>
             ))
           ) : (
             <div className="brutal-card p-20 text-center space-y-6 bg-accent/5 border-dashed border-2">
                <AlertCircle size={48} className="mx-auto opacity-20" />
                <p className="font-mono font-black text-2xl uppercase opacity-30 italic">NO_{activeTab.toUpperCase()}_APPOINTMENTS_FOUND</p>
                <Link to="/patient/doctors" className="brutal-btn inline-block uppercase">Schedule New Consultation</Link>
             </div>
           )}
        </div>
      )}

      {/* Cancellation Modal */}
      {isCancelModalOpen && (
         <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="brutal-card bg-card w-full max-w-md p-10 space-y-8 animate-in zoom-in-95 duration-200">
               <div className="space-y-2">
                  <h3 className="text-4xl font-black italic uppercase italic leading-none border-b-2 border-foreground pb-2 flex items-center gap-3">
                     <XCircle className="text-destructive" /> CANCEL_?
                  </h3>
                  <p className="font-mono text-sm font-bold opacity-60 uppercase">TERMINATE_APPOINTMENT_REQUEST</p>
               </div>

               <div className="space-y-4">
                  <label className="font-mono font-black uppercase text-xs italic">Reason_for_Cancellation (Required)</label>
                  <textarea 
                     rows="4" 
                     className="w-full border-2 border-foreground p-4 font-mono focus:bg-accent/5 outline-none resize-none"
                     placeholder="BRIEF REASON FOR TERMINATION..."
                     value={cancelReason}
                     onChange={(e) => setCancelReason(e.target.value)}
                  />
               </div>

               <div className="flex gap-4">
                  <button 
                    onClick={() => setIsCancelModalOpen(false)}
                    className="flex-1 font-mono font-bold border-2 border-foreground py-3 bg-accent hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
                  >
                     Keep_It
                  </button>
                  <button 
                    onClick={handleCancelSubmit}
                    disabled={!cancelReason}
                    className="flex-1 brutal-btn bg-destructive py-3 uppercase"
                  >
                     Terminate_
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default PatientAppointments;
