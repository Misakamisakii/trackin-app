import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Music, FileAudio, Trash2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { supabase } from '@/lib/supabase';
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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Check if database tables exist
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const { error } = await supabase
          .from('track_versions')
          .select('*')
          .limit(1);
        
        if (error) {
          console.error('Database check failed:', error);
          alert('数据库连接失败，请检查 track_versions 表是否存在');
        } else {
          console.log('Database check successful');
        }
      } catch (err) {
        console.error('Database check exception:', err);
      }
    };
    
    checkDatabase();
  }, []);

  const addVersion = async () => {
    console.log('Adding new version for track:', trackId);
    console.log('Current versions:', versions);
    
    const newVersion: Omit<TrackVersion, 'id' | 'created_at'> = {
      track_id: trackId,
      name: `V${versions.length + 1}`,
      changes: '',
      is_latest: true,
    };

    // 将之前的最新版本标记为非最新
    const updatedVersions = versions.map(v => ({ ...v, is_latest: false }));
    
    try {
      const { data, error } = await supabase
        .from('track_versions')
        .insert(newVersion)
        .select()
        .single();

      console.log('Supabase insert result:', { data, error });

      if (data) {
        onUpdateVersions([...updatedVersions, data]);
      } else if (error) {
        console.error('Error inserting version:', error);
        alert('创建版本失败: ' + error.message);
      }
    } catch (err) {
      console.error('Exception in addVersion:', err);
      alert('创建版本时发生错误');
    }
  };

  const updateVersion = async (versionId: string, updates: Partial<TrackVersion>) => {
    await supabase
      .from('track_versions')
      .update(updates)
      .eq('id', versionId);

    const updatedVersions = versions.map(v => 
      v.id === versionId ? { ...v, ...updates } : v
    );
    onUpdateVersions(updatedVersions);
  };

  const deleteVersion = async (versionId: string) => {
    if (confirm('确定要删除这个版本吗？')) {
      await supabase
        .from('track_versions')
        .delete()
        .eq('id', versionId);

      const updatedVersions = versions.filter(v => v.id !== versionId);
      
      // 如果删除的是最新版本，将最后一个版本设为最新
      if (versions.find(v => v.id === versionId)?.is_latest && updatedVersions.length > 0) {
        const lastVersion = updatedVersions[updatedVersions.length - 1];
        await supabase
          .from('track_versions')
          .update({ is_latest: true })
          .eq('id', lastVersion.id);
        
        onUpdateVersions(updatedVersions.map(v => 
          v.id === lastVersion.id ? { ...v, is_latest: true } : v
        ));
      } else {
        onUpdateVersions(updatedVersions);
      }
    }
  };

  const uploadAudio = async (versionId: string, file: File) => {
    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${trackId}_${versionId}_${Date.now()}.${fileExt}`;
    
    const { data } = await supabase.storage
      .from('audio-files')
      .upload(fileName, file);

    if (data) {
      const { data: { publicUrl } } = supabase.storage
        .from('audio-files')
        .getPublicUrl(fileName);
      
      await updateVersion(versionId, { audio_url: publicUrl });
    }
    
    setIsUploading(false);
  };

  const handleAudioUpload = (versionId: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'audio/mpeg' || file.type === 'audio/wav' || file.type === 'audio/flac')) {
      uploadAudio(versionId, file);
    } else {
      alert('请上传 MP3、WAV 或 FLAC 格式的音频文件');
    }
  };

  return (
    <div className="mt-6 p-4 bg-white/50 rounded-xl border border-sage-200/50">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-deepblack flex items-center gap-2">
          <Music size={16} />
          版本管理
        </h4>
        <button
          onClick={() => {
            console.log('New Version button clicked');
            addVersion();
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-deepblack text-sage-50 text-xs font-bold rounded-lg hover:bg-deepblack/90 transition-colors"
        >
          <Plus size={12} />
          新版本
        </button>
      </div>

      {/* 版本树形图 */}
      <div className="space-y-3">
        {versions.map((version, index) => (
          <motion.div
            key={version.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.1 }}
            className={cn(
              "p-3 rounded-lg border transition-all",
              version.is_latest 
                ? "bg-sage-100 border-sage-300 shadow-sm" 
                : "bg-white/60 border-sage-200"
            )}
          >
            {/* 版本头部 */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                  version.is_latest 
                    ? "bg-deepblack text-sage-50" 
                    : "bg-sage-200 text-sage-600"
                )}>
                  {version.name}
                </div>
                {version.is_latest && (
                  <span className="text-xs font-medium text-sage-600 bg-sage-200 px-2 py-0.5 rounded">
                    最新
                  </span>
                )}
              </div>
              
              <button
                onClick={() => deleteVersion(version.id)}
                className="text-rose-400 hover:text-rose-600 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* 连接线（树形视觉效果） */}
            {index < versions.length - 1 && (
              <div className="absolute left-3 top-8 w-px h-4 bg-sage-300"></div>
            )}

            {/* 音频文件 */}
            <div className="mb-2">
              <label className="text-xs font-medium text-sage-600 mb-1 block">
                音频文件
              </label>
              <div className="flex items-center gap-2">
                {version.audio_url ? (
                  <>
                    <audio controls className="flex-1 h-8">
                      <source src={version.audio_url} type="audio/mpeg" />
                    </audio>
                    <button
                      onClick={() => updateVersion(version.id, { audio_url: undefined })}
                      className="text-rose-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                ) : (
                  <label className="flex items-center gap-2 px-3 py-2 bg-sage-50 rounded-lg cursor-pointer hover:bg-sage-100 transition-colors">
                    <FileAudio size={14} />
                    <span className="text-xs font-medium text-sage-600">
                      {isUploading ? '上传中...' : '上传音频'}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".mp3,.wav,.flac"
                      onChange={handleAudioUpload(version.id)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* 修改点 */}
            <div>
              <label className="text-xs font-medium text-sage-600 mb-1 block">
                主要修改点
              </label>
              <textarea
                value={version.changes}
                onChange={(e) => updateVersion(version.id, { changes: e.target.value })}
                placeholder="描述这个版本的主要修改..."
                className="w-full px-3 py-2 text-sm border border-sage-200 rounded-lg resize-none focus:ring-2 focus:ring-deepblack focus:border-deepblack outline-none"
                rows={2}
              />
            </div>

            {/* 版本连接线 */}
            <div className="relative">
              <div className="absolute left-3 top-0 w-px h-full bg-sage-300"></div>
            </div>
          </motion.div>
        ))}
      </div>

      {versions.length === 0 && (
        <div className="text-center py-8 text-sage-500">
          <Music size={24} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">暂无版本，点击"新版本"开始创建</p>
        </div>
      )}
    </div>
  );
};