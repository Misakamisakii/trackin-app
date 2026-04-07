import React, { useState } from 'react';
import { Track } from '@/types';
import { VersionTreeCanvas } from './VersionTreeCanvas';
import { cn } from '@/utils/cn';
import { Music, Disc3 } from 'lucide-react';

interface VersionViewProps {
  tracks: Track[];
  onUpdateTrack: (id: string, updates: Partial<Track>) => void;
}

export const VersionView: React.FC<VersionViewProps> = ({ tracks, onUpdateTrack }) => {
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(tracks.length > 0 ? tracks[0].id : null);

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-sage-400">
        <Disc3 size={64} className="mb-4 opacity-50" />
        <h3 className="text-xl font-bold text-deepblack mb-2">暂无单曲</h3>
        <p>请先在 Metadata 视图中添加单曲</p>
      </div>
    );
  }

  const selectedTrack = tracks.find(t => t.id === selectedTrackId);

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[600px]">
      {/* 侧边栏：单曲列表 */}
      <div className="w-full md:w-64 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm overflow-y-auto shrink-0 p-4">
        <h3 className="text-sm font-bold text-sage-600 uppercase tracking-wider mb-4 px-2">单曲列表</h3>
        <div className="space-y-2">
          {tracks.map((track, index) => (
            <button
              key={track.id}
              onClick={() => setSelectedTrackId(track.id)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3",
                selectedTrackId === track.id 
                  ? "bg-deepblack text-sage-50 shadow-md" 
                  : "hover:bg-white/80 text-deepblack"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                selectedTrackId === track.id ? "bg-sage-50 text-deepblack" : "bg-sage-200 text-sage-600"
              )}>
                {index + 1}
              </div>
              <span className="font-medium truncate">
                {track.title || 'Untitled Track'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 主视图：版本画布 */}
      <div className="flex-1 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm overflow-hidden">
        {selectedTrack ? (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-sage-200/50 flex items-center gap-3">
              <Music className="text-sage-500" size={20} />
              <h2 className="text-lg font-bold text-deepblack">
                {selectedTrack.title || 'Untitled Track'} <span className="text-sage-400 font-normal">版本树</span>
              </h2>
            </div>
            <div className="flex-1">
              <VersionTreeCanvas 
                trackId={selectedTrack.id}
                versions={selectedTrack.versions || []}
                onUpdateVersions={(versions) => onUpdateTrack(selectedTrack.id, { versions })}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-sage-400">
            请选择一首单曲查看其版本树
          </div>
        )}
      </div>
    </div>
  );
};
