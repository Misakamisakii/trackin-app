import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VersionTreeCanvas } from '../VersionTreeCanvas';
import { TrackVersion } from '@/types';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { 
              id: 'new-version-id', 
              name: 'V2', 
              changes: '', 
              track_id: 'track-1', 
              is_latest: true, 
              created_at: '2024-01-01' 
            },
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

describe('VersionTreeCanvas Component', () => {
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
    // Mock window.confirm
    global.confirm = vi.fn(() => true);
  });

  it('renders empty state when no versions', () => {
    render(
      <VersionTreeCanvas 
        trackId={mockTrackId}
        versions={[]}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    expect(screen.getByText('暂无版本')).toBeInTheDocument();
    expect(screen.getByText('点击左上角「创建根版本」开始')).toBeInTheDocument();
    expect(screen.getByText('创建第一个版本')).toBeInTheDocument();
  });

  it('renders version nodes when versions exist', () => {
    render(
      <VersionTreeCanvas 
        trackId={mockTrackId}
        versions={mockVersions}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    expect(screen.getByText('V1')).toBeInTheDocument();
    expect(screen.getByText('Initial version')).toBeInTheDocument();
  });

  it('shows latest version indicator', () => {
    render(
      <VersionTreeCanvas 
        trackId={mockTrackId}
        versions={mockVersions}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    expect(screen.getByText('最新')).toBeInTheDocument();
  });

  it('handles create root node', async () => {
    render(
      <VersionTreeCanvas 
        trackId={mockTrackId}
        versions={[]}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    const createButton = screen.getByText('创建第一个版本');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockOnUpdateVersions).toHaveBeenCalled();
    });
  });

  it('handles node editing', async () => {
    render(
      <VersionTreeCanvas 
        trackId={mockTrackId}
        versions={mockVersions}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('版本名称');
      const changesTextarea = screen.getByPlaceholderText('主要修改点');
      expect(nameInput).toBeInTheDocument();
      expect(changesTextarea).toBeInTheDocument();
    });
  });

  it('handles node deletion', async () => {
    render(
      <VersionTreeCanvas 
        trackId={mockTrackId}
        versions={mockVersions}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalledWith('确定要删除这个版本吗？此操作不可撤销。');
      expect(mockOnUpdateVersions).toHaveBeenCalled();
    });
  });

  it('handles file upload', async () => {
    render(
      <VersionTreeCanvas 
        trackId={mockTrackId}
        versions={mockVersions}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    const uploadButton = screen.getByText('上传音频');
    fireEvent.click(uploadButton);

    // Simulate file selection
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' });
    
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false
    });
    
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(mockOnUpdateVersions).toHaveBeenCalled();
    });
  });

  it('handles add version button', async () => {
    render(
      <VersionTreeCanvas 
        trackId={mockTrackId}
        versions={mockVersions}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    const addVersionButton = screen.getByText('添加版本');
    fireEvent.click(addVersionButton);

    await waitFor(() => {
      expect(mockOnUpdateVersions).toHaveBeenCalled();
    });
  });

  it('handles zoom controls', () => {
    render(
      <VersionTreeCanvas 
        trackId={mockTrackId}
        versions={mockVersions}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    const zoomOutButton = screen.getByText('-');
    const zoomInButton = screen.getByText('+');
    const zoomDisplay = screen.getByText('100%');

    expect(zoomOutButton).toBeInTheDocument();
    expect(zoomInButton).toBeInTheDocument();
    expect(zoomDisplay).toBeInTheDocument();

    // Test zoom out
    fireEvent.click(zoomOutButton);
    expect(screen.getByText('90%')).toBeInTheDocument();

    // Test zoom in
    fireEvent.click(zoomInButton);
    fireEvent.click(zoomInButton);
    expect(screen.getByText('110%')).toBeInTheDocument();
  });

  it('shows no audio message when audio_url is missing', () => {
    render(
      <VersionTreeCanvas 
        trackId={mockTrackId}
        versions={mockVersions}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    expect(screen.getByText('暂无音频文件')).toBeInTheDocument();
  });

  it('shows audio player when audio_url is present', () => {
    const versionWithAudio = {
      ...mockVersions[0],
      audio_url: 'https://example.com/audio.mp3'
    };

    render(
      <VersionTreeCanvas 
        trackId={mockTrackId}
        versions={[versionWithAudio]}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    const audioElement = screen.getByText('上传音频');
    expect(audioElement).toBeInTheDocument();
  });

  it('handles save and cancel in edit mode', async () => {
    render(
      <VersionTreeCanvas 
        trackId={mockTrackId}
        versions={mockVersions}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('版本名称');
      const changesTextarea = screen.getByPlaceholderText('主要修改点');
      
      fireEvent.change(nameInput, { target: { value: 'Updated V1' } });
      fireEvent.change(changesTextarea, { target: { value: 'Updated changes' } });

      const saveButton = screen.getByText('保存');
      fireEvent.click(saveButton);

      expect(mockOnUpdateVersions).toHaveBeenCalled();
    });
  });

  it('handles cancel in edit mode', async () => {
    render(
      <VersionTreeCanvas 
        trackId={mockTrackId}
        versions={mockVersions}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);

      // Should exit edit mode
      expect(screen.queryByPlaceholderText('版本名称')).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText('主要修改点')).not.toBeInTheDocument();
    });
  });

  it('handles multiple versions', () => {
    const multipleVersions = [
      ...mockVersions,
      {
        id: '2',
        track_id: mockTrackId,
        name: 'V2',
        changes: 'Second version',
        is_latest: false,
        created_at: '2024-01-02T00:00:00Z'
      },
      {
        id: '3',
        track_id: mockTrackId,
        name: 'V3',
        changes: 'Third version',
        is_latest: true,
        created_at: '2024-01-03T00:00:00Z'
      }
    ];

    render(
      <VersionTreeCanvas 
        trackId={mockTrackId}
        versions={multipleVersions}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    expect(screen.getByText('V1')).toBeInTheDocument();
    expect(screen.getByText('V2')).toBeInTheDocument();
    expect(screen.getByText('V3')).toBeInTheDocument();
    expect(screen.getByText('最新')).toBeInTheDocument();
  });

  it('handles error states gracefully', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: new Error('Database error') }))
          }))
        }))
      }))
    };

    vi.doMock('@/lib/supabase', () => ({
      supabase: mockSupabase
    }));

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <VersionTreeCanvas 
        trackId={mockTrackId}
        versions={[]}
        onUpdateVersions={mockOnUpdateVersions}
      />
    );

    const createButton = screen.getByText('创建第一个版本');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Error creating version:', expect.any(Error));
    });

    consoleError.mockRestore();
  });
});