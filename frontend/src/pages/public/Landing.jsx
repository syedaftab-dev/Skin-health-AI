import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Search, Activity, ArrowRight } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pt-20">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-20 border-b-2 border-foreground bg-background z-50 flex items-center justify-between px-10">
        <div className="text-3xl font-black italic text-primary">SkinAI</div>
        <div className="flex items-center gap-8">
          <Link to="/about" className="font-mono font-bold hover:text-primary transition-colors">ABOUT</Link>
          <Link to="/login" className="font-mono font-bold hover:text-primary transition-colors">LOGIN</Link>
          <Link to="/register/patient" className="brutal-btn uppercase">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-10 py-20 flex flex-col md:flex-row items-center gap-16 max-w-7xl mx-auto">
        <div className="flex-1 space-y-8">
          <div className="inline-block bg-accent px-4 py-1 border-2 border-foreground font-mono font-bold uppercase tracking-widest text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            AI-POWERED DERMATOLOGY
          </div>
          <h1 className="text-6xl md:text-8xl leading-[0.9] tracking-tighter uppercase font-black italic">
            Analyze your <span className="text-primary">Skin</span> <br /> in Seconds.
          </h1>
          <p className="text-xl font-mono max-w-xl font-medium">
            Upload an image, get an instant AI prediction, and discover the nearest professional dermatologists for expert consultation.
          </p>
          <div className="flex flex-wrap gap-6 pt-4">
            <Link to="/register/patient" className="brutal-btn text-xl px-10 py-4 flex items-center gap-3">
              ANALYZE NOW <ArrowRight size={24} />
            </Link>
            <Link to="/register/doctor" className="font-mono font-bold border-2 border-foreground px-10 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              DOCTOR JOINING
            </Link>
          </div>
        </div>
        
        <div className="flex-1 relative">
          <div className="brutal-card p-4 aspect-square max-w-md mx-auto transform rotate-3 bg-white">
             {/* Use your generate_image tool later if needed, for now a placeholder div */}
             <div className="w-full h-full bg-accent/20 flex items-center justify-center border-2 border-dashed border-foreground font-mono font-black text-4xl text-center">
                SCANNING_ <br /> SYSTEM_
             </div>
          </div>
          <div className="absolute -bottom-10 -left-10 brutal-card p-6 bg-primary transform -rotate-6 max-w-[200px]">
            <p className="font-mono font-black text-primary-foreground leading-tight">95.4% MODEL_ACCURACY</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-10 py-32 bg-accent/10 border-y-2 border-foreground">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-black mb-20 uppercase italic text-center underline decoration-primary decoration-8 underline-offset-8">THE_PLATFORM</h2>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="brutal-card p-8 space-y-4">
              <div className="w-16 h-16 bg-primary flex items-center justify-center border-2 border-foreground mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-primary-foreground">
                <Zap size={32} />
              </div>
              <h3 className="text-3xl uppercase">Instant AI</h3>
              <p className="font-mono">State-of-the-art EfficientNet model trained on 33,000+ clinical images for high-precision detection.</p>
            </div>

            <div className="brutal-card p-8 space-y-4">
              <div className="w-16 h-16 bg-accent flex items-center justify-center border-2 border-foreground mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Search size={32} />
              </div>
              <h3 className="text-3xl uppercase">Find Doctors</h3>
              <p className="font-mono">Locate professional dermatologists near you based on pincode and city for immediate follow-up.</p>
            </div>

            <div className="brutal-card p-8 space-y-4">
              <div className="w-16 h-16 bg-background flex items-center justify-center border-2 border-foreground mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-foreground">
                <Shield size={32} />
              </div>
              <h3 className="text-3xl uppercase">Data Privacy</h3>
              <p className="font-mono">Your images and history are encrypted and stored securely. We prioritize your medical privacy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-10 py-32 max-w-7xl mx-auto w-full">
         <div className="flex flex-col md:flex-row gap-20">
            <div className="md:w-1/3 space-y-8">
               <h2 className="text-7xl font-black italic leading-none uppercase">HOW_ <br /> TO_ <br /> USE_</h2>
               <div className="bg-primary px-6 py-10 brutal-card">
                  <p className="font-mono font-bold text-primary-foreground text-lg uppercase tracking-wider">Follow 3 steps for instant results.</p>
               </div>
            </div>
            
            <div className="md:w-2/3 space-y-12">
               {[
                 { step: '01', title: 'CAPTURE', desc: 'Securely upload 3 high-res photos of the affected area from different angles.' },
                 { step: '02', title: 'ANALYZE', desc: 'Our AI engine processes the visual data against thousands of documented cases.' },
                 { step: '03', title: 'CONSULT', desc: 'Receive your prediction and immediately book an appointment with a nearby expert.' }
               ].map((item, i) => (
                 <div key={i} className="flex gap-10 border-b-2 border-foreground pb-12 last:border-b-0">
                    <span className="text-7xl font-black text-accent/50 font-mono tracking-tighter">{item.step}</span>
                    <div className="space-y-2">
                       <h3 className="text-4xl font-black uppercase italic">{item.title}</h3>
                       <p className="font-mono text-lg">{item.desc}</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t-2 border-foreground p-10 bg-foreground text-background">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-10">
            <div className="space-y-4">
               <div className="text-5xl font-black italic text-primary">SkinAI</div>
               <p className="font-mono max-w-sm">Next-gen dermatology platform bridging the gap between AI diagnostics and professional medical care.</p>
            </div>
            <div className="grid grid-cols-2 gap-20 font-mono font-bold uppercase">
               <div className="flex flex-col gap-4">
                  <span className="text-primary underline">PLATFORM</span>
                  <Link to="/about">About Us</Link>
                  <Link to="/register/patient">Patient Join</Link>
                  <Link to="/register/doctor">Doctor Join</Link>
               </div>
               <div className="flex flex-col gap-4">
                  <span className="text-primary underline">LEGAL</span>
                  <Link to="/privacy">Privacy</Link>
                  <Link to="/terms">Terms</Link>
                  <Link to="/disclaimer">Medical NLP</Link>
               </div>
            </div>
         </div>
         <div className="mt-20 pt-10 border-t border-background/20 text-center font-mono text-sm opacity-50">
            &copy; 2024 SKINAI_SYSTEMS // PRODUCTION_READY
         </div>
      </footer>
    </div>
  );
};

export default Landing;
