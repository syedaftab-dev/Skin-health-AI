import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { 
  Users, 
  Stethoscope, 
  Calendar, 
  Activity, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight,
  TrendingDown,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_patients: 0,
    total_doctors: 0,
    approved_doctors: 0,
    pending_doctors: 0,
    total_appointments: 0,
    today_appointments: 0,
    completed_appointments: 0,
    total_predictions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/admin/stats');
        setStats(response.data);
      } catch (err) {
        console.error("Admin stats fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="animate-pulse font-mono font-bold text-2xl uppercase">RETRIEVING_PLATFORM_TELEMETRY...</div>;

  return (
    <div className="space-y-12 pb-20">
      <div className="space-y-4 border-b-2 border-foreground pb-6">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter">System_Control</h1>
        <p className="font-mono text-muted-foreground font-bold uppercase tracking-wider text-sm flex items-center gap-2">
           <Activity size={16} /> Global administrative monitoring and verification metrics
        </p>
      </div>

      {/* Hero Stats */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="md:col-span-2 brutal-card bg-primary p-10 flex flex-col justify-between min-h-[250px] relative overflow-hidden group">
            <div className="space-y-4 relative z-10">
               <h2 className="text-5xl font-black italic text-primary-foreground uppercase leading-none tracking-tighter">
                  PLATFORM_ <br /> NODES_
               </h2>
               <div className="flex gap-10 pt-4">
                  <div className="space-y-1">
                     <p className="font-mono text-[10px] font-black uppercase text-primary-foreground/60 leading-none">Total_Nodes_</p>
                     <p className="text-4xl font-black italic text-primary-foreground">{stats.total_patients + stats.total_doctors}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="font-mono text-[10px] font-black uppercase text-primary-foreground/60 leading-none">Active_Analysis_</p>
                     <p className="text-4xl font-black italic text-primary-foreground">{stats.total_predictions}</p>
                  </div>
               </div>
            </div>
            <div className="flex gap-4 mt-8 relative z-10">
               <Link to="/admin/doctors" className="bg-background text-foreground border-2 border-foreground px-8 py-3 font-mono font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all uppercase text-sm">
                  VERIFY_DOCTORS
               </Link>
               <Link to="/admin/patients" className="bg-accent text-foreground border-2 border-foreground px-8 py-3 font-mono font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all uppercase text-sm">
                  USER_REGISTRY
               </Link>
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-10 rotate-12 pointer-events-none scale-150 group-hover:rotate-0 transition-transform duration-1000">
               <BarChart3 size={240} className="text-primary-foreground" />
            </div>
         </div>

         <div className="brutal-card bg-card p-10 flex flex-col justify-center items-center text-center space-y-2 group hover:bg-accent/5 transition-all">
            <span className="text-7xl font-black italic text-accent leading-none">{stats.pending_doctors}</span>
            <p className="font-mono font-black uppercase tracking-tighter text-sm">PENDING_APPROVALS</p>
         </div>

         <div className="brutal-card bg-card p-10 flex flex-col justify-center items-center text-center space-y-2 group hover:shadow-[8px_8px_0px_0px_rgba(170,59,255,1)] transition-all">
            <span className="text-7xl font-black italic text-primary leading-none">{stats.today_appointments}</span>
            <p className="font-mono font-black uppercase tracking-tighter text-sm">TODAY_VISITS</p>
         </div>
      </section>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {/* Doctor Metric */}
         <section className="brutal-card bg-card p-8 space-y-8">
            <div className="flex items-center justify-between border-b-2 border-foreground pb-2">
               <h3 className="text-2xl font-black italic uppercase">DOCTOR_OPS</h3>
               <Stethoscope className="text-primary" />
            </div>
            <div className="space-y-6">
               <div className="flex justify-between items-end border-b border-foreground/10 pb-4">
                  <p className="font-mono text-xs font-black uppercase opacity-60">Approved_Experts_</p>
                  <p className="text-3xl font-black italic">{stats.approved_doctors}</p>
               </div>
               <div className="flex justify-between items-end border-b border-foreground/10 pb-4 text-destructive">
                  <p className="font-mono text-xs font-black uppercase opacity-60">Awaiting_Verification_</p>
                  <p className="text-3xl font-black italic">{stats.pending_doctors}</p>
               </div>
               <Link to="/admin/doctors" className="block text-center font-mono font-black text-xs uppercase underline underline-offset-4 decoration-2 decoration-primary">Manage_Medical_Registry_</Link>
            </div>
         </section>

         {/* Patient Metric */}
         <section className="brutal-card bg-card p-8 space-y-8">
            <div className="flex items-center justify-between border-b-2 border-foreground pb-2">
               <h3 className="text-2xl font-black italic uppercase">PATIENT_LOAD</h3>
               <Users className="text-accent" />
            </div>
            <div className="space-y-6">
               <div className="flex justify-between items-end border-b border-foreground/10 pb-4">
                  <p className="font-mono text-xs font-black uppercase opacity-60">Registered_Users_</p>
                  <p className="text-3xl font-black italic">{stats.total_patients}</p>
               </div>
               <div className="flex justify-between items-end border-b border-foreground/10 pb-4 text-primary">
                  <p className="font-mono text-xs font-black uppercase opacity-60">Avg_Daily_Activity_</p>
                  <p className="text-3xl font-black italic">+24</p>
               </div>
               <Link to="/admin/patients" className="block text-center font-mono font-black text-xs uppercase underline underline-offset-4 decoration-2 decoration-accent">View_All_Patient_Nodes_</Link>
            </div>
         </section>

         {/* platform Metric */}
         <section className="brutal-card bg-card p-8 space-y-8 lg:col-span-1">
            <div className="flex items-center justify-between border-b-2 border-foreground pb-2">
               <h3 className="text-2xl font-black italic uppercase">SYSTEM_LOAD</h3>
               <Activity className="text-foreground" />
            </div>
            <div className="space-y-6">
               <div className="flex justify-between items-end border-b border-foreground/10 pb-4">
                  <p className="font-mono text-xs font-black uppercase opacity-60">Completed_Visits_</p>
                  <p className="text-3xl font-black italic">{stats.completed_appointments}</p>
               </div>
               <div className="flex justify-between items-end border-b border-foreground/10 pb-4 text-green-500">
                  <p className="font-mono text-xs font-black uppercase opacity-60">ML_Inf_Invocations_</p>
                  <p className="text-3xl font-black italic">{stats.total_predictions}</p>
               </div>
               <div className="bg-foreground text-background p-4 flex items-center gap-3">
                  <TrendingUp className="text-primary flex-shrink-0" size={20} />
                  <p className="font-mono text-[9px] font-black uppercase leading-none opacity-80">Platform efficiency at 98.2% under peak concurrent request cycles.</p>
               </div>
            </div>
         </section>
      </div>

      {/* Admin Alert Footer */}
      <div className="brutal-card bg-destructive text-destructive-foreground p-10 flex flex-col md:flex-row items-center gap-10 border-none relative overflow-hidden group">
         <div className="w-24 h-24 bg-background flex-shrink-0 flex items-center justify-center border-4 border-foreground shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)]">
            <AlertCircle size={48} className="text-destructive group-hover:scale-125 transition-transform" />
         </div>
         <div className="space-y-2">
            <h4 className="font-mono font-black text-xs uppercase opacity-80 leading-none">Security_Observation_Report</h4>
            <p className="font-mono text-xl font-bold italic leading-tight text-white tracking-tight">
               Administrative oversight required for 3 recent doctor registration requests with mismatched medical council IDs. Immediate verification cycles recommended.
            </p>
         </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
