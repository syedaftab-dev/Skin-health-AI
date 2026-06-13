import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { 
  Camera, 
  Upload as UploadIcon, 
  X, 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  ChevronRight,
  ArrowRight,
  Search,
  PlusCircle
} from 'lucide-react';

const Upload = () => {
  const { user } = useAuth();
  console.log('Upload component - user:', user); // Debug log
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setPreview(event.target.result);
      reader.readAsDataURL(file);
      setResult(null);
      setError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileChange({ target: { files: [file] } });
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await api.post('/api/predict/upload', formData);
      console.log('API Response:', response.data); // Debug log
      setResult(response.data);
    } catch (err) {
      console.error('Upload error:', err); // Debug log
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
      setResult(null); // Clear any previous results
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      {!user ? (
        <div className="brutal-card bg-destructive/10 border-2 border-destructive p-10 text-center">
          <h3 className="text-2xl font-mono font-bold text-destructive uppercase mb-4">NOT_AUTHENTICATED</h3>
          <p className="font-mono mb-4">Please log in to access this page.</p>
          <Link to="/login" className="brutal-btn">GO_TO_LOGIN</Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <h1 className="text-5xl font-black italic uppercase tracking-tighter">New_Analysis</h1>
            <p className="font-mono text-muted-foreground font-bold uppercase tracking-wider text-sm flex items-center gap-2">
               <Info size={16} /> Upload 3 high-res photos for highest accuracy.
            </p>
          </div>

          {!result ? (
            <section className="space-y-8">
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`brutal-card p-12 border-dashed border-4 flex flex-col items-center justify-center text-center gap-6 cursor-pointer transition-colors ${
                  preview ? 'border-primary bg-primary/5' : 'border-foreground/20 hover:border-primary hover:bg-accent/5'
                }`}
              >
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept="image/*"
                />
                
                {!preview ? (
                  <>
                    <div className="w-24 h-24 bg-accent flex items-center justify-center border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                       <UploadIcon size={40} />
                    </div>
                    <div>
                       <h3 className="text-3xl font-black uppercase italic">UPLOAD_IMAGE_</h3>
                       <p className="font-mono font-bold opacity-60 uppercase mt-2">DRAG AND DROP OR CLICK TO BROWSE</p>
                    </div>
                  </>
                ) : (
                  <div className="relative w-full max-w-md aspect-square border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-white">
                     <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                     <button 
                       onClick={(e) => { e.stopPropagation(); clearSelection(); }}
                       className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-2 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                     >
                        <X size={20} />
                     </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-destructive/10 border-2 border-destructive p-4 font-mono font-bold text-destructive text-sm uppercase flex items-center gap-3">
                   <AlertTriangle size={20} /> {error}
                </div>
              )}

              <div className="flex justify-center">
                <button 
                  disabled={!selectedFile || isLoading}
                  onClick={handleSubmit}
                  className="brutal-btn text-2xl px-16 py-5 flex items-center gap-4 w-full md:w-auto"
                >
                  {isLoading ? (
                    <> <Loader2 className="animate-spin" /> ANALYZING_SYSTEM_ </>
                  ) : (
                    <> <Camera size={28} /> RUN_AI_DIAGNOSES </>
                  )}
                </button>
              </div>
            </section>
          ) : result && result.recommendation ? (
            <section className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-500">
               {/* Results Header */}
               <div className="brutal-card bg-primary p-10 flex flex-col md:flex-row items-center gap-12 text-primary-foreground">
                  <div className="w-48 h-48 border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] overflow-hidden flex-shrink-0 bg-white">
                     <img src={preview} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-4 text-center md:text-left">
                     <div className="inline-block bg-white text-foreground px-4 py-1 font-mono font-bold uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
                       ANALYSIS_COMPLETE / CONFIDENCE: {result.recommendation.confidence_percent}%
                     </div>
                     <h2 className="text-6xl font-black italic uppercase leading-none">{result.recommendation.diagnosis}</h2>
                     <p className="text-xl font-mono opacity-90 max-w-xl">{result.recommendation.description}</p>
                  </div>
                  <div className={`p-6 border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] text-center space-y-1 min-w-[150px] ${
                    result.recommendation.severity === 'High' ? 'bg-destructive' : 
                    result.recommendation.severity === 'Medium' ? 'bg-yellow-400 text-foreground' : 'bg-green-400 text-foreground'
                  }`}>
                     <p className="font-mono text-xs font-black uppercase text-foreground/50">SEVERITY</p>
                     <p className="text-3xl font-black italic uppercase">{result.recommendation.severity}</p>
                  </div>
               </div>

               {/* Prediction Details */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="brutal-card bg-card p-8 space-y-6">
                     <h3 className="text-3xl font-black italic uppercase border-b-2 border-foreground pb-2 flex items-center gap-3">
                        <AlertTriangle className="text-primary" /> URGENCY_LEVEL
                     </h3>
                     <p className="font-mono text-xl font-bold bg-accent/10 p-6 border-2 border-foreground dashed-border">
                        {result.recommendation.urgency}
                     </p>
                     <div className="space-y-4">
                        <h4 className="font-mono font-black uppercase underline decoration-primary decoration-4">Recommended_Actions</h4>
                        <ul className="space-y-3 font-mono font-bold">
                           {result.recommendation.recommended_actions.map((action, i) => (
                             <li key={i} className="flex gap-3">
                                <ChevronRight className="text-primary flex-shrink-0" /> {action}
                             </li>
                           ))}
                        </ul>
                     </div>
                  </div>

                  <div className="brutal-card bg-card p-8 space-y-6">
                     <h3 className="text-3xl font-black italic uppercase border-b-2 border-foreground pb-2 flex items-center gap-3">
                        <CheckCircle className="text-green-500" /> RECOMMENDED_CARE
                     </h3>
                     <div className="space-y-6">
                        <div className="space-y-4">
                           <h4 className="font-mono font-black uppercase underline decoration-accent decoration-4">Suggested_Products</h4>
                           {result.recommendation.suggested_products.length > 0 ? (
                             <ul className="space-y-3 font-mono font-bold">
                               {result.recommendation.suggested_products.map((p, i) => (
                                  <li key={i} className="flex gap-3 items-center">
                                     <PlusCircle size={16} className="text-accent" /> {p}
                                  </li>
                               ))}
                             </ul>
                           ) : (
                             <p className="font-mono opacity-50 italic uppercase">NONE_RECOMMENDED / CONSULT_PRO</p>
                           )}
                        </div>

                        <div className="pt-6 border-t border-foreground/10 space-y-4">
                           <h4 className="font-mono font-black uppercase">Next_Steps</h4>
                           <div className="grid grid-cols-1 gap-4">
                              <Link to="/patient/doctors" className="brutal-btn w-full text-center flex items-center justify-center gap-2">
                                 FIND_PROFESSIONAL <Search size={18} />
                              </Link>
                              <button onClick={clearSelection} className="font-mono font-bold border-2 border-foreground py-2 hover:bg-accent/5 transition-all">
                                 NEW_ANALYSIS
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="brutal-card bg-foreground text-background p-8 font-mono border-none relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                     <Info size={120} />
                  </div>
                  <h4 className="font-black text-primary uppercase text-sm mb-4">MEDICAL_DISCLAIMER_SYS</h4>
                  <p className="text-lg italic leading-tight max-w-3xl relative z-10">
                    {result.recommendation.disclaimer}
                  </p>
               </div>
            </section>
          ) : result ? (
            <section className="brutal-card bg-destructive/10 border-2 border-destructive p-10 text-center">
              <h3 className="text-2xl font-mono font-bold text-destructive uppercase mb-4">ERROR_DISPLAYING_RESULTS</h3>
              <p className="font-mono mb-4">The analysis was completed but there was an error displaying the results.</p>
              <button onClick={clearSelection} className="brutal-btn">TRY_AGAIN</button>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
};

export default Upload;
