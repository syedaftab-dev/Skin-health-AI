import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { 
  Users, 
  Search, 
  ArrowRight, 
  Calendar, 
  Clock, 
  User, 
  MoreVertical,
  Filter,
  AlertCircle,
  Stethoscope,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DoctorPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/doctor/patients');
      setPatients(response.data.patients);
    } catch (err) {
      console.error("Fetch patients error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientHistory = async (patientId) => {
    setHistoryLoading(true);
    try {
      const response = await api.get(`/api/doctor/patients/${patientId}/history`);
      setPatientHistory(response.data.history);
    } catch (err) {
      console.error("Fetch history error:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
    fetchPatientHistory(patient.id);
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="animate-pulse font-mono font-bold text-2xl uppercase">RETRIEVING_PATIENT_DATABASE...</div>;

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b-2 border-foreground">
        <div className="space-y-4">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter">My_Patients</h1>
          <p className="font-mono text-muted-foreground font-bold uppercase tracking-wider text-sm flex items-center gap-2">
             <Users size={16} /> Registry of individuals under clinical supervision
          </p>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative">
              <input 
                type="text" 
                placeholder="SEARCH_BY_NAME_OR_PHONE"
                className="brutal-card p-3 pl-10 font-mono text-sm leading-none border-2 focus:bg-accent/5 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {filteredPatients.length > 0 ? (
           filteredPatients.map((patient) => (
             <div 
               key={patient.id} 
               onClick={() => handlePatientClick(patient)}
               className="brutal-card bg-card p-8 flex flex-col gap-6 cursor-pointer hover:bg-accent/5 transition-all group"
             >
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 border-2 border-foreground bg-primary flex items-center justify-center font-mono font-black text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:bg-accent transition-all text-background group-hover:text-foreground">
                      {patient.name[0].toUpperCase()}
                   </div>
                   <div className="space-y-1">
                      <h3 className="text-2xl font-black uppercase italic leading-none">{patient.name}</h3>
                      <p className="font-mono text-xs opacity-50 uppercase font-black italic">{patient.phone}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-y-2 border-foreground/5 py-4">
                   <div className="space-y-1">
                      <p className="font-mono text-[10px] uppercase font-black opacity-60">TOTAL_VISITS_</p>
                      <p className="font-mono font-black text-lg italic leading-none text-primary">{patient.appointments_count}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="font-mono text-[10px] uppercase font-black opacity-60">GENDER_</p>
                      <p className="font-mono font-black text-lg italic leading-none uppercase">{patient.gender || 'N/A'}</p>
                   </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono font-black uppercase italic tracking-tighter text-primary group-hover:underline">
                   VIEW_CLINICAL_HISTORY <ArrowRight size={16} />
                </div>
             </div>
           ))
         ) : (
           <div className="md:col-span-3 brutal-card p-20 text-center space-y-4 bg-accent/5 border-dashed border-2">
              <AlertCircle size={48} className="mx-auto opacity-20" />
              <p className="font-mono font-black text-2xl uppercase opacity-20 italic">0_MATCHES_FOUND_IN_REGISTRY</p>
           </div>
         )}
      </div>

      {/* Patient History Modal */}
      {selectedPatient && (
         <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="brutal-card bg-card w-full max-w-4xl p-10 space-y-8 animate-in slide-in-from-right-10 duration-300 max-h-[90vh] overflow-y-auto">
               <div className="flex items-center justify-between border-b-2 border-foreground pb-4">
                  <div className="space-y-1">
                     <h3 className="text-4xl font-black italic uppercase italic leading-none">{selectedPatient.name}_HISTORY</h3>
                     <p className="font-mono text-xs font-bold opacity-60 uppercase">COMPLETE_CLINICAL_LOG_FOR_PATIENT</p>
                  </div>
                  <button onClick={() => setSelectedPatient(null)} className="brutal-btn p-2 shadow-none bg-accent"><X size={24} /></button>
               </div>

               {historyLoading ? (
                  <div className="animate-pulse font-mono font-bold uppercase text-xl">RETRIEVING_RECORDS...</div>
               ) : (
                  <div className="space-y-6">
                     {patientHistory.length > 0 ? (
                       patientHistory.map((item, i) => (
                         <div key={i} className="flex gap-10 border-b-2 border-foreground/10 pb-8 last:border-b-0 group">
                            <div className="w-24 font-mono space-y-1 flex-shrink-0">
                               <p className="font-black text-primary leading-none uppercase italic text-lg">{new Date(item.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</p>
                               <p className="font-bold opacity-50 text-[10px] uppercase italic">{new Date(item.date).getFullYear()}</p>
                            </div>
                            <div className="flex-1 space-y-4">
                               <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                     <Stethoscope size={16} className="text-accent" />
                                     <h4 className="text-2xl font-black uppercase italic leading-none">{item.doctor_diagnosis || item.disease_name}</h4>
                                  </div>
                                  <p className="font-mono text-xs uppercase font-black opacity-50 bg-accent/5 px-2 py-0.5 inline-block border border-accent/20">
                                     {item.type === 'consultation' ? 'CLINICAL_EXAMINATION' : 'AI_PREDICTION_ONLY'}
                                  </p>
                               </div>
                               
                               {item.prescription && (
                                  <div className="bg-foreground text-background p-4 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(170,59,255,0.3)]">
                                     <p className="font-mono text-[10px] font-black italic uppercase text-primary mb-1 tracking-widest leading-none">Prescription_Details_</p>
                                     <p className="font-mono text-sm font-black italic leading-tight text-neutral-300">{item.prescription}</p>
                                  </div>
                               )}
                               
                               {item.patient_notes && (
                                  <p className="font-mono text-xs italic opacity-80 border-l-2 border-accent pl-4">
                                     "{item.patient_notes}"
                                  </p>
                               )}
                            </div>
                         </div>
                       ))
                     ) : (
                       <div className="text-center p-10 bg-accent/5 brutal-card border-dashed">
                          <p className="font-mono font-black text-xl uppercase opacity-20 italic">NO_CLINICAL_HISTORY_DETECTED</p>
                       </div>
                     )}
                  </div>
               )}

               <div className="pt-6 border-t-2 border-foreground/10 flex justify-end">
                  <button onClick={() => setSelectedPatient(null)} className="brutal-btn px-10 py-3 uppercase">CLOSE_REGISTRY</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default DoctorPatients;
