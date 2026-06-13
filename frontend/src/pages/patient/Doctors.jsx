import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { 
  Search, 
  MapPin, 
  Star, 
  Stethoscope, 
  ArrowRight, 
  Filter,
  CheckCircle,
  Clock
} from 'lucide-react';

const PatientDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    specialization: '',
    pincode: ''
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Only add non-empty parameters
      if (filters.search && filters.search.trim()) {
        params.append('search', filters.search.trim());
      }
      if (filters.specialization && filters.specialization.trim()) {
        params.append('specialization', filters.specialization.trim());
      }
      if (filters.pincode && filters.pincode.trim()) {
        params.append('pincode', filters.pincode.trim());
      }
      
      console.log('Fetching doctors with params:', params.toString()); // Debug log
      const queryString = params.toString();
      const response = await api.get(`/api/doctors${queryString ? '?' + queryString : ''}`);
      console.log('Doctors response:', response.data); // Debug log
      setDoctors(response.data.doctors || []);
    } catch (err) {
      console.error("Fetch doctors error:", err);
      setDoctors([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  const resetFilters = () => {
    setFilters({ search: '', specialization: '', pincode: '' });
    // Fetch all doctors after reset
    setTimeout(() => fetchDoctors(), 0);
  };

  return (
    <div className="space-y-10">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-2 border-foreground pb-6">
        <div className="space-y-4">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter">Find_Experts</h1>
          <p className="font-mono text-muted-foreground font-bold uppercase tracking-wider text-sm flex items-center gap-2">
             <Stethoscope size={16} /> Professional dermatologists for follow-up care
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearch} className="brutal-card bg-card p-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
           <input 
             type="text" 
             name="search"
             placeholder="SEARCH BY NAME OR CLINIC"
             className="w-full border-2 border-foreground p-3 pl-10 font-mono focus:bg-accent/5 outline-none"
             value={filters.search}
             onChange={handleFilterChange}
           />
           <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
        <div className="w-full md:w-48 relative">
           <input 
             type="text" 
             name="specialization"
             placeholder="SPECIALTY"
             className="w-full border-2 border-foreground p-3 pl-10 font-mono focus:bg-accent/5 outline-none"
             value={filters.specialization}
             onChange={handleFilterChange}
           />
           <Filter size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
        <div className="w-full md:w-32 relative">
           <input 
             type="text" 
             name="pincode"
             placeholder="PINCODE"
             className="w-full border-2 border-foreground p-3 pl-10 font-mono focus:bg-accent/5 outline-none"
             value={filters.pincode}
             onChange={handleFilterChange}
           />
           <MapPin size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
        <button type="submit" className="brutal-btn px-8 uppercase font-black tracking-widest text-sm">
           FILTER_SYS
        </button>
      </form>

      {/* Doctors List */}
      {loading ? (
        <div className="animate-pulse font-mono font-bold uppercase text-2xl">SCANNING_FOR_EXPERTS...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
          {doctors.length > 0 ? (
            doctors.map((doctor) => (
              <div key={doctor.id} className="brutal-card bg-card p-6 flex flex-col md:flex-row gap-8 hover:bg-accent/5 transition-all">
                <div className="w-full md:w-48 aspect-square border-2 border-foreground bg-accent/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {doctor.profile_photo_url ? (
                    <img src={doctor.profile_photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Stethoscope size={64} className="text-foreground/20" />
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between py-2">
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <div>
                            <h3 className="text-4xl font-black uppercase italic leading-none">{doctor.name}</h3>
                            <p className="font-mono text-primary font-black uppercase tracking-tight mt-1">{doctor.specialization}</p>
                         </div>
                         <div className="brutal-card bg-foreground text-background px-4 py-1 font-mono font-black text-sm">
                            ₹{doctor.consultation_fee} FEE
                         </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 font-mono text-sm uppercase font-black opacity-60">
                         <span className="flex items-center gap-1"><Briefcase size={14} /> {doctor.experience_years}+ YRS EXP</span>
                         <span className="flex items-center gap-1 text-primary"><MapPin size={14} /> {doctor.clinic_pincode}</span>
                         <span className="flex items-center gap-1 text-accent"><Star size={14} /> {doctor.rating || 'N/A'} RATING</span>
                      </div>

                      <p className="font-mono text-sm leading-tight line-clamp-2 italic">
                         {doctor.bio || "No biography available for this professional."}
                      </p>
                   </div>

                   <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-4 mt-6 border-t-2 border-foreground/5 pt-6">
                      <div className="flex items-center gap-2 font-mono text-xs uppercase font-black">
                         <div className="w-3 h-3 bg-green-500 border border-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"></div>
                         AVAILABLE_TODAY
                      </div>
                      <div className="flex gap-4">
                        <Link to={`/patient/doctor/${doctor.id}`} className="font-mono font-bold border-2 border-foreground px-6 py-2 hover:bg-accent/5 transition-all uppercase text-sm">
                           View_Profile
                        </Link>
                        <Link to={`/patient/book/${doctor.id}`} className="brutal-btn px-8 py-2 uppercase text-sm flex items-center gap-2">
                           Book_Now <ArrowRight size={16} />
                        </Link>
                      </div>
                   </div>
                </div>
              </div>
            ))
          ) : (
            <div className="brutal-card p-20 text-center space-y-4 bg-accent/5 border-dashed border-2">
               <p className="font-mono font-black text-3xl uppercase opacity-20 italic">0_EXPERTS_FOUND_IN_LOCALE</p>
               <button onClick={resetFilters} className="font-mono font-bold uppercase underline text-primary">Reset_Filters</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper for Lucide icon Briefcase (omitted in initial imports accidentally)
const Briefcase = ({size, className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>
);

export default PatientDoctors;
