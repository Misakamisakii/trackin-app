import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Track } from '@/types';
import { ChevronDown, ChevronUp, Mic2, FileAudio, Disc3, Settings2, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { VersionTree } from './VersionTree';

interface TrackListProps {
  tracks: Track[];
  onUpdateTrack: (id: string, updates: Partial<Track>) => void;
  onAddTrack: () => void;
  onDeleteTrack: (id: string) => void;
  onReorderTracks: (newTracks: Track[]) => void;
}

interface SortableTrackItemProps {
  track: Track;
  index: number;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onUpdateTrack: (id: string, updates: Partial<Track>) => void;
}

const SortableTrackItem: React.FC<SortableTrackItemProps> = ({ 
  track, index, isExpanded, onToggleExpand, onDelete, onUpdateTrack 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const inputClasses = "w-full bg-white/50 border border-sage-200/50 rounded-xl px-4 py-2.5 text-sm font-medium text-deepblack focus:ring-2 focus:ring-deepblack focus:bg-white outline-none transition-all placeholder:text-sage-400";
  const labelClasses = "block text-xs font-bold text-sage-600 mb-1.5 uppercase tracking-wider";

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm rounded-2xl overflow-hidden group",
        isDragging && "shadow-2xl border-deepblack/20"
      )}
    >
      {/* Header Row */}
      <div 
        onClick={() => onToggleExpand(track.id)}
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/40 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Drag Handle */}
          <div 
            {...attributes} 
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab active:cursor-grabbing text-sage-300 hover:text-deepblack transition-colors p-1 -ml-2"
          >
            <GripVertical size={20} />
          </div>
          
          <span className="text-sage-400 font-bold text-lg w-6">{String(index + 1).padStart(2, '0')}</span>
          <div className="flex flex-col">
            <span className={cn(
              "text-lg font-bold transition-colors", 
              track.title ? "text-deepblack" : "text-sage-400 italic"
            )}>
              {track.title || 'Untitled Track'}
            </span>
            <div className="flex gap-3 text-xs font-medium text-sage-500 mt-1">
              {track.bpm && <span className="flex items-center gap-1"><Settings2 size={12}/> {track.bpm} BPM</span>}
              {track.genre && <span className="flex items-center gap-1"><Disc3 size={12}/> {track.genre}</span>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={(e) => onDelete(e, track.id)}
            className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-rose-400 hover:bg-rose-50 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
            title="Delete Track"
          >
            <Trash2 size={16} />
          </button>
          <div className="px-3 py-1 rounded-full bg-deepblack/5 text-deepblack text-xs font-bold uppercase tracking-wider">
            {track.status}
          </div>
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-deepblack">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-sage-200/30"
          >
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-sage-50/30" onClick={(e) => e.stopPropagation()}>
              
              {/* Title Input */}
              <div className="md:col-span-2">
                <label className={labelClasses}>Track Title (曲名)</label>
                <input 
                  type="text" 
                  value={track.title}
                  onChange={(e) => onUpdateTrack(track.id, { title: e.target.value })}
                  className={cn(inputClasses, "text-lg font-bold")}
                  placeholder="Enter track title..."
                />
              </div>

              <div>
                <label className={labelClasses}>Artist (演唱者)</label>
                <div className="relative">
                  <Mic2 size={16} className="absolute left-3 top-3 text-sage-400" />
                  <input 
                    type="text" 
                    value={track.artist}
                    onChange={(e) => onUpdateTrack(track.id, { artist: e.target.value })}
                    className={cn(inputClasses, "pl-10")}
                    placeholder="Vocalist / Primary Artist"
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Genre (风格)</label>
                <div className="relative">
                  <Disc3 size={16} className="absolute left-3 top-3 text-sage-400" />
                  <input 
                    type="text" 
                    value={track.genre}
                    onChange={(e) => onUpdateTrack(track.id, { genre: e.target.value })}
                    className={cn(inputClasses, "pl-10")}
                    placeholder="e.g. R&B, Synthwave"
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Lyricist (作词)</label>
                <input 
                  type="text" 
                  value={track.lyricist}
                  onChange={(e) => onUpdateTrack(track.id, { lyricist: e.target.value })}
                  className={inputClasses}
                  placeholder="Who wrote the lyrics?"
                />
              </div>

              <div>
                <label className={labelClasses}>Composer (作曲)</label>
                <input 
                  type="text" 
                  value={track.composer}
                  onChange={(e) => onUpdateTrack(track.id, { composer: e.target.value })}
                  className={inputClasses}
                  placeholder="Who wrote the music?"
                />
              </div>

              <div>
                <label className={labelClasses}>Sample Source (采样源)</label>
                <div className="relative">
                  <FileAudio size={16} className="absolute left-3 top-3 text-sage-400" />
                  <input 
                    type="text" 
                    value={track.sampleSource}
                    onChange={(e) => onUpdateTrack(track.id, { sampleSource: e.target.value })}
                    className={cn(inputClasses, "pl-10")}
                    placeholder="List any samples used"
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>BPM (节拍)</label>
                <div className="relative">
                  <Settings2 size={16} className="absolute left-3 top-3 text-sage-400" />
                  <input 
                    type="number" 
                    value={track.bpm}
                    onChange={(e) => onUpdateTrack(track.id, { bpm: parseInt(e.target.value) || '' })}
                    className={cn(inputClasses, "pl-10")}
                    placeholder="120"
                  />
                </div>
              </div>

              {/* 版本管理区域 */}
              <div className="md:col-span-2">
                <VersionTree 
                  trackId={track.id}
                  versions={track.versions || []}
                  onUpdateVersions={(versions) => onUpdateTrack(track.id, { versions })}
                />
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const TrackList: React.FC<TrackListProps> = ({ tracks, onUpdateTrack, onAddTrack, onDeleteTrack, onReorderTracks }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteTrack(id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tracks.findIndex((t) => t.id === active.id);
      const newIndex = tracks.findIndex((t) => t.id === over.id);
      
      const newTracks = arrayMove(tracks, oldIndex, newIndex);
      onReorderTracks(newTracks);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 pb-20">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-deepblack mb-2">Tracklist Metadata</h2>
          <p className="text-sage-600 font-medium">Manage detailed information for each track on the project.</p>
        </div>
        <button 
          onClick={onAddTrack}
          className="px-6 py-2.5 bg-deepblack text-sage-50 font-bold rounded-xl hover:bg-deepblack/90 hover:-translate-y-0.5 transition-all shadow-lg shadow-deepblack/10 active:scale-95"
        >
          + Add New Track
        </button>
      </div>

      <div className="space-y-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tracks.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <AnimatePresence>
              {tracks.map((track, index) => (
                <SortableTrackItem
                  key={track.id}
                  track={track}
                  index={index}
                  isExpanded={expandedId === track.id}
                  onToggleExpand={toggleExpand}
                  onDelete={handleDelete}
                  onUpdateTrack={onUpdateTrack}
                />
              ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};