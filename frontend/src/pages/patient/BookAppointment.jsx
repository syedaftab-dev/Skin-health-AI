import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ArrowLeft, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Info,
  Upload,
  Image,
  X
} from 'lucide-react';

const BookAppointment = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const predictionId = searchParams.get('predictionId');
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [notes, setNotes] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [aiPrediction, setAiPrediction] = useState(null);
  const [useAI, setUseAI] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      console.log('Booking appointment - fetching data for doctor ID:', id); // Debug log
      setLoading(true);
      setError('');
      
      try {
        const [docRes, availRes] = await Promise.all([
          api.get(`/api/doctors/${id}`),
          api.get(`/api/doctors/${id}/availability`)
        ]);
        console.log('Doctor response:', docRes.data); // Debug log
        console.log('Availability response:', availRes.data); // Debug log
        
        if (!docRes.data) {
          setError("Doctor not found");
          return;
        }
        
        setDoctor(docRes.data);
        setAvailability(availRes.data.available_slots || {});
        
        // Auto-select first available date if any
        const dates = Object.keys(availRes.data.available_slots || {});
        console.log('Available dates:', dates); // Debug log
        if (dates.length > 0) {
          setSelectedDate(dates[0]);
        } else {
          console.log('No available dates found'); // Debug log
          setError("This doctor has not set their availability schedule yet.");
        }
      } catch (err) {
        console.error('Fetch availability error:', err); // Debug log
        console.error('Error response:', err.response?.data); // Debug log
        if (err.response?.status === 404) {
          setError("Doctor not found or has not set up their availability schedule.");
        } else if (err.response?.status === 500) {
          setError("Server error. Please try again later.");
        } else {
          setError("Failed to load availability data. Please check if the doctor has set their schedule.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    } else {
      setError("Invalid doctor ID");
      setLoading(false);
    }
  }, [id]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setUseAI(true);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAiPrediction(null);
    setUseAI(false);
    if (document.getElementById('image-upload')) {
      document.getElementById('image-upload').value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return;

    setSubmitting(true);
    setError('');

    try {
      let response;
      
      if (useAI && selectedImage) {
        // Use the new endpoint with image upload and AI prediction
        const formData = new FormData();
        formData.append('doctor_id', id);
        formData.append('appointment_date', selectedDate);
        formData.append('appointment_time', selectedTime);
        formData.append('patient_notes', notes || '');
        formData.append('file', selectedImage);
        
        console.log('Submitting with image:', {
          doctor_id: id,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          patient_notes: notes || '',
          fileName: selectedImage.name,
          fileSize: selectedImage.size
        });
        
        response = await api.post('/api/appointments/with-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Use the regular endpoint
        response = await api.post('/api/appointments', {
          doctor_id: id,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          prediction_id: predictionId,
          patient_notes: notes || ''
        });
      }
      
      console.log('Booking response:', response.data);
      
      if (response.data.prediction) {
        setAiPrediction(response.data.prediction);
      }
      
      navigate('/patient/appointments?booked=success');
    } catch (err) {
      console.error('Booking error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.detail || "Booking failed. Please try a different slot.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="animate-pulse font-mono font-bold">CALCULATING_AVAILABILITY...</div>;

  const availableDates = Object.keys(availability);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="flex items-center gap-4 border-b-2 border-foreground pb-6">
        <Link to={`/patient/doctor/${id}`} className="brutal-btn p-2 shadow-none bg-accent">
           <ArrowLeft size={20} />
        </Link>
        <div className="space-y-1">
          <h1 className="text-4xl font-black italic uppercase leading-none">BOOK_APPOINTMENT</h1>
          <p className="font-mono text-sm uppercase opacity-60 font-black">CONSULTATION_WITH_{doctor?.name?.toUpperCase()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
         {/* Step 1: Select Date */}
         <div className="md:col-span-1 space-y-6">
            <h3 className="text-2xl font-black italic uppercase flex items-center gap-2">
               <span className="bg-primary text-primary-foreground w-8 h-8 flex items-center justify-center border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs">01</span>
               DATE_SELECT
            </h3>
            <div className="space-y-3">
               {availableDates.length > 0 ? (
                 availableDates.map(date => (
                   <button
                     key={date}
                     onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                     className={`w-full p-4 font-mono font-bold border-2 border-foreground transition-all flex justify-between items-center ${
                       selectedDate === date 
                        ? 'bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' 
                        : 'bg-card hover:bg-accent/5'
                     }`}
                   >
                     <span>{new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                     {selectedDate === date && <CheckCircle size={18} />}
                   </button>
                 ))
               ) : (
                 <div className="text-center p-8 space-y-4">
                   <p className="font-mono text-sm opacity-50 uppercase text-center p-4 border-2 border-dashed border-foreground/30">NO_DATES_AVAILABLE</p>
                   <p className="font-mono text-xs opacity-40 italic">
                     This doctor hasn't set their availability schedule yet, or all slots are booked.
                   </p>
                   <Link to="/patient/doctors" className="font-mono font-bold uppercase underline text-primary text-sm">
                     FIND_ANOTHER_DOCTOR
                   </Link>
                 </div>
               )}
            </div>
         </div>

         {/* Step 2: Select Time */}
         <div className="md:col-span-2 space-y-10">
            <div className="space-y-6">
               <h3 className="text-2xl font-black italic uppercase flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground w-8 h-8 flex items-center justify-center border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs">02</span>
                  TIME_SLOT
               </h3>
               
               {selectedDate ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                     {availability[selectedDate]?.map(time => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`p-3 font-mono font-black text-sm border-2 border-foreground transition-all ${
                            selectedTime === time
                              ? 'bg-accent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]'
                              : 'bg-card hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                          }`}
                        >
                           {time}
                        </button>
                     ))}
                  </div>
               ) : (
                  <p className="font-mono text-sm opacity-40 uppercase italic p-10 text-center brutal-card dashed-border border-none">SELECT_DATE_FIRST_</p>
               )}
            </div>

            {/* Step 3: Upload Image (Optional) */}
            <div className="space-y-6">
               <h3 className="text-2xl font-black italic uppercase flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground w-8 h-8 flex items-center justify-center border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs">03</span>
                  AI_ANALYSIS_
               </h3>
               
               <div className="brutal-card bg-card p-6 space-y-4">
                  <div className="flex items-center gap-3">
                     <Image size={20} />
                     <p className="font-mono font-bold text-sm">UPLOAD_SKIN_IMAGE_FOR_AI_ANALYSIS (Optional)</p>
                  </div>
                  
                  {!imagePreview ? (
                     <div className="border-2 border-dashed border-foreground/30 p-8 text-center">
                        <input
                          type="file"
                          id="image-upload"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer inline-flex items-center gap-2 font-mono font-bold text-sm uppercase hover:text-primary transition-colors"
                        >
                           <Upload size={20} />
                           CHOOSE_IMAGE
                        </label>
                        <p className="font-mono text-xs opacity-40 mt-2">JPG, PNG up to 5MB</p>
                     </div>
                  ) : (
                     <div className="space-y-4">
                        <div className="relative">
                           <img
                             src={imagePreview}
                             alt="Skin condition"
                             className="w-full h-48 object-cover border-2 border-foreground"
                           />
                           <button
                             type="button"
                             onClick={removeImage}
                             className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-2 border-2 border-foreground"
                           >
                              <X size={16} />
                           </button>
                        </div>
                        <div className="flex items-center gap-2">
                           <CheckCircle size={20} className="text-primary" />
                           <p className="font-mono font-bold text-sm">Image uploaded - AI analysis will be performed</p>
                        </div>
                     </div>
                  )}
               </div>
            </div>

            {/* Step 4: Confirmation & Notes */}
            {selectedTime && (
               <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
                  <h3 className="text-2xl font-black italic uppercase flex items-center gap-2">
                     <span className="bg-primary text-primary-foreground w-8 h-8 flex items-center justify-center border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs">04</span>
                     CONFIRMATION_
                  </h3>
                  
                  <form onSubmit={handleSubmit} className="brutal-card bg-card p-10 space-y-8">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-4">
                           <h4 className="font-mono font-black text-xs uppercase underline decoration-primary decoration-4">YOUR_SELECTION</h4>
                           <div className="space-y-1">
                              <p className="text-3xl font-black uppercase italic leading-none">{selectedDate}</p>
                              <p className="text-3xl font-black uppercase italic text-primary leading-none">{selectedTime}</p>
                           </div>
                        </div>
                        <div className="space-y-4">
                           <h4 className="font-mono font-black text-xs uppercase underline decoration-primary decoration-4">CLINIC_LOCATION</h4>
                           <p className="font-mono font-bold italic leading-tight text-sm opacity-70">
                              {doctor.clinic_name} <br />
                              {doctor.clinic_address}
                           </p>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="font-mono font-black uppercase text-xs">Reason_For_Visit (Optional)</label>
                        <textarea 
                          rows="3"
                          className="w-full border-2 border-foreground p-4 font-mono focus:bg-accent/5 outline-none resize-none"
                          placeholder="BRIEF DESCRIPTION OF SYMPTOMS..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                     </div>

                     {error && (
                        <div className="bg-destructive/10 border-2 border-destructive p-4 font-mono font-bold text-destructive text-sm uppercase flex items-center gap-3">
                           <AlertCircle size={20} /> {error}
                        </div>
                     )}

                     <button
                       type="submit"
                       disabled={submitting}
                       className="brutal-btn w-full py-5 text-2xl flex items-center justify-center gap-4"
                     >
                        {submitting ? <Loader2 className="animate-spin" /> : 
                         (useAI && selectedImage ? 'CONFIRM_BOOKING_WITH_AI_ANALYSIS' : 'CONFIRM_BOOKING_SYS')}
                     </button>
                  </form>
               </div>
            )}
         </div>
      </div>

      <div className="brutal-card border-none bg-foreground text-background p-8 flex items-center gap-8">
         <Info className="flex-shrink-0 text-primary" size={40} />
         <p className="font-mono text-sm font-black italic uppercase leading-tight">
            Cancellations are permitted up to 24 hours before the appointment time via the "My Appointments" portal.
         </p>
      </div>
    </div>
  );
};

export default BookAppointment;
