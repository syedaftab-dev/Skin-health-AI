import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import { 
  Stethoscope, 
  MapPin, 
  Star, 
  Calendar, 
  Clock, 
  Info, 
  ArrowRight,
  ShieldCheck,
  Award,
  ChevronRight
} from 'lucide-react';

const DoctorProfile = () => {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const response = await api.get(`/api/doctors/${id}`);
        setDoctor(response.data);
      } catch (err) {
        console.error("Fetch doctor error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [id]);

  if (loading) {
    return <div className="animate-pulse font-mono font-bold">LOADING_PROFESSIONAL_DATA...</div>;
  }

  if (!doctor) {
    return <div className="brutal-card p-10 text-center font-mono font-bold">DOCTOR_NOT_FOUND</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Profile Header Card */}
      <section className="brutal-card bg-primary p-12 flex flex-col md:flex-row items-center gap-12 text-primary-foreground relative overflow-hidden">
        <div className="w-64 h-64 border-4 border-foreground shadow-[12px_12px_0px_0px_rgba(0,0,0,0.5)] overflow-hidden flex-shrink-0 bg-white group hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all">
          {doctor.profile_photo_url ? (
            <img src={doctor.profile_photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-accent/20">
               <Stethoscope size={100} className="text-foreground/10" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-6 text-center md:text-left relative z-10">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
             <h1 className="text-6xl font-black italic uppercase leading-none tracking-tighter">{doctor.name}</h1>
             {doctor.is_approved && (
               <div className="inline-flex items-center gap-2 bg-green-400 text-foreground px-4 py-1 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] font-mono font-bold text-xs uppercase italic">
                  <ShieldCheck size={16} /> VERIFIED_PROFILE
               </div>
             )}
          </div>
          
          <div className="space-y-2">
             <p className="text-3xl font-mono font-black uppercase text-accent">{doctor.specialization}</p>
             <div className="flex flex-wrap justify-center md:justify-start gap-6 font-mono font-bold uppercase text-sm">
                <span className="flex items-center gap-1 font-black underline decoration-2 decoration-foreground">LICENSE: {doctor.license_number}</span>
                <span className="flex items-center gap-1 underline decoration-2 decoration-foreground">{doctor.experience_years} YEARS EXP</span>
             </div>
          </div>

          <p className="text-xl font-mono opacity-90 max-w-2xl leading-tight font-medium italic">
             "{doctor.bio || 'Dermatologist dedicated to precision diagnosis and professional skin care management.'}"
          </p>
        </div>
        
        {/* Background Decorative Element */}
        <div className="absolute -top-10 -right-10 opacity-5 rotate-12 scale-150 pointer-events-none">
           <Stethoscope size={300} />
        </div>
      </section>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
         {/* Clinic Info */}
         <div className="lg:col-span-2 space-y-12">
            <section className="brutal-card bg-card p-10 space-y-8">
               <h3 className="text-4xl font-black italic uppercase border-b-2 border-foreground pb-2 flex items-center gap-4">
                  <MapPin className="text-primary" size={32} /> CLINIC_DETAILS
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                     <h4 className="font-mono font-black uppercase underline decoration-accent decoration-4">Facility_Name</h4>
                     <p className="text-3xl font-black italic uppercase leading-none text-foreground/80">{doctor.clinic_name}</p>
                  </div>
                  <div className="space-y-4">
                     <h4 className="font-mono font-black uppercase underline decoration-accent decoration-4">Street_Address</h4>
                     <p className="text-xl font-mono font-bold italic leading-tight">{doctor.clinic_address}</p>
                  </div>
                  <div className="space-y-4">
                     <h4 className="font-mono font-black uppercase underline decoration-accent decoration-4">Pincode_Region</h4>
                     <p className="text-xl font-mono font-bold">{doctor.clinic_pincode}</p>
                  </div>
                  <div className="space-y-4">
                     <h4 className="font-mono font-black uppercase underline decoration-accent decoration-4">Fees_Per_Visit</h4>
                     <p className="text-3xl font-black italic text-primary">₹{doctor.consultation_fee}</p>
                  </div>
               </div>
            </section>

            <section className="brutal-card bg-card p-10 space-y-8">
               <h3 className="text-4xl font-black italic uppercase border-b-2 border-foreground pb-2 flex items-center gap-4">
                  <Award size={32} className="text-primary" /> EXPERTISE_SYSTEM
               </h3>
               <div className="space-y-6">
                  <p className="font-mono text-lg italic leading-relaxed font-medium">
                     Specialized in advanced diagnostic techniques for all major skin conditions. Utilizing modern EfficientNet architecture to validate complex cases and ensure patient safety.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {['MELANOMA', 'ACNE', 'ECZEMA', 'PIGMENTATION', 'VASCULAR', 'LESIONS'].map((tag, i) => (
                        <div key={i} className="border-2 border-foreground px-4 py-2 font-mono font-black text-center text-sm uppercase hover:bg-accent hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all cursor-default">
                           {tag}
                        </div>
                     ))}
                  </div>
               </div>
            </section>
         </div>

         {/* Sidebar: Availability Summary & Booking */}
         <div className="space-y-8 flex flex-col h-full">
            <section className="brutal-card bg-accent p-8 space-y-8 sticky top-24">
               <div className="space-y-2">
                  <h3 className="text-3xl font-black italic uppercase leading-none">TIME_SLOTS</h3>
                  <p className="font-mono font-bold uppercase tracking-tight text-xs opacity-60">REGULAR_WORKING_HOURS</p>
               </div>

               <div className="space-y-4">
                  {doctor.availability && doctor.availability.length > 0 ? (
                    doctor.availability.map((slot, i) => (
                       <div key={i} className="flex items-center justify-between border-b border-foreground/20 pb-3 last:border-b-0">
                          <span className="font-mono font-black uppercase text-sm">
                             {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][slot.day_of_week]}
                          </span>
                          <span className="font-mono font-bold text-sm bg-background border-2 border-foreground px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                             {slot.start_time} - {slot.end_time}
                          </span>
                       </div>
                    ))
                  ) : (
                    <p className="font-mono text-sm opacity-50 uppercase font-bold italic border-2 border-dashed border-foreground/30 p-4 text-center">NO_SCHEDULE_DEFINED</p>
                  )}
               </div>

               <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3 bg-white p-4 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                     <Clock className="text-primary" />
                     <p className="font-mono text-xs font-black uppercase leading-tight">NEXT_AVAILABLE: <span className="text-primary italic">TODAY</span></p>
                  </div>
                  <Link to={`/patient/book/${doctor.id}`} className="brutal-btn w-full text-center py-5 text-2xl flex items-center justify-center gap-3">
                     BOOK_APPOINTMENT <ArrowRight size={24} />
                  </Link>
               </div>
            </section>

            <section className="brutal-card border-none bg-foreground text-background p-8 flex items-center gap-6 mt-auto">
               <Info className="text-primary flex-shrink-0" size={32} />
               <p className="font-mono text-sm font-black italic uppercase leading-tight">
                  Consultation fee is payable directly to the clinic at the time of appointment.
               </p>
            </section>
         </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
