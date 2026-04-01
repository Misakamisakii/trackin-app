export type TrackStatus = 'Demo' | 'Arrangement' | 'Recording' | 'Mixing' | 'Mastering' | 'Done';

export type ProjectCategory = 'Album' | 'EP' | 'Single' | 'Beattape';

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
