export type TrackStatus = 'Demo' | 'Arrangement' | 'Recording' | 'Mixing' | 'Mastering' | 'Done';
export type ProjectCategory = 'Album' | 'EP' | 'Single' | 'Beattape';

export interface TrackVersion {
  id: string;
  track_id: string;
  name: string;           // V1, V2, etc.
  audio_url?: string;     // MP3/WAV/FLAC file URL
  changes: string;      // What was modified in this version
  is_latest: boolean;     // Highlight this version
  created_at: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  lyricist: string;
  composer: string;
  sampleSource: string;
  bpm: number | '';
  genre: string;
  status: TrackStatus;
  order?: number;
  versions: TrackVersion[];  // Version tree
}

export interface Project {
  id: string;
  title: string;
  artist: string;
  category: ProjectCategory;
  genre: string;
  introduction: string;
  coverUrl?: string;
  tracks: Track[];
}