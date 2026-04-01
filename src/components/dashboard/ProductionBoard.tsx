import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Track, TrackStatus } from '@/types';
import { CheckCircle2, Clock, GripVertical } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';

interface ProductionBoardProps {
  tracks: Track[];
  onUpdateTrackStatus: (id: string, newStatus: TrackStatus) => void;
}

const STAGES: { id: TrackStatus; title: string; color: string }[] = [
  { id: 'Demo', title: 'Idea / Demo', color: 'bg-sage-200 text-sage-800' },
  { id: 'Arrangement', title: 'Arranging', color: 'bg-blue-100 text-blue-800' },
  { id: 'Recording', title: 'Recording', color: 'bg-rose-100 text-rose-800' },
  { id: 'Mixing', title: 'Mixing', color: 'bg-amber-100 text-amber-800' },
  { id: 'Mastering', title: 'Mastering', color: 'bg-purple-100 text-purple-800' },
  { id: 'Done', title: 'Done', color: 'bg-emerald-100 text-emerald-800' },
];

function TrackCard({ track, stage, index }: { track: Track; stage: typeof STAGES[0]; index: number }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: track.id,
    data: { track, stageId: stage.id }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.3 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white p-4 rounded-xl shadow-sm border border-sage-100 group relative hover:shadow-md transition-shadow",
        isDragging && "opacity-30 z-50"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing text-sage-300 hover:text-deepblack transition-colors"
          >
            <GripVertical size={16} />
          </div>
          <span className="text-sage-400 font-bold text-sm w-5">{String(index + 1).padStart(2, '0')}</span>
          <h4 className="font-bold text-deepblack leading-tight">
            {track.title || 'Untitled Track'}
          </h4>
        </div>
        {stage.id === 'Done' ? (
          <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
        ) : (
          <Clock size={16} className="text-sage-400 flex-shrink-0" />
        )}
      </div>

      <div className="flex flex-wrap gap-2 pl-6">
        {track.bpm && (
          <span className="text-[10px] font-bold uppercase bg-sage-50 text-sage-600 px-2 py-0.5 rounded">
            {track.bpm} BPM
          </span>
        )}
        {track.genre && (
          <span className="text-[10px] font-bold uppercase bg-sage-50 text-sage-600 px-2 py-0.5 rounded">
            {track.genre}
          </span>
        )}
      </div>
    </div>
  );
}

function Column({ stage, tracks, allTracks }: { stage: typeof STAGES[0]; tracks: Track[]; allTracks: Track[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div className="w-[320px] flex-shrink-0">
      <div className="flex items-center justify-between mb-4 border-b-2 border-deepblack/10 pb-2">
        <h3 className="font-bold text-deepblack uppercase tracking-tight flex items-center gap-2">
          <span className={cn("w-2.5 h-2.5 rounded-full", stage.color.split(' ')[0])}></span>
          {stage.title}
        </h3>
        <span className="bg-white text-sage-500 font-bold text-xs px-2 py-0.5 rounded-md shadow-sm border border-sage-100">
          {tracks.length}
        </span>
      </div>

      <div 
        ref={setNodeRef} 
        className={cn(
          "space-y-4 min-h-[400px] bg-white/30 backdrop-blur-md rounded-2xl p-3 border border-white/40 transition-colors",
          isOver ? "bg-white/50 border-deepblack/20" : "shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]"
        )}
      >
        <AnimatePresence>
          {tracks.map((track) => {
            const globalIndex = allTracks.findIndex(t => t.id === track.id);
            return (
              <motion.div
                key={track.id}
                layout
                layoutId={track.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <TrackCard track={track} stage={stage} index={globalIndex} />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {tracks.length === 0 && (
          <div className="h-24 border-2 border-dashed border-sage-200/50 rounded-xl flex items-center justify-center text-sage-400 text-sm font-medium">
            Drag here
          </div>
        )}
      </div>
    </div>
  );
}

export const ProductionBoard: React.FC<ProductionBoardProps> = ({ tracks, onUpdateTrackStatus }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (over && active.data.current?.stageId !== over.id) {
      onUpdateTrackStatus(active.id as string, over.id as TrackStatus);
    }
  };

  const activeTrack = activeId ? tracks.find(t => t.id === activeId) : null;
  const activeStage = activeTrack ? STAGES.find(s => s.id === activeTrack.status) : null;
  const activeGlobalIndex = activeTrack ? tracks.findIndex(t => t.id === activeTrack.id) : 0;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full overflow-x-auto pb-10 hide-scrollbar">
        <div className="min-w-max flex gap-6 p-4 px-8">
          {STAGES.map((stage) => {
            const stageTracks = tracks.filter(t => t.status === stage.id);
            return <Column key={stage.id} stage={stage} tracks={stageTracks} allTracks={tracks} />;
          })}
        </div>
      </div>

      <DragOverlay>
        {activeTrack && activeStage ? (
          <div className="bg-white p-4 rounded-xl shadow-2xl border border-deepblack/10 scale-105 cursor-grabbing opacity-90 rotate-2">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="text-deepblack">
                  <GripVertical size={16} />
                </div>
                <span className="text-sage-400 font-bold text-sm w-5">{String(activeGlobalIndex + 1).padStart(2, '0')}</span>
                <h4 className="font-bold text-deepblack leading-tight">
                  {activeTrack.title || 'Untitled Track'}
                </h4>
              </div>
              {activeStage.id === 'Done' ? (
                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
              ) : (
                <Clock size={16} className="text-sage-400 flex-shrink-0" />
              )}
            </div>
            <div className="flex flex-wrap gap-2 pl-6">
              {activeTrack.bpm && (
                <span className="text-[10px] font-bold uppercase bg-sage-50 text-sage-600 px-2 py-0.5 rounded">
                  {activeTrack.bpm} BPM
                </span>
              )}
              {activeTrack.genre && (
                <span className="text-[10px] font-bold uppercase bg-sage-50 text-sage-600 px-2 py-0.5 rounded">
                  {activeTrack.genre}
                </span>
              )}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};