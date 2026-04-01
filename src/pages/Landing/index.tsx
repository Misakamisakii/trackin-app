import React from 'react';
import { motion } from 'framer-motion';
import { Music, Play, Disc3, Mic2, Radio } from 'lucide-react';

const FloatingNotes = () => {
  const notes = [
    { Icon: Music, className: "animate-float-1 left-[10%] bottom-[-5%]", size: 48 },
    { Icon: Play, className: "animate-float-2 left-[30%] bottom-[-10%]", size: 32 },
    { Icon: Disc3, className: "animate-float-3 left-[50%] bottom-[-2%]", size: 64 },
    { Icon: Mic2, className: "animate-float-4 left-[70%] bottom-[-8%]", size: 40 },
    { Icon: Radio, className: "animate-float-5 left-[90%] bottom-[-4%]", size: 56 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-end">
      <div className="w-full h-1/2 bg-gradient-to-t from-sage-200/50 to-transparent absolute bottom-0"></div>
      
      {notes.map((note, i) => (
        <div key={i} className={`absolute text-deepblack/10 ${note.className}`}>
          <note.Icon size={note.size} strokeWidth={1.5} />
        </div>
      ))}
      
      {/* Abstract sound waves via SVG */}
      <svg className="absolute bottom-0 w-full h-[30vh] opacity-20" preserveAspectRatio="none" viewBox="0 0 1440 320">
        <path fill="#0a0a0a" fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,272,576,250.7C672,229,768,160,864,138.7C960,117,1056,144,1152,165.3C1248,187,1344,203,1392,210.7L1440,213L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>
    </div>
  );
};

export const Landing = ({ onEnter }: { onEnter: () => void }) => {
  return (
    <div className="min-h-screen bg-sage-50 relative flex flex-col items-center justify-center overflow-hidden selection:bg-deepblack selection:text-sage-50">
      
      {/* Background grain texture for that tactile studio feel */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-50" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>

      <FloatingNotes />

      <main className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 flex items-center gap-3 px-4 py-2 rounded-full border border-deepblack/10 bg-white/30 backdrop-blur-md"
        >
          <div className="w-2 h-2 rounded-full bg-deepblack animate-pulse"></div>
          <span className="text-sm font-medium tracking-wide uppercase">Trackin' v1.0 is live</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-7xl md:text-8xl lg:text-[100px] font-bold text-deepblack tracking-tighter leading-[0.9] text-shadow-glow mb-8"
        >
          Keep track<br/>of your <span className="italic font-light opacity-90">track.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-lg md:text-xl text-sage-700 max-w-2xl mb-12 font-medium tracking-tight"
        >
          The professional album production management and audio version control platform designed exclusively for modern music creators.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <button 
            onClick={onEnter}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-deepblack text-sage-50 font-bold text-lg rounded-2xl overflow-hidden transition-transform active:scale-95 hover:-translate-y-1 shadow-xl shadow-deepblack/20"
          >
            <span className="relative z-10">Start tracking</span>
            <div className="relative z-10 w-8 h-8 rounded-full bg-sage-50/10 flex items-center justify-center transition-transform group-hover:translate-x-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </div>
            {/* Subtle inner shadow for neumorphic feel */}
            <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] pointer-events-none"></div>
          </button>
        </motion.div>
      </main>

      <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-20">
        <div className="font-bold text-xl tracking-tighter flex items-center gap-2">
          <Disc3 className="w-6 h-6" />
          Trackin'
        </div>
        <div className="flex gap-6 text-sm font-medium">
          <a href="#" className="hover:opacity-60 transition-opacity">Features</a>
          <a href="#" className="hover:opacity-60 transition-opacity">Pricing</a>
          <a href="#" className="hover:opacity-60 transition-opacity">Login</a>
        </div>
      </nav>
    </div>
  );
};
