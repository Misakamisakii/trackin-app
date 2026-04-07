import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VersionTree } from '../VersionTree';
import { TrackVersion } from '@/types';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { id: '1', name: 'V1', changes: '', track_id: 'track-1', is_latest: true, created_at: '2024-01-01' },
            error: null 
          }))
        }))
      })),
      update: vi.fn(() => Promise.resolve({ error: null })),
      delete: vi.fn(() => Promise.resolve({ error: null }))
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/audio.mp3' } }))
      }))
    }
  }
}));

describe('VersionTree Component', () => {
  const mockTrackId = 'track-123';
  const mockVersions: TrackVersion[] = [
    {
      id: '1',
      track_id: mockTrackId,
      name: 'V1',
      changes: 'Initial version',
      is_latest: true,
      created_at: '2024-01-01T00:00:00Z'
    }
  ];

  const mockOnUpdateVersions = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without versions', () => {
    render(
      <VersionTree 
        trackId={mockTrackId}
        versions={[]}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    expect(screen.getByText('版本树管理')).toBeInTheDocument();
    expect(screen.getByText('暂无版本，切换到画布视图创建第一个版本')).toBeInTheDocument();
  });

  it('renders with versions in list view', () => {
    render(
      <VersionTree 
        trackId={mockTrackId}
        versions={mockVersions}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    expect(screen.getByText('V1')).toBeInTheDocument();
    expect(screen.getByText('Initial version')).toBeInTheDocument();
  });

  it('switches between list and canvas views', () => {
    render(
      <VersionTree 
        trackId={mockTrackId}
        versions={mockVersions}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    // Default to canvas view
    expect(screen.getByText('列表视图')).toBeInTheDocument();
    
    // Switch to list view
    fireEvent.click(screen.getByText('列表视图'));
    expect(screen.getByText('版本名称')).toBeInTheDocument();
    
    // Switch back to canvas view
    fireEvent.click(screen.getByText('画布视图'));
    expect(screen.queryByText('版本名称')).not.toBeInTheDocument();
  });

  it('handles version name editing', () => {
    render(
      <VersionTree 
        trackId={mockTrackId}
        versions={mockVersions}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    // Switch to list view to see edit controls
    fireEvent.click(screen.getByText('列表视图'));
    
    const nameInput = screen.getByDisplayValue('V1') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'V1 Updated' } });
    
    expect(mockOnUpdateVersions).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'V1 Updated' })
    ]);
  });

  it('handles changes editing', () => {
    render(
      <VersionTree 
        trackId={mockTrackId}
        versions={mockVersions}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    // Switch to list view to see edit controls
    fireEvent.click(screen.getByText('列表视图'));
    
    const changesTextarea = screen.getByDisplayValue('Initial version') as HTMLTextAreaElement;
    fireEvent.change(changesTextarea, { target: { value: 'Updated changes' } });
    
    expect(mockOnUpdateVersions).toHaveBeenCalledWith([
      expect.objectContaining({ changes: 'Updated changes' })
    ]);
  });

  it('displays latest version indicator', () => {
    const latestVersion = { ...mockVersions[0], is_latest: true };
    
    render(
      <VersionTree 
        trackId={mockTrackId}
        versions={[latestVersion]}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    expect(screen.getByText('最新')).toBeInTheDocument();
  });

  it('handles empty versions gracefully', () => {
    render(
      <VersionTree 
        trackId={mockTrackId}
        versions={[]}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    expect(screen.getByText('暂无版本，切换到画布视图创建第一个版本')).toBeInTheDocument();
    
    // Should still have view mode buttons
    expect(screen.getByText('列表视图')).toBeInTheDocument();
    expect(screen.getByText('画布视图')).toBeInTheDocument();
  });

  it('renders audio player when audio_url is present', () => {
    const versionWithAudio = {
      ...mockVersions[0],
      audio_url: 'https://example.com/audio.mp3'
    };

    render(
      <VersionTree 
        trackId={mockTrackId}
        versions={[versionWithAudio]}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    // Switch to list view to see audio controls
    fireEvent.click(screen.getByText('列表视图'));
    
    const audioElement = screen.getByText('音频预览');
    expect(audioElement).toBeInTheDocument();
  });

  it('shows no audio message when audio_url is missing', () => {
    render(
      <VersionTree 
        trackId={mockTrackId}
        versions={mockVersions}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    // Switch to list view to see audio status
    fireEvent.click(screen.getByText('列表视图'));
    
    expect(screen.getByText('暂无音频文件')).toBeInTheDocument();
  });

  it('maintains proper TypeScript typing', () => {
    // This test ensures the component accepts correct props
    const { rerender } = render(
      <VersionTree 
        trackId={mockTrackId}
        versions={mockVersions}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    // Should work with empty array
    rerender(
      <VersionTree 
        trackId={mockTrackId}
        versions={[]}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    // Should work with multiple versions
    const multipleVersions = [
      ...mockVersions,
      {
        id: '2',
        track_id: mockTrackId,
        name: 'V2',
        changes: 'Second version',
        is_latest: false,
        created_at: '2024-01-02T00:00:00Z'
      }
    ];

    rerender(
      <VersionTree 
        trackId={mockTrackId}
        versions={multipleVersions}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    expect(screen.getByText('V1')).toBeInTheDocument();
    expect(screen.getByText('V2')).toBeInTheDocument();
  });
});