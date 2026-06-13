import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { 
  PlusCircle, 
  Search, 
  Calendar, 
  History, 
  TrendingUp, 
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

const PatientDashboard = () => {
  const [stats, setStats] = useState({
    totalPredictions: 0,
    upcomingAppointments: 0,
    recentPredictions: [],
    nextAppointment: null
  });
  const [loading, setLoading] = useState(true);

  // Function to check if appointment is in the future
  const isAppointmentUpcoming = (appointment) => {
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const now = new Date();
    return appointmentDateTime > now;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [predsRes, apptsRes] = await Promise.all([
          api.get('/api/predictions'),
          api.get('/api/appointments/patient?status=confirmed')
        ]);

        console.log('Dashboard data:', { preds: predsRes.data, appts: apptsRes.data }); // Debug log

        // Filter appointments to only show upcoming ones
        const allAppointments = apptsRes.data.appointments || apptsRes.data || [];
        const upcomingAppointments = allAppointments.filter(isAppointmentUpcoming);
        const nextAppointment = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;

        setStats({
          totalPredictions: predsRes.data.length || 0,
          upcomingAppointments: upcomingAppointments.length,
          recentPredictions: predsRes.data.slice(0, 3),
          nextAppointment: nextAppointment
        });
      } catch (err) {
        console.error("Dashboard fetch error", err);
        // Set default values on error
        setStats({
          totalPredictions: 0,
          upcomingAppointments: 0,
          recentPredictions: [],
          nextAppointment: null
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="animate-pulse font-mono font-bold">LOADING_DASHBOARD...</div>;
  }

  return (
    <div className="space-y-10">
      {/* Welcome & Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 brutal-card bg-primary p-8 flex flex-col justify-between min-h-[200px]">
          <h1 className="text-4xl font-black italic text-primary leading-none uppercase">
            WELCOME_BACK_ <br /> READY_FOR_ANALYSIS?
          </h1>
          <div className="flex gap-4 mt-6">
             <Link to="/patient/upload" className="bg-background text-foreground border-2 border-foreground px-6 py-2 font-mono font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all">
                NEW_UPLOAD
             </Link>
             <Link to="/patient/doctors" className="bg-accent text-foreground border-2 border-foreground px-6 py-2 font-mono font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all">
                FIND_DOCTORS
             </Link>
          </div>
        </div>
        
        <div className="brutal-card bg-card p-8 flex flex-col justify-center items-center text-center space-y-2">
           <span className="text-6xl font-black italic text-primary leading-none">{stats.totalPredictions}</span>
           <p className="font-mono font-bold uppercase tracking-widest text-sm">TOTAL_PREDICTIONS</p>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
         {/* Recent Predictions */}
         <section className="space-y-6">
            <div className="flex items-center justify-between border-b-2 border-foreground pb-2">
               <h3 className="text-3xl font-black italic uppercase">RECENT_HISTORY</h3>
               <Link to="/patient/history" className="text-primary font-mono font-black text-sm uppercase flex items-center gap-1 hover:underline">
                  VIEW_ALL <ArrowRight size={16} />
               </Link>
            </div>
            
            <div className="space-y-4">
               {stats.recentPredictions.length > 0 ? (
                 stats.recentPredictions.map((pred) => (
                   <div key={pred.id} className="brutal-card bg-card p-4 flex items-center gap-4">
                      <div className="w-16 h-16 border-2 border-foreground flex-shrink-0 overflow-hidden">
                         <img src={`http://localhost:8000/uploads/${pred.image_url.split('/').pop()}`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                         <h4 className="font-black uppercase italic leading-tight">{pred.disease_name}</h4>
                         <p className="font-mono text-xs opacity-50 uppercase">{new Date(pred.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className={`px-2 py-1 font-mono font-black text-xs border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                        pred.severity === 'High' ? 'bg-destructive text-destructive-foreground' : 
                        pred.severity === 'Medium' ? 'bg-yellow-400' : 'bg-green-400'
                      }`}>
                         {pred.confidence_score}%
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="brutal-card p-10 text-center font-mono opacity-50 uppercase font-black italic bg-accent/5 dashed-border">
                    NO_HISTORY_FOUND
                 </div>
               )}
            </div>
         </section>

         {/* Upcoming Appointments */}
         <section className="space-y-6">
            <div className="flex items-center justify-between border-b-2 border-foreground pb-2">
               <h3 className="text-3xl font-black italic uppercase">NEXT_VISIT</h3>
               <Link to="/patient/appointments" className="text-primary font-mono font-black text-sm uppercase flex items-center gap-1 hover:underline">
                  SCHEDULE <ArrowRight size={16} />
               </Link>
            </div>

            {stats.nextAppointment ? (
               <div className="brutal-card bg-accent p-8 space-y-6">
                  <div className="flex items-start justify-between">
                     <div className="space-y-4">
                        <div className="space-y-1">
                           <p className="font-mono text-xs uppercase font-black opacity-60">DOCTOR_</p>
                           <h4 className="text-4xl font-black uppercase italic leading-none">{stats.nextAppointment.doctor_name}</h4>
                           <p className="font-mono font-bold uppercase tracking-tight">{stats.nextAppointment.doctor_specialization}</p>
                        </div>
                        <div className="flex gap-6 pt-4">
                           <div>
                              <p className="font-mono text-[10px] uppercase font-black opacity-60">DATE_</p>
                              <p className="font-mono font-black text-lg">{stats.nextAppointment.appointment_date}</p>
                           </div>
                           <div>
                              <p className="font-mono text-[10px] uppercase font-black opacity-60">TIME_</p>
                              <p className="font-mono font-black text-lg">{stats.nextAppointment.appointment_time}</p>
                           </div>
                        </div>
                     </div>
                     <div className="w-16 h-16 bg-background border-2 border-foreground flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <Calendar size={32} />
                     </div>
                  </div>
                  <Link to={`/patient/appointments`} className="block w-full text-center font-mono font-black bg-foreground text-background py-3 hover:bg-neutral-800 transition-colors">
                     MANAGE_APPOINTMENT
                  </Link>
               </div>
            ) : (
               <div className="brutal-card p-12 text-center space-y-6 bg-accent/10 border-dashed border-2 border-foreground/30">
                  <AlertCircle size={48} className="mx-auto opacity-20" />
                  <p className="font-mono font-black text-lg uppercase opacity-40 italic">NO_UPCOMING_APPOINTMENTS</p>
                  <Link to="/patient/doctors" className="brutal-btn inline-block uppercase text-sm">Book Consultation</Link>
               </div>
            )}
         </section>
      </div>

      {/* Health Tip */}
      <section className="brutal-card border-none bg-foreground text-background p-8 flex items-center gap-8">
         <div className="w-20 h-20 bg-primary flex-shrink-0 flex items-center justify-center border-2 border-background shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
            <TrendingUp size={40} className="text-secondary" />
         </div>
         <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase font-black text-primary">HEALTH_TIP_OFF_THE_DAY</span>
            <p className="font-mono text-xl font-bold italic leading-tight">Apply broad-spectrum SPF 50+ every morning, even on cloudy days, to prevent UV-induced actinic keratosis.</p>
         </div>
      </section>
    </div>
  );
};

export default PatientDashboard;
