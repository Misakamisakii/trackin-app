import React from 'react';
import { VersionTreeCanvas } from './VersionTreeCanvas';
import { TrackVersion } from '@/types';

interface VersionTreeProps {
  trackId: string;
  versions: TrackVersion[];
  onUpdateVersions: (versions: TrackVersion[]) => void;
}

export const VersionTree: React.FC<VersionTreeProps> = ({ 
  trackId, 
  versions, 
  onUpdateVersions 
}) => {
  return (
    <VersionTreeCanvas 
      trackId={trackId}
      versions={versions}
      onUpdateVersions={onUpdateVersions}
    />
  );
};