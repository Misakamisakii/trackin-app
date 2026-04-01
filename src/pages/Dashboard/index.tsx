import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Track, TrackStatus, Project } from '@/types';
import { TrackList } from '@/components/dashboard/TrackList';
import { ProductionBoard } from '@/components/dashboard/ProductionBoard';
import { Disc3, ListMusic, Columns3, UserCircle, Settings, Info, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { supabase } from '@/lib/supabase';

interface DashboardProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (updatedProject: Project) => void;
  onNavigateHome: () => void;
}

type TabType = 'list' | 'board';

export const Dashboard: React.FC<DashboardProps> = ({ project, onBack, onUpdateProject, onNavigateHome }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [isLoadingTracks, setIsLoadingTracks] = useState(true);

  // Sync back to parent whenever tracks change (mostly for track count in ProjectList)
  const projectRef = React.useRef(project);
  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  useEffect(() => {
    onUpdateProject({ ...projectRef.current, tracks });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks]);

  // Fetch tracks from Supabase when project changes
  useEffect(() => {
    const fetchTracks = async () => {
      setIsLoadingTracks(true);
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('project_id', project.id)
        .order('order', { ascending: true });
        
      if (data) {
        setTracks(data.map(t => ({
          id: t.id,
          title: t.title || '',
          artist: t.artist || '',
          lyricist: t.lyricist || '',
          composer: t.composer || '',
          sampleSource: t.sample_source || '',
          bpm: t.bpm || '',
          genre: t.genre || '',
          status: t.status,
          order: t.order
        })));
      } else if (error) {
        console.error("Error fetching tracks:", error);
      }
      setIsLoadingTracks(false);
    };
    
    fetchTracks();
  }, [project.id]);

  const handleUpdateTrack = async (id: string, updates: Partial<Track>) => {
    // Optimistic update
    setTracks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    
    // Map to snake_case for DB
    const dbUpdates: any = { ...updates };
    if (updates.sampleSource !== undefined) { 
      dbUpdates.sample_source = updates.sampleSource; 
      delete dbUpdates.sampleSource; 
    }
    
    await supabase.from('tracks').update(dbUpdates).eq('id', id);
  };

  const handleDeleteTrack = async (id: string) => {
    if (confirm('Are you sure you want to delete this track?')) {
      // Optimistic update
      setTracks(prev => prev.filter(t => t.id !== id));
      await supabase.from('tracks').delete().eq('id', id);
    }
  };

  const handleUpdateStatus = (id: string, status: TrackStatus) => {
    handleUpdateTrack(id, { status });
  };

  const handleReorderTracks = async (reorderedTracks: Track[]) => {
    // Optimistic update
    setTracks(reorderedTracks);
    
    // Sync to DB (batch update order)
    await Promise.all(reorderedTracks.map((t, index) => 
      supabase.from('tracks').update({ order: index }).eq('id', t.id)
    ));
  };

  const handleAddTrack = async () => {
    const newOrder = tracks.length;
    
    const { data, error } = await supabase.from('tracks').insert({
      project_id: project.id,
      title: '',
      artist: project.artist,
      status: 'Demo',
      order: newOrder
    }).select().single();
    
    if (data) {
      const newTrack: Track = {
        id: data.id,
        title: data.title || '',
        artist: data.artist || '',
        lyricist: data.lyricist || '',
        composer: data.composer || '',
        sampleSource: data.sample_source || '',
        bpm: data.bpm || '',
        genre: data.genre || '',
        status: data.status,
        order: data.order
      };
      setTracks(prev => [...prev, newTrack]);
    } else if (error) {
      console.error("Error adding track:", error);
    }
  };

  return (
    <div className="min-h-screen bg-sage-50 relative selection:bg-deepblack selection:text-sage-50 pb-20">
      {/* Background grain texture */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-50" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>

      {/* Top Navigation */}
      <nav className="sticky top-0 w-full px-8 py-6 flex justify-between items-center z-40 bg-sage-50/80 backdrop-blur-xl border-b border-deepblack/5">
        <div className="flex items-center gap-6">
          <div className="font-bold text-xl tracking-tighter flex items-center gap-3 text-deepblack">
            <div 
              onClick={onNavigateHome}
              className="w-8 h-8 rounded-lg bg-deepblack text-sage-50 flex items-center justify-center shadow-lg shadow-deepblack/20 cursor-pointer hover:scale-105 transition-transform"
              title="Home"
            >
              <Disc3 className="w-5 h-5" />
            </div>
            <div className="flex items-center">
              <span 
                onClick={onNavigateHome}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                Trackin'
              </span>
              <span className="opacity-40 font-light mx-2">/</span>
              <span 
                onClick={onBack}
                className="cursor-pointer hover:opacity-80 transition-opacity truncate max-w-[150px]"
                title="Back to Projects"
              >
                {project.title}
              </span>
              <span className="opacity-40 font-light mx-2">/</span>
              <span className="opacity-60">Workspace</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex gap-2 bg-white/50 p-1.5 rounded-2xl border border-white shadow-sm backdrop-blur-md">
            <button 
              onClick={() => setActiveTab('list')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all",
                activeTab === 'list' ? "bg-deepblack text-sage-50 shadow-md" : "text-sage-600 hover:bg-white/60"
              )}
            >
              <ListMusic size={16} /> Metadata
            </button>
            <button 
              onClick={() => setActiveTab('board')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all",
                activeTab === 'board' ? "bg-deepblack text-sage-50 shadow-md" : "text-sage-600 hover:bg-white/60"
              )}
            >
              <Columns3 size={16} /> Progress
            </button>
          </div>
          
          <div className="h-8 w-px bg-deepblack/10 mx-2"></div>
          
          <button className="w-10 h-10 rounded-full border-2 border-white bg-sage-200 flex items-center justify-center text-sage-700 shadow-sm hover:shadow-md transition-shadow">
            <UserCircle size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-[1400px] mx-auto mt-12 px-8 relative z-10">
        
        {/* Project Header Header */}
        <div className="mb-12">
          <div className="flex items-end justify-between mb-4">
            <div className="flex gap-8 items-end">
              {/* Large Cover Display */}
              <div className="w-48 h-48 rounded-3xl overflow-hidden shadow-2xl bg-sage-200 border-2 border-white/50 flex-shrink-0 relative">
                {project.coverUrl ? (
                  <img src={project.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-sage-200">
                    <Disc3 size={64} className="text-sage-400 opacity-50" />
                  </div>
                )}
                {/* Vinyl record decorative edge */}
                <div className="absolute inset-y-0 -right-4 w-8 rounded-full bg-deepblack shadow-[-4px_0_12px_rgba(0,0,0,0.5)] z-[-1]"></div>
              </div>

              <div className="pb-2">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-deepblack/5 rounded-lg text-xs font-bold uppercase tracking-wider text-sage-600 border border-deepblack/5">
                    {project.category}
                  </span>
                  {project.genre && (
                    <span className="px-3 py-1 bg-sage-200/50 rounded-lg text-xs font-bold uppercase tracking-wider text-sage-600 border border-sage-300/50">
                      {project.genre}
                    </span>
                  )}
                </div>
                <h1 className="text-5xl md:text-7xl font-bold text-deepblack tracking-tighter leading-none mb-6">
                  {project.title}
                </h1>
                <div className="flex items-center gap-4 text-sage-600 font-medium">
                  <span className="flex items-center gap-2 bg-white/80 px-4 py-1.5 rounded-xl border border-white shadow-sm"><Disc3 size={16}/> {tracks.length} Tracks</span>
                  <span className="flex items-center gap-2 bg-white/80 px-4 py-1.5 rounded-xl border border-white shadow-sm"><Settings size={16}/> {project.artist}</span>
                  <span className="flex items-center gap-2 bg-white/80 px-4 py-1.5 rounded-xl border border-white shadow-sm"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span> In Progress</span>
                </div>
              </div>
            </div>
          </div>
          
          {project.introduction && (
            <div className="bg-white/60 backdrop-blur-md border border-white shadow-sm rounded-2xl p-5 flex gap-4 text-sage-700 max-w-4xl ml-56 mt-2">
              <Info className="flex-shrink-0 text-sage-400 mt-0.5" size={20} />
              <p className="text-base font-medium leading-relaxed">{project.introduction}</p>
            </div>
          )}
        </div>

        {/* Tab Content Rendering with AnimatePresence */}
        <AnimatePresence mode="wait">
          {isLoadingTracks ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-20"
            >
              <Loader2 className="w-8 h-8 text-sage-400 animate-spin" />
            </motion.div>
          ) : activeTab === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <TrackList 
                tracks={tracks} 
                onUpdateTrack={handleUpdateTrack} 
                onAddTrack={handleAddTrack} 
                onDeleteTrack={handleDeleteTrack}
                onReorderTracks={handleReorderTracks}
              />
            </motion.div>
          ) : (
            <motion.div
              key="board"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <ProductionBoard 
                tracks={tracks} 
                onUpdateTrackStatus={handleUpdateStatus} 
              />
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
};
