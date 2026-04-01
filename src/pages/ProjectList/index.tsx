import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project, ProjectCategory } from '@/types';
import { Disc3, Plus, Music2, Trash2, ImagePlus, X, Edit2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onAddProject: (project: Omit<Project, 'id' | 'tracks'>) => Promise<void>;
  onDeleteProject: (projectId: string) => void;
  onUpdateProject: (project: Project) => void;
  onNavigateHome: () => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ 
  projects, onSelectProject, onAddProject, onDeleteProject, onUpdateProject, onNavigateHome 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  
  const defaultProjectState = { 
    title: '', 
    artist: '',
    category: 'Album' as ProjectCategory,
    genre: '',
    introduction: '',
    coverUrl: ''
  };
  
  const [formState, setFormState] = useState(defaultProjectState);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openAddModal = () => {
    setEditingProjectId(null);
    setFormState(defaultProjectState);
    setCoverFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingProjectId(project.id);
    setFormState({
      title: project.title,
      artist: project.artist,
      category: project.category,
      genre: project.genre,
      introduction: project.introduction,
      coverUrl: project.coverUrl || ''
    });
    setCoverFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title || !formState.artist) return;
    
    setIsSubmitting(true);
    let finalCoverUrl = formState.coverUrl;

    // Upload to Supabase Storage if a new file was selected
    if (coverFile) {
      const fileExt = coverFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('covers')
        .upload(fileName, coverFile);
        
      if (data) {
        const { data: { publicUrl } } = supabase.storage
          .from('covers')
          .getPublicUrl(fileName);
        finalCoverUrl = publicUrl;
      } else if (error) {
        console.error("Error uploading cover:", error);
      }
    }
    
    if (editingProjectId) {
      const existingProject = projects.find(p => p.id === editingProjectId);
      if (existingProject) {
        await onUpdateProject({
          ...existingProject,
          ...formState,
          coverUrl: finalCoverUrl
        });
      }
    } else {
      await onAddProject({
        ...formState,
        coverUrl: finalCoverUrl
      });
    }
    
    setIsSubmitting(false);
    setIsModalOpen(false);
    setFormState(defaultProjectState);
    setCoverFile(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      onDeleteProject(id);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      // Create a local object URL just for immediate preview
      const imageUrl = URL.createObjectURL(file);
      setFormState(prev => ({ ...prev, coverUrl: imageUrl }));
    }
  };

  const removeCover = () => {
    setCoverFile(null);
    setFormState(prev => ({ ...prev, coverUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-sage-50 relative selection:bg-deepblack selection:text-sage-50 pb-20">
      {/* Background grain */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-50" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>

      <nav className="sticky top-0 w-full px-8 py-6 flex justify-between items-center z-40 bg-sage-50/80 backdrop-blur-xl border-b border-deepblack/5">
        <div className="font-bold text-2xl tracking-tighter flex items-center gap-3 text-deepblack">
          <div 
            onClick={onNavigateHome}
            className="w-10 h-10 rounded-xl bg-deepblack text-sage-50 flex items-center justify-center shadow-lg shadow-deepblack/20 cursor-pointer hover:scale-105 transition-transform"
            title="Home"
          >
            <Disc3 className="w-6 h-6" />
          </div>
          <div className="flex items-center">
            <span 
              onClick={onNavigateHome}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              Trackin'
            </span>
            <span className="opacity-40 font-light mx-2">/</span>
            <span className="opacity-60">Projects</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto mt-12 px-8 relative z-10">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-deepblack tracking-tighter leading-none mb-4">
              Your Library
            </h1>
            <p className="text-sage-600 font-medium text-lg">Select a project to start tracking progress.</p>
          </div>
          <button 
            onClick={openAddModal}
            className="group flex items-center gap-2 px-6 py-3 bg-deepblack text-sage-50 font-bold rounded-2xl hover:bg-deepblack/90 hover:-translate-y-1 transition-all shadow-xl shadow-deepblack/20 active:scale-95"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            New Project
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => onSelectProject(project.id)}
                className="group cursor-pointer bg-white/60 backdrop-blur-xl border border-white/40 p-6 rounded-3xl shadow-sm hover:shadow-2xl hover:shadow-deepblack/5 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden flex flex-col"
              >
                {/* Abstract Vinyl Record Decorative element */}
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-deepblack/5 border-[10px] border-white/20 group-hover:rotate-12 transition-transform duration-700"></div>
                <div className="absolute -right-2 -top-2 w-8 h-8 rounded-full bg-sage-50 border-4 border-deepblack/10"></div>

                {/* Actions */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => openEditModal(e, project)}
                    className="w-8 h-8 rounded-full bg-white/80 text-sage-600 flex items-center justify-center shadow-sm hover:bg-sage-100 transition-all border border-sage-200"
                    title="Edit Project"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(e, project.id)}
                    className="w-8 h-8 rounded-full bg-white/80 text-rose-500 flex items-center justify-center shadow-sm hover:bg-rose-50 hover:text-rose-600 transition-all border border-rose-100"
                    title="Delete Project"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex items-start gap-4 mb-6 relative z-10">
                  {/* Cover Thumbnail */}
                  <div className="w-20 h-20 rounded-2xl flex-shrink-0 overflow-hidden shadow-md bg-sage-200 border border-white/50 flex items-center justify-center relative">
                    {project.coverUrl ? (
                      <img src={project.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <Disc3 size={32} className="text-sage-400 opacity-50" />
                    )}
                    {/* Vinyl edge effect */}
                    <div className="absolute inset-y-0 -right-2 w-4 rounded-full bg-deepblack/90 shadow-[-2px_0_4px_rgba(0,0,0,0.5)] z-[-1] transition-transform group-hover:translate-x-3 duration-500"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 bg-deepblack/5 rounded text-[10px] font-bold uppercase tracking-wider text-sage-600">
                        {project.category}
                      </span>
                      {project.genre && (
                        <span className="px-2 py-0.5 bg-sage-200/50 rounded text-[10px] font-bold uppercase tracking-wider text-sage-600 truncate max-w-[100px]">
                          {project.genre}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-deepblack mb-0.5 group-hover:text-sage-800 transition-colors truncate" title={project.title}>
                      {project.title}
                    </h3>
                    <p className="text-sage-500 font-medium text-sm truncate" title={project.artist}>{project.artist}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-sage-200/50 relative z-10">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-sage-600">
                    <Music2 size={16} /> {project.tracks.length} Tracks
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Add Project Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-deepblack/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-sage-50 rounded-[2rem] p-8 shadow-2xl border border-white/50 max-h-[90vh] overflow-y-auto hide-scrollbar"
            >
              <h2 className="text-3xl font-bold text-deepblack tracking-tight mb-2">
                {editingProjectId ? 'Edit Project' : 'New Project'}
              </h2>
              <p className="text-sage-500 font-medium mb-8">
                {editingProjectId ? 'Update the details for your project.' : 'Enter the details to create a new workspace.'}
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Cover Upload */}
                <div className="flex justify-center mb-6">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-2xl overflow-hidden bg-sage-200 border-2 border-dashed border-sage-300 flex items-center justify-center cursor-pointer hover:border-deepblack/50 transition-colors shadow-sm">
                      {formState.coverUrl ? (
                        <img src={formState.coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-sage-400">
                          <ImagePlus size={28} className="mb-2" />
                          <span className="text-xs font-bold uppercase tracking-wider">Upload Cover</span>
                        </div>
                      )}
                      
                      {/* Hidden File Input */}
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/png, image/jpeg, image/jpg"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    
                    {/* Remove Cover Button */}
                    {formState.coverUrl && (
                      <button
                        type="button"
                        onClick={removeCover}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition-all z-10"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-sage-600 mb-2 uppercase tracking-wider">Project Title</label>
                    <input 
                      type="text" 
                      required
                      value={formState.title}
                      onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                      className="w-full bg-white/80 border border-sage-200 rounded-xl px-4 py-3 text-deepblack font-bold focus:ring-2 focus:ring-deepblack focus:bg-white outline-none transition-all placeholder:text-sage-300 placeholder:font-medium"
                      placeholder="e.g. Midnight Echoes"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-sage-600 mb-2 uppercase tracking-wider">Artist Name</label>
                    <input 
                      type="text" 
                      required
                      value={formState.artist}
                      onChange={(e) => setFormState({ ...formState, artist: e.target.value })}
                      className="w-full bg-white/80 border border-sage-200 rounded-xl px-4 py-3 text-deepblack font-bold focus:ring-2 focus:ring-deepblack focus:bg-white outline-none transition-all placeholder:text-sage-300 placeholder:font-medium"
                      placeholder="e.g. The Midnight"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-sage-600 mb-2 uppercase tracking-wider">Category</label>
                    <select 
                      value={formState.category}
                      onChange={(e) => setFormState({ ...formState, category: e.target.value as ProjectCategory })}
                      className="w-full bg-white/80 border border-sage-200 rounded-xl px-4 py-3 text-deepblack font-bold focus:ring-2 focus:ring-deepblack focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="Album">Album</option>
                      <option value="EP">EP</option>
                      <option value="Single">Single</option>
                      <option value="Beattape">Beattape</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-sage-600 mb-2 uppercase tracking-wider">Genre</label>
                    <input 
                      type="text" 
                      value={formState.genre}
                      onChange={(e) => setFormState({ ...formState, genre: e.target.value })}
                      className="w-full bg-white/80 border border-sage-200 rounded-xl px-4 py-3 text-deepblack font-bold focus:ring-2 focus:ring-deepblack focus:bg-white outline-none transition-all placeholder:text-sage-300 placeholder:font-medium"
                      placeholder="e.g. Synthwave, Pop"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-sage-600 mb-2 uppercase tracking-wider">Introduction</label>
                  <textarea 
                    value={formState.introduction}
                    onChange={(e) => setFormState({ ...formState, introduction: e.target.value })}
                    className="w-full bg-white/80 border border-sage-200 rounded-xl px-4 py-3 text-deepblack font-medium focus:ring-2 focus:ring-deepblack focus:bg-white outline-none transition-all placeholder:text-sage-300 min-h-[100px] resize-y"
                    placeholder="Brief description of this project..."
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 font-bold text-sage-600 bg-sage-200/50 rounded-xl hover:bg-sage-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 font-bold text-sage-50 bg-deepblack rounded-xl shadow-lg shadow-deepblack/20 hover:bg-deepblack/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    {editingProjectId ? 'Save Changes' : 'Create Project'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
