import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { 
  History, 
  Search, 
  Filter, 
  ArrowRight, 
  Calendar, 
  Download,
  MoreVertical,
  X,
  PlusCircle,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PatientHistory = () => {
  const [predictions, setPredictions] = useState([]);
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/api/predictions');
        setPredictions(response.data);
      } catch (err) {
        console.error("History fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const filteredPredictions = predictions.filter(pred => 
    pred.disease_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pred.severity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="animate-pulse font-mono font-bold">LOADING_HISTORY...</div>;
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b-2 border-foreground">
        <div className="space-y-4">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter">My_History</h1>
          <p className="font-mono text-muted-foreground font-bold uppercase tracking-wider text-sm flex items-center gap-2">
             <History size={16} /> Track your skin health over time
          </p>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative">
              <input 
                type="text" 
                placeholder="SEARCH_BY_DISEASE"
                className="brutal-card p-3 pl-10 font-mono text-sm leading-none border-2 focus:bg-accent/5 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
           </div>
           <Link to="/patient/upload" className="brutal-btn uppercase text-sm px-6 py-3 flex items-center gap-2">
              <PlusCircle size={18} /> NEW_UPLOAD
           </Link>
        </div>
      </div>

      {filteredPredictions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {filteredPredictions.map((pred) => (
             <div 
               key={pred.id} 
               onClick={() => setSelectedPrediction(pred)}
               className="brutal-card bg-card overflow-hidden group cursor-pointer transition-all hover:bg-accent/5"
             >
                <div className="h-48 border-b-2 border-foreground overflow-hidden">
                   <img src={`http://localhost:8000${pred.image_url}`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6 space-y-4">
                   <div className="flex justify-between items-start">
                      <div className="space-y-1">
                         <h3 className="text-2xl font-black italic uppercase leading-none">{pred.disease_name}</h3>
                         <p className="font-mono text-xs opacity-50 uppercase flex items-center gap-1 font-black">
                            <Calendar size={12} /> {new Date(pred.created_at).toLocaleDateString()}
                         </p>
                      </div>
                      <div className={`px-2 py-1 font-mono font-black text-xs border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                        pred.severity === 'High' ? 'bg-destructive text-destructive-foreground' : 
                        pred.severity === 'Medium' ? 'bg-yellow-400' : 'bg-green-400'
                      }`}>
                         {pred.severity.toUpperCase()}
                      </div>
                   </div>
                   <div className="flex items-center justify-between pt-4 border-t border-foreground/10">
                      <div className="font-mono font-black text-sm">CONFIDENCE: <span className="text-primary italic">{pred.confidence_score}%</span></div>
                      <ArrowRight size={20} className="text-muted-foreground group-hover:text-foreground transition-colors group-hover:translate-x-1" />
                   </div>
                </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="brutal-card p-20 text-center space-y-6 bg-accent/5 border-dashed border-2">
           <p className="font-mono font-black text-2xl uppercase opacity-30 italic">NO_RECORDS_FOUND_MATCHING_CRITERIA</p>
           <button onClick={() => setSearchTerm('')} className="font-mono font-bold uppercase underline underline-offset-4 decoration-primary decoration-4">Clear Filters</button>
        </div>
      )}

      {/* Prediction Details Overlay */}
      {selectedPrediction && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
           <div className="brutal-card bg-card w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row relative">
              <button 
                onClick={() => setSelectedPrediction(null)}
                className="absolute top-4 right-4 z-10 brutal-btn bg-destructive p-2 shadow-none"
              >
                 <X size={24} />
              </button>

              <div className="md:w-1/2 h-[300px] md:h-auto border-b-2 md:border-b-0 md:border-r-2 border-foreground bg-accent/5">
                 <img src={`http://localhost:8000${selectedPrediction.image_url}`} alt="" className="w-full h-full object-contain" />
              </div>

              <div className="md:w-1/2 p-10 space-y-8 flex flex-col">
                 <div className="space-y-4">
                    <div className="inline-block bg-primary text-primary-foreground px-4 py-1 font-mono font-bold uppercase text-xs uppercase italic tracking-tighter">
                       ANALYSIS_ID: {selectedPrediction.id.slice(-8)}
                    </div>
                    <h2 className="text-5xl font-black italic uppercase leading-none">{selectedPrediction.disease_name}</h2>
                    <div className="flex gap-4">
                       <p className="font-mono text-sm leading-none border-2 border-foreground bg-foreground text-background px-3 py-1 font-black flex items-center gap-2">
                          {selectedPrediction.severity} Severity
                       </p>
                       <p className="font-mono text-sm leading-none border-2 border-foreground px-3 py-1 font-black">
                          {selectedPrediction.confidence_score}% Confidence
                       </p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h3 className="font-mono font-black uppercase text-xl italic underline decoration-primary decoration-4">System_Recommendation</h3>
                    <p className="font-mono text-lg bg-foreground text-background p-6 font-bold leading-tight">
                       {selectedPrediction.recommendation}
                    </p>
                 </div>

                 <div className="space-y-4">
                    <h3 className="font-mono font-black uppercase text-sm opacity-50 underline">Recommended_Actions</h3>
                    <ul className="space-y-2 font-mono font-bold text-sm">
                       {selectedPrediction.recommended_actions?.map((action, i) => (
                          <li key={i} className="flex gap-2">
                             <ArrowRight size={14} className="flex-shrink-0 text-primary mt-1" /> {action}
                          </li>
                       ))}
                    </ul>
                 </div>

                 <div className="mt-auto pt-8 border-t-2 border-foreground/10 flex flex-wrap gap-4">
                    <Link to="/patient/doctors" className="brutal-btn uppercase text-xs px-6 py-3 flex items-center gap-2">
                       CONSULT_DOCTOR <ExternalLink size={14} />
                    </Link>
                    <button className="font-mono font-bold border-2 border-foreground px-6 py-3 hover:bg-accent/5 uppercase text-xs flex items-center gap-2">
                       EXPORT_PDF <Download size={14} />
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PatientHistory;
