import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  Activity, 
  AlertCircle,
  TrendingUp,
  Stethoscope
} from 'lucide-react';

const DoctorDashboard = () => {
  const [stats, setStats] = useState({
    todayCount: 0,
    pendingCount: 0,
    totalPatients: 0,
    todaySchedule: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/api/doctor/dashboard-stats');
        setStats(response.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <div className="animate-pulse font-mono font-bold text-2xl uppercase">RETRIEVING_PRACTICE_DATA...</div>;

  return (
    <div className="space-y-12 pb-20">
      {/* Welcome & Stats */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2 brutal-card bg-primary p-10 flex flex-col justify-between min-h-[250px] relative overflow-hidden">
           <div className="space-y-4">
              <h1 className="text-5xl font-black italic text-foreground leading-none tracking-tighter">
                CLINIC_ <br /> DASHBOARD_
              </h1>
              <p className="font-mono font-bold text-accent uppercase tracking-widest text-sm underline decoration-2 decoration-accent">Practice_Management_System_v2</p>
           </div>
           <div className="flex gap-4 mt-8 relative z-10">
              <Link to="/doctor/appointments" className="bg-background text-foreground border-2 border-foreground px-8 py-3 font-mono font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all uppercase">
                 MANAGE_VISITS
              </Link>
              <Link to="/doctor/schedule" className="bg-accent text-foreground border-2 border-foreground px-8 py-3 font-mono font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all uppercase text-sm flex items-center gap-2">
                 UPDATE_AVAILABILITY
              </Link>
           </div>
           <div className="absolute -bottom-10 -right-10 opacity-20 rotate-12 pointer-events-none scale-150">
              <Stethoscope size={200} className="text-primary-foreground" />
           </div>
        </div>

        <div className="brutal-card bg-card p-10 flex flex-col justify-center items-center text-center space-y-2 group hover:bg-accent/5 transition-all">
           <span className="text-7xl font-black italic text-foreground leading-none">{stats.todayCount}</span>
           <p className="font-mono font-black uppercase tracking-tighter text-sm">UPCOMING_TODAY</p>
        </div>

        <div className="brutal-card bg-card p-10 flex flex-col justify-center items-center text-center space-y-2 group hover:bg-destructive/5 transition-all">
           <span className="text-7xl font-black italic text-foreground leading-none">{stats.pendingCount}</span>
           <p className="font-mono font-black uppercase tracking-tighter text-sm">PENDING_REQUESTS</p>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
         {/* Today's Schedule */}
         <div className="md:col-span-2 space-y-8">
            <div className="flex items-center justify-between border-b-2 border-foreground pb-4">
               <h3 className="text-4xl font-black italic uppercase italic text-foreground">TODAY'S_SCHEDULE</h3>
               <Link to="/doctor/appointments" className="text-primary font-mono font-black text-sm uppercase flex items-center gap-2 hover:underline decoration-4">
                  VIEW_FULL_QUEUE <ArrowRight size={18} />
               </Link>
            </div>

            <div className="space-y-6">
               {stats.todaySchedule && stats.todaySchedule.length > 0 ? (
                 stats.todaySchedule.map((appt) => (
                   <div key={appt.id} className="brutal-card bg-card p-6 flex items-center gap-8 group hover:bg-accent/5 transition-all">
                      <div className="w-16 h-16 border-2 border-foreground bg-accent text-foreground flex items-center justify-center font-mono font-black text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                         {appt.appointment_time.split(':')[0]}<span className="text-xs">H</span>
                      </div>
                      <div className="flex-1 space-y-1">
                         <div className="flex items-center gap-2">
                           <h4 className="text-2xl font-black uppercase italic leading-none">{appt.patient_name}</h4>
                           <span className="bg-foreground text-background font-mono text-[9px] px-2 py-0.5 font-bold uppercase italic">{appt.patient_gender || 'PATIENT'}</span>
                         </div>
                         <p className="font-mono text-xs uppercase opacity-60 font-medium">{appt.appointment_time} // ID: {appt.id.slice(-6)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <Link to="/doctor/appointments" className="p-3 border-2 border-foreground bg-background hover:bg-accent shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                            <ArrowRight size={20} />
                         </Link>
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="brutal-card p-16 text-center space-y-6 bg-accent/5 border-dashed border-2">
                    <Calendar size={48} className="mx-auto opacity-20" />
                    <p className="font-mono font-black text-2xl uppercase opacity-30 italic">0_BOOKINGS_CONFIRMED_FOR_TODAY</p>
                 </div>
               )}
            </div>
         </div>

         {/* Insights & Quick Access */}
         <div className="space-y-8">
            <section className="brutal-card bg-accent p-8 space-y-6">
               <h3 className="text-2xl font-black italic uppercase leading-none border-b-2 border-foreground pb-2 text-foreground">PRACTICE_INSIGHTS</h3>
               <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
                     <span className="font-mono font-bold text-xs uppercase text-foreground/60 tracking-widest leading-none">Total Patients</span>
                     <span className="font-mono font-black text-2xl italic leading-none text-foreground">{stats.totalPatients}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
                     <span className="font-mono font-bold text-xs uppercase text-foreground/60 tracking-widest leading-none">New This Week</span>
                     <span className="font-mono font-black text-2xl italic leading-none text-foreground">+12</span>
                  </div>
               </div>
               <div className="bg-foreground text-background p-4 flex items-center gap-4">
                  <TrendingUp className="text-primary" size={24} />
                  <p className="font-mono text-[10px] font-black uppercase leading-tight">Patient intake has increased by 15.4% since last maintenance window.</p>
               </div>
            </section>

            <section className="brutal-card bg-card p-8 space-y-6">
               <div className="flex items-center gap-3">
                  <AlertCircle className="text-destructive" size={28} />
                  <h3 className="text-2xl font-black italic uppercase leading-none text-foreground">SYSTEM_ALERTS</h3>
               </div>
               <div className="space-y-3">
                  <p className="font-mono text-xs font-bold leading-none bg-destructive/10 p-3 border border-destructive italic text-foreground">
                     2_CONSULTATIONS_PENDING_DIAGNOSES_REPORTING
                  </p>
                  <p className="font-mono text-xs font-bold leading-none bg-accent/10 p-3 border border-accent italic text-foreground">
                     CLINIC_AVAILABILITY_EXPIRES_IN_48H
                  </p>
               </div>
               <Link to="/doctor/appointments" className="block text-center font-mono font-black text-xs uppercase underline decoration-2 underline-offset-4 hover:text-primary transition-colors text-foreground">
                  Resolve_System_Warnings_
               </Link>
            </section>
         </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
