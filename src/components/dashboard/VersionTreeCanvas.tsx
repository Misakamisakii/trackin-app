import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, FileAudio, ArrowRight, Play, Pause } from 'lucide-react';
import { cn } from '@/utils/cn';
import { supabase } from '@/lib/supabase';
import { TrackVersion } from '@/types';

interface NodePosition {
  x: number;
  y: number;
}

interface VersionNode extends TrackVersion {
  position: NodePosition;
  childrenIds: string[];
}

interface VersionTreeCanvasProps {
  trackId: string;
  versions: TrackVersion[];
  onUpdateVersions: (versions: TrackVersion[]) => void;
}

export const VersionTreeCanvas: React.FC<VersionTreeCanvasProps> = ({
  trackId,
  versions,
  onUpdateVersions
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<VersionNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanDragging, setIsPanDragging] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [nodeDragStart, setNodeDragStart] = useState({ x: 0, y: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [playingNodeId, setPlayingNodeId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 自动布局算法：生成美观的树形结构
  const buildLayout = useCallback((versionsList: TrackVersion[]) => {
    const nodeMap = new Map<string, VersionNode>();
    
    // 初始化节点
    versionsList.forEach(v => {
      nodeMap.set(v.id, { ...v, position: { x: 0, y: 0 }, childrenIds: [] });
    });
    
    // 建立父子关系
    versionsList.forEach(v => {
      if (v.parent_id && nodeMap.has(v.parent_id)) {
        nodeMap.get(v.parent_id)!.childrenIds.push(v.id);
      }
    });

    // 找到所有根节点（没有 parent_id 或 parent_id 不在列表中）
    const roots = versionsList.filter(v => !v.parent_id || !nodeMap.has(v.parent_id));

    // 计算位置
    let currentY = 80;
    const X_OFFSET = 320;
    const Y_OFFSET = 180;

    const layoutNode = (nodeId: string, depth: number): number => {
      const node = nodeMap.get(nodeId);
      if (!node) return 0;
      
      if (node.childrenIds.length === 0) {
        node.position = { x: 80 + depth * X_OFFSET, y: currentY };
        currentY += Y_OFFSET;
        return node.position.y;
      }

      // 递归计算子节点，并将当前节点放置在子节点的中间
      const childYPositions = node.childrenIds.map(childId => layoutNode(childId, depth + 1));
      const avgY = childYPositions.reduce((sum, y) => sum + y, 0) / childYPositions.length;
      
      node.position = { x: 80 + depth * X_OFFSET, y: avgY };
      return avgY;
    };

    roots.forEach(r => layoutNode(r.id, 0));

    return Array.from(nodeMap.values());
  }, []);

  // 监听 versions 变化，更新节点
  useEffect(() => {
    setNodes(buildLayout(versions));
  }, [versions, buildLayout]);

  // 创建新版本节点（作为某个节点的子节点）
  const createVersionNode = async (parentId?: string) => {
    try {
      const newVersionNumber = versions.length + 1;
      
      const newVersion: Omit<TrackVersion, 'id' | 'created_at'> = {
        track_id: trackId,
        name: `V${newVersionNumber}`,
        changes: '',
        is_latest: true,
        parent_id: parentId, // 关联父节点
      };

      // 更新现有版本的is_latest状态
      if (versions.length > 0) {
        await supabase
          .from('track_versions')
          .update({ is_latest: false })
          .eq('track_id', trackId)
          .eq('is_latest', true);
      }

      const { data, error } = await supabase
        .from('track_versions')
        .insert(newVersion)
        .select()
        .single();

      if (error) {
        console.error('Error creating version:', error);
        return;
      }

      if (data) {
        const updatedVersions = [...versions.map(v => ({ ...v, is_latest: false })), data];
        onUpdateVersions(updatedVersions);
        // 新建后自动选中新节点
        setSelectedNodeId(data.id);
      }
    } catch (error) {
      console.error('Error in createVersionNode:', error);
    }
  };

  // 删除节点
  const deleteNode = async (nodeId: string) => {
    if (confirm('确定要删除这个版本吗？此操作不可撤销。')) {
      try {
        await supabase
          .from('track_versions')
          .delete()
          .eq('id', nodeId);

        const updatedVersions = versions.filter(v => v.id !== nodeId);
        onUpdateVersions(updatedVersions);
        if (selectedNodeId === nodeId) setSelectedNodeId(null);
      } catch (error) {
        console.error('Error deleting version:', error);
      }
    }
  };

  // 更新节点信息（本地与远端）
  const updateNode = async (nodeId: string, updates: Partial<TrackVersion>) => {
    try {
      await supabase
        .from('track_versions')
        .update(updates)
        .eq('id', nodeId);

      const updatedVersions = versions.map(v => 
        v.id === nodeId ? { ...v, ...updates } : v
      );
      onUpdateVersions(updatedVersions);
    } catch (error) {
      console.error('Error updating version:', error);
    }
  };

  const updateNodeLocal = (nodeId: string, updates: Partial<TrackVersion>) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, ...updates } : n));
  };

  // 画布平移控制
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('.version-node')) return;
    setIsPanDragging(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    setSelectedNodeId(null); // 点击空白处取消选中
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanDragging) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (draggingNodeId) {
      setNodes(prev => prev.map(node => {
        if (node.id === draggingNodeId) {
          return {
            ...node,
            position: {
              x: (e.clientX - nodeDragStart.x) / scale - pan.x / scale,
              y: (e.clientY - nodeDragStart.y) / scale - pan.y / scale
            }
          };
        }
        return node;
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanDragging(false);
    setDraggingNodeId(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setDraggingNodeId(nodeId);
    
    // Calculate the offset between mouse position and node top-left corner
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setNodeDragStart({
        x: e.clientX - (node.position.x * scale + pan.x),
        y: e.clientY - (node.position.y * scale + pan.y)
      });
    }
  };

  // 处理滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return; // 允许正常页面滚动
    e.preventDefault();
    // 限制缩放比例在 0.2 到 2 之间
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.2, Math.min(2, prev * delta)));
  };

  // 处理文件上传
  const handleFileUpload = async (nodeId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      const fileName = `${trackId}/${nodeId}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('audio-files')
        .getPublicUrl(fileName);

      await updateNode(nodeId, { audio_url: publicUrl });
    } catch (error) {
      console.error('Error in handleFileUpload:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // 播放控制
  const togglePlay = (nodeId: string, url?: string) => {
    if (!url) return;
    
    if (playingNodeId === nodeId) {
      if (audioRef.current) {
        if (audioRef.current.paused) {
          audioRef.current.play();
        } else {
          audioRef.current.pause();
        }
      }
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlayingNodeId(nodeId);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setPlaybackProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setPlaybackDuration(audioRef.current.duration);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setPlaybackProgress(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const m = Math.floor(timeInSeconds / 60);
    const s = Math.floor(timeInSeconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleDeleteAudio = async (nodeId: string) => {
    if (confirm('确定要删除此版本的音频吗？')) {
      try {
        if (playingNodeId === nodeId) {
          audioRef.current?.pause();
          setPlayingNodeId(null);
        }
        await updateNode(nodeId, { audio_url: '' });
      } catch (error) {
        console.error('Error deleting audio:', error);
      }
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => {
        setPlayingNodeId(null);
        setPlaybackProgress(0);
      };
    }
  }, []);

  // 生成优雅的贝塞尔曲线路径
  const generateBezierPath = (startX: number, startY: number, endX: number, endY: number) => {
    const controlPointX = startX + (endX - startX) / 2;
    return `M ${startX} ${startY} C ${controlPointX} ${startY}, ${controlPointX} ${endY}, ${endX} ${endY}`;
  };

  // 渲染连线 
  const renderConnections = () => {
    return nodes.map(node => {
      if (node.childrenIds.length === 0) return null;
      
      return node.childrenIds.map(childId => {
        const childNode = nodes.find(n => n.id === childId);
        if (!childNode) return null;

        // 节点的宽高：w-64 (256px), h-32 (128px)
        const startX = node.position.x + 256;
        const startY = node.position.y + 64;
        const endX = childNode.position.x;
        const endY = childNode.position.y + 64;

        const isActive = selectedNodeId === node.id || selectedNodeId === childId;

        return (
          <path
            key={`${node.id}-${childId}`}
            d={generateBezierPath(startX, startY, endX, endY)}
            fill="none"
            stroke={isActive ? "#3b82f6" : "#cbd5e1"}
            strokeWidth={isActive ? "3" : "2"}
            className="transition-all duration-300"
            markerEnd={isActive ? "url(#arrowhead-active)" : "url(#arrowhead)"}
          />
        );
      });
    });
  };

  return (
    <div className="relative w-full h-full bg-[#f8fafc] overflow-hidden" 
         style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      
      {/* 隐藏的音频播放器 */}
      <audio 
        ref={audioRef} 
        className="hidden" 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* 工具栏 */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        {nodes.length === 0 && (
          <button
            onClick={() => createVersionNode()}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95"
          >
            <Plus size={18} />
            创建初始版本
          </button>
        )}
        
        <div className="flex items-center gap-1 px-3 py-2 bg-white/90 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setScale(prev => Math.max(0.2, prev - 0.1))}
            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-medium"
          >
            -
          </button>
          <span className="text-sm font-bold text-slate-700 min-w-[48px] text-center tracking-wider">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(prev => Math.min(2, prev + 0.1))}
            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-medium"
          >
            +
          </button>
          <div className="w-px h-4 bg-slate-200 mx-2"></div>
          <button
            onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }}
            className="px-2 py-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest"
          >
            重置
          </button>
        </div>
      </div>

      {/* SVG 定义箭头 */}
      <svg className="absolute" width="0" height="0">
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#cbd5e1" />
          </marker>
          <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
          </marker>
        </defs>
      </svg>

      {/* 画布区域 */}
      <div
        ref={canvasRef}
        className={cn(
          "w-full h-full transform-gpu",
          isPanDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="absolute origin-top-left"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          }}
        >
          {/* 渲染连线 */}
          <svg className="absolute inset-0 overflow-visible pointer-events-none">
            {renderConnections()}
          </svg>

          {/* 渲染节点 */}
          {nodes.map(node => {
            const isSelected = selectedNodeId === node.id;
            const isPlaying = playingNodeId === node.id;

            return (
              <div
                key={node.id}
                className="absolute version-node group"
                style={{
                  left: node.position.x,
                  top: node.position.y,
                }}
              >
                {/* 节点主体卡片 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  className={cn(
                    "w-64 h-32 bg-white rounded-xl transition-all duration-200 flex flex-col cursor-pointer relative z-10",
                    isSelected 
                      ? "border-2 border-blue-500 shadow-xl shadow-blue-500/20 ring-4 ring-blue-50" 
                      : "border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md"
                  )}
                >
                  {/* 选中状态时的四个角控制点 (纯视觉效果) */}
                  {isSelected && (
                    <>
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm"></div>
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm"></div>
                      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm"></div>
                      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-sm"></div>
                    </>
                  )}

                  <>
                    {/* 卡片头部 */}
                    <div className="px-4 pt-4 pb-2 flex items-start justify-between border-b border-slate-100">
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            value={node.name}
                            onChange={(e) => updateNodeLocal(node.id, { name: e.target.value })}
                            onBlur={(e) => updateNode(node.id, { name: e.target.value })}
                            className="font-extrabold text-slate-800 tracking-tight bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 -ml-1 w-full"
                            placeholder="版本名称"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          />
                          {node.is_latest && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-full shrink-0">
                              Latest
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium mt-0.5 px-1">
                          {new Date(node.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* 卡片内容：修改点 */}
                    <div className="px-4 py-2 flex-1 flex">
                      <textarea
                        value={node.changes || ''}
                        onChange={(e) => updateNodeLocal(node.id, { changes: e.target.value })}
                        onBlur={(e) => updateNode(node.id, { changes: e.target.value })}
                        className="text-xs text-slate-600 leading-relaxed bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 -ml-1 w-full resize-none placeholder:text-slate-400 placeholder:italic"
                        placeholder="点击输入主要修改点..."
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* 卡片底部：音频操作 */}
                    <div className="px-4 py-2.5 bg-slate-50 rounded-b-xl flex flex-col justify-center border-t border-slate-100 min-h-[44px]">
                      {node.audio_url ? (
                        <div className="flex flex-col gap-1.5 w-full" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => togglePlay(node.id, node.audio_url)}
                              className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors"
                            >
                              <div className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center text-white transition-colors",
                                isPlaying && !audioRef.current?.paused ? "bg-blue-500" : "bg-slate-800"
                              )}>
                                {isPlaying && !audioRef.current?.paused ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" className="ml-0.5" />}
                              </div>
                              <span className="w-16 text-left">{isPlaying ? formatTime(playbackProgress) : 'Play'}</span>
                            </button>

                            <div className="flex items-center gap-2">
                              {isPlaying && (
                                <span className="text-[10px] font-medium text-slate-400">
                                  {formatTime(playbackDuration)}
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteAudio(node.id)}
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="删除音频"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          
                          {/* 播放进度条 */}
                          {isPlaying && (
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden relative group/slider">
                              <div 
                                className="absolute top-0 left-0 h-full bg-blue-500 rounded-full pointer-events-none"
                                style={{ width: `${(playbackProgress / playbackDuration) * 100 || 0}%` }}
                              />
                              <input
                                type="range"
                                min="0"
                                max={playbackDuration || 100}
                                value={playbackProgress}
                                onChange={handleProgressChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative flex items-center justify-between w-full" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
                          <button className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-500 transition-colors">
                            <FileAudio size={14} />
                            {isUploading && selectedNodeId === node.id ? 'Uploading...' : 'Upload Audio'}
                          </button>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => handleFileUpload(node.id, e)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            title="Upload audio file"
                          />
                        </div>
                      )}
                    </div>
                  </>
                </motion.div>

                {/* 添加子节点按钮 - 仅在选中时显示 */}
                {isSelected && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.5, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      createVersionNode(node.id);
                    }}
                    className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 hover:bg-blue-600 hover:scale-110 active:scale-95 transition-all z-20 group/btn"
                    title="添加分支版本"
                  >
                    <ArrowRight size={12} strokeWidth={3} className="group-hover/btn:translate-x-0.5 transition-transform" />
                  </motion.button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
