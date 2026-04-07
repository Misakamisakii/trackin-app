import { useState, useEffect } from 'react';
import { Landing } from '@/pages/Landing';
import { ProjectList } from '@/pages/ProjectList';
import { Dashboard as ProjectView } from '@/pages/Dashboard';
import { AnimatePresence, motion } from 'framer-motion';
import { Project } from '@/types';
import { supabase } from '@/lib/supabase';

export const App = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'projectList' | 'projectView'>('landing');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*, tracks(id)')
      .order('created_at', { ascending: false });

    if (data) {
      setProjects(data.map(p => ({
        id: p.id,
        title: p.title,
        artist: p.artist,
        category: p.category,
        genre: p.genre || '',
        introduction: p.introduction || '',
        coverUrl: p.cover_url || '',
        tracks: p.tracks || [] // Initialize with basic track info to get the correct count
      })));
    }
  };

  const handleAddProject = async (projectData: Omit<Project, 'id' | 'tracks'>) => {
    const { data } = await supabase.from('projects').insert({
      title: projectData.title,
      artist: projectData.artist,
      category: projectData.category,
      genre: projectData.genre,
      introduction: projectData.introduction,
      cover_url: projectData.coverUrl
    }).select().single();
    
    if (data) {
      const newProj: Project = {
        id: data.id,
        title: data.title,
        artist: data.artist,
        category: data.category,
        genre: data.genre || '',
        introduction: data.introduction || '',
        coverUrl: data.cover_url || '',
        tracks: []
      };
      setProjects([newProj, ...projects]);
    }
  };

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    setCurrentView('projectView');
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    // Optimistic update
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    
    await supabase.from('projects').update({
      title: updatedProject.title,
      artist: updatedProject.artist,
      category: updatedProject.category,
      genre: updatedProject.genre,
      introduction: updatedProject.introduction,
      cover_url: updatedProject.coverUrl
    }).eq('id', updatedProject.id);
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      setProjects(prev => prev.filter(p => p.id !== id));
      await supabase.from('projects').delete().eq('id', id);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {currentView === 'landing' && (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-screen"
        >
          <Landing onEnter={() => setCurrentView('projectList')} />
        </motion.div>
      )}

      {currentView === 'projectList' && (
        <motion.div
          key="projectList"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-screen"
        >
          <ProjectList 
            projects={projects} 
            onAddProject={handleAddProject} 
            onSelectProject={handleSelectProject} 
            onDeleteProject={handleDeleteProject}
            onUpdateProject={handleUpdateProject}
            onNavigateHome={() => setCurrentView('landing')}
          />
        </motion.div>
      )}

      {currentView === 'projectView' && (
        <motion.div
          key="projectView"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-screen"
        >
          {/* We pass the selected project details and a way to go back */}
          <ProjectView 
            project={projects.find(p => p.id === selectedProjectId)!}
            onBack={() => setCurrentView('projectList')}
            onUpdateProject={handleUpdateProject}
            onNavigateHome={() => setCurrentView('landing')}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
