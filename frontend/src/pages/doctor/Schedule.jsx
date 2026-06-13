import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Info,
  ArrowRight
} from 'lucide-react';

const DoctorSchedule = () => {
  const { user } = useAuth();
  console.log('DoctorSchedule component - user:', user); // Debug log
  
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const DAYS = [
    { id: 0, name: 'MONDAY' },
    { id: 1, name: 'TUESDAY' },
    { id: 2, name: 'WEDNESDAY' },
    { id: 3, name: 'THURSDAY' },
    { id: 4, name: 'FRIDAY' },
    { id: 5, name: 'SATURDAY' },
    { id: 6, name: 'SUNDAY' },
  ];

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      console.log('Fetching doctor schedule...'); // Debug log
      const response = await api.get('/api/doctor/schedule');
      console.log('Schedule response:', response.data); // Debug log
      setAvailability(response.data.slots || []);
    } catch (err) {
      console.error("Fetch schedule error:", err);
      // Set empty array on error to prevent blank screen
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  };

  const addSlot = () => {
    setAvailability([...availability, { 
      day_of_week: 0, 
      start_time: '09:00', 
      end_time: '17:00',
      slot_duration_minutes: 30,
      is_active: true
    }]);
  };

  const removeSlot = (index) => {
    const newAvail = [...availability];
    newAvail.splice(index, 1);
    setAvailability(newAvail);
  };

  const updateSlot = (index, field, value) => {
    const newAvail = [...availability];
    newAvail[index][field] = field === 'day_of_week' ? parseInt(value) : value;
    setAvailability(newAvail);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      console.log('Saving schedule:', { slots: availability }); // Debug log
      await api.put('/api/doctor/schedule', { slots: availability });
      setMessage({ type: 'success', text: 'SCHEDULE_SYNCHRONIZED_SUCCESSFULLY' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (err) {
      console.error("Save schedule error:", err); // Debug log
      setMessage({ type: 'error', text: 'FAILED_TO_UPDATE_AVAILABILITY_SYSTEM' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse font-mono font-bold text-2xl uppercase">RETRIEVING_PRACTICE_SCHEDULE...</div>;

  if (!user) {
    return (
      <div className="brutal-card bg-destructive/10 border-2 border-destructive p-10 text-center">
        <h3 className="text-2xl font-mono font-bold text-destructive uppercase mb-4">NOT_AUTHENTICATED</h3>
        <p className="font-mono mb-4">Please log in to access this page.</p>
        <Link to="/login" className="brutal-btn">GO_TO_LOGIN</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="space-y-4 border-b-2 border-foreground pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <h1 className="text-5xl font-black italic uppercase tracking-tighter">Availability_Mgr</h1>
           <p className="font-mono text-muted-foreground font-bold uppercase tracking-wider text-sm flex items-center gap-2">
              <Clock size={16} /> Define your weekly clinical window
           </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="brutal-btn px-10 py-3 text-lg flex items-center gap-3 uppercase"
        >
           {saving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Deploy_Schedule</>}
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

      <div className="space-y-8">
         <div className="brutal-card bg-card p-10 space-y-10">
            <div className="flex items-center justify-between border-b-2 border-foreground pb-4">
               <h3 className="text-3xl font-black italic uppercase italic">WEEKLY_SLOTS_</h3>
               <button onClick={addSlot} className="font-mono font-black text-sm uppercase bg-accent border-2 border-foreground px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-2">
                  <Plus size={18} /> ADD_WINDOW
               </button>
            </div>

            <div className="space-y-4">
               {availability.length > 0 ? (
                  availability.map((slot, index) => (
                    <div key={index} className="flex flex-col md:flex-row items-center gap-4 p-4 border-2 border-foreground bg-accent/5 group transition-all hover:bg-accent/10">
                       <div className="w-full md:w-1/3 space-y-1">
                          <label className="font-mono font-black text-[10px] uppercase opacity-50">DAY_OF_WEEK_</label>
                          <select 
                            className="w-full border-2 border-foreground p-3 font-mono font-bold appearance-none bg-white focus:bg-accent/5 outline-none text-sm"
                            value={slot.day_of_week}
                            onChange={(e) => updateSlot(index, 'day_of_week', e.target.value)}
                          >
                             {DAYS.map(day => <option key={day.id} value={day.id}>{day.name}</option>)}
                          </select>
                       </div>
                       
                       <div className="w-full md:w-1/4 space-y-1">
                          <label className="font-mono font-black text-[10px] uppercase opacity-50">START_TIME_</label>
                          <input 
                             type="time" 
                             className="w-full border-2 border-foreground p-3 font-mono font-bold bg-white focus:bg-accent/5 outline-none text-sm"
                             value={slot.start_time}
                             onChange={(e) => updateSlot(index, 'start_time', e.target.value)}
                          />
                       </div>

                       <div className="w-full md:w-1/4 space-y-1">
                          <label className="font-mono font-black text-[10px] uppercase opacity-50">END_TIME_</label>
                          <input 
                             type="time" 
                             className="w-full border-2 border-foreground p-3 font-mono font-bold bg-white focus:bg-accent/5 outline-none text-sm"
                             value={slot.end_time}
                             onChange={(e) => updateSlot(index, 'end_time', e.target.value)}
                          />
                       </div>

                       <div className="flex md:self-end md:pb-2">
                          <button 
                            onClick={() => removeSlot(index)}
                            className="p-3 border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-x-[-1px] translate-y-[-1px] active:translate-x-0 active:translate-y-0"
                          >
                             <Trash2 size={20} />
                          </button>
                       </div>
                    </div>
                  ))
               ) : (
                  <div className="text-center p-16 brutal-card dashed-border border-2 border-foreground/20 bg-accent/5">
                     <p className="font-mono font-black text-xl uppercase opacity-20 italic">NO_AVAILABILITY_DEFINED_FOR_PRACTICE</p>
                  </div>
               )}
            </div>

            <div className="border-t-2 border-foreground pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-accent border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center font-black">!</div>
                  <p className="font-mono text-xs font-bold leading-tight uppercase opacity-70">
                     Changes to availability will only affect new appointment requests. Existing confirmed visits will remain on schedule.
                  </p>
               </div>
               <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="brutal-btn px-10 py-3 uppercase flex items-center gap-2 whitespace-nowrap"
               >
                  {saving ? <Loader2 className="animate-spin" /> : 'SAVE_WINDOW_CONFIG'}
               </button>
            </div>
         </div>

         <div className="brutal-card border-none bg-foreground text-background p-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-24 h-24 bg-primary flex-shrink-0 flex items-center justify-center border-2 border-background shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
               <Info size={40} className="text-secondary" />
            </div>
            <div className="space-y-2">
               <h4 className="font-mono font-black text-primary uppercase text-sm tracking-widest leading-none underline decoration-2 underline-offset-4">Scheduling_Heuristic_Engine</h4>
               <p className="font-mono text-xl font-bold italic leading-tight text-neutral-300">
                  Ensure at least 30-minute intervals between start and end times to allow for thorough physical examination and medical record documentation.
               </p>
               <Link to="/doctor/appointments" className="inline-flex items-center gap-1 font-mono text-[10px] font-black uppercase text-primary-foreground/50 hover:text-primary transition-colors pt-2">
                  View_Current_Bookings <ArrowRight size={10} />
               </Link>
            </div>
         </div>
      </div>
    </div>
  );
};

export default DoctorSchedule;
