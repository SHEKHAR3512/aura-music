import React, { useState, useEffect } from 'react';
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
import {
  GripVertical,
  Trash2,
  Plus,
  Play,
  Sparkles,
  FastForward,
  Music,
  Check,
} from 'lucide-react';
import { useJamStore } from '../store/useJamStore';
import { JamQueueItem } from '../types/jam.types';
import { GroupRecommendationEngine, GroupRecommendation } from '../recommendations/GroupRecommendationEngine';
import { Song } from '../../../lib/music/types';

interface SortableQueueItemProps {
  item: JamQueueItem;
  index: number;
  canReorder: boolean;
  canDelete: boolean;
  onDelete: (id: string) => void;
  onPlay?: (track: Song) => void;
}

const SortableQueueRow: React.FC<SortableQueueItemProps> = ({
  item,
  index,
  canReorder,
  canDelete,
  onDelete,
  onPlay,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !canReorder,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-colors group"
    >
      {/* Drag Grip Handle */}
      {canReorder ? (
        <button
          {...attributes}
          {...listeners}
          aria-label="Reorder queue item"
          className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-white p-0.5 touch-none"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      ) : (
        <span className="w-3.5 text-center text-[10px] font-mono text-slate-500">
          {index + 1}
        </span>
      )}

      {/* Artwork with Play on click */}
      <div
        onClick={() => onPlay && onPlay(item.track)}
        className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-white/10 cursor-pointer group/art"
      >
        <img
          src={item.track.artwork.low || item.track.artwork.medium}
          alt={item.track.title}
          className="w-full h-full object-cover"
        />
        {onPlay && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/art:opacity-100 flex items-center justify-center transition-opacity">
            <Play className="w-3.5 h-3.5 text-white fill-current" />
          </div>
        )}
      </div>

      {/* Details (Click to play) */}
      <div
        onClick={() => onPlay && onPlay(item.track)}
        className="flex-1 min-w-0 cursor-pointer"
      >
        <h5 className="text-xs font-semibold text-white truncate hover:text-[var(--aura-primary,#6366f1)] transition-colors">
          {item.track.title}
        </h5>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span className="truncate max-w-[110px]">{item.track.primaryArtist}</span>
          <span>•</span>
          <span className="text-slate-400 truncate max-w-[80px]">
            added by {item.addedBy.displayName}
          </span>
        </div>
      </div>

      {/* Remove Button */}
      {canDelete && (
        <button
          onClick={() => onDelete(item.id)}
          aria-label="Remove track from queue"
          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export const JamQueue: React.FC<{ onOpenSearch?: () => void }> = ({ onOpenSearch }) => {
  const {
    room,
    userId,
    playTrack,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    voteToSkip,
    roomDNA,
  } = useJamStore();

  const [recommendations, setRecommendations] = useState<GroupRecommendation[]>([]);
  const [smartQueueExpanded, setSmartQueueExpanded] = useState(false);
  const [voted, setVoted] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const queue = room?.queue || [];
  const isHost = room?.metadata.hostId === userId;
  const canReorder = isHost || room?.settings?.allowGuestReorder !== false;
  const canQueue = isHost || room?.settings?.allowGuestQueue !== false;

  // Load Smart Queue recommendations
  useEffect(() => {
    if (!room) return;
    const participantsList = Object.values(room.participants || {});
    GroupRecommendationEngine.getRecommendations(
      room.playback.track,
      queue.map((q) => q.track),
      participantsList,
      roomDNA || undefined
    ).then(setRecommendations);
  }, [room?.playback.track?.id, queue.length, roomDNA]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = queue.findIndex((q) => q.id === active.id);
    const newIndex = queue.findIndex((q) => q.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      reorderQueue(oldIndex, newIndex);
    }
  };

  const handleVoteSkip = () => {
    voteToSkip();
    setVoted(true);
    setTimeout(() => setVoted(false), 3000);
  };

  const onlineCount = Object.values(room?.participants || {}).filter((p) => p.isOnline).length;
  const votesNeeded = Math.ceil((Math.max(1, onlineCount) * (room?.settings.voteSkipThresholdPercent || 50)) / 100);
  const currentVotes = room?.skipVotes?.length || 0;

  return (
    <div className="w-full space-y-4">
      {/* Header & Controls */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Up Next ({queue.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Vote to Skip Pill */}
          <button
            onClick={handleVoteSkip}
            disabled={voted}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-60"
            title="Vote to skip current song"
          >
            <FastForward className="w-3 h-3 text-amber-400" />
            <span>
              {voted ? 'Voted' : 'Vote Skip'}{' '}
              <strong className="text-white font-mono">
                ({currentVotes}/{votesNeeded})
              </strong>
            </span>
          </button>

          {/* Add Song Button */}
          {canQueue && onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--aura-primary,#6366f1)] hover:bg-[var(--aura-primary,#6366f1)]/90 text-white text-[11px] font-bold shadow-md transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Song</span>
            </button>
          )}
        </div>
      </div>

      {/* DND-Kit Collaborative Sortable Queue */}
      {queue.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={queue.map((q) => q.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5 max-h-[340px] overflow-y-auto no-scrollbar">
              {queue.map((item, index) => (
                <SortableQueueRow
                  key={item.id}
                  item={item}
                  index={index}
                  canReorder={canReorder}
                  canDelete={isHost || item.addedBy.id === userId}
                  onDelete={removeFromQueue}
                  onPlay={playTrack}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="p-6 text-center rounded-2xl bg-white/[0.02] border border-dashed border-white/10 space-y-3">
          <Music className="w-8 h-8 text-slate-600 mx-auto" />
          <div>
            <h5 className="text-xs font-semibold text-slate-300">The Queue is Empty</h5>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-0.5">
              Add your favorite tracks or pick an intelligent group recommendation below.
            </p>
          </div>
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--aura-primary,#6366f1)] hover:bg-[var(--aura-primary,#6366f1)]/90 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Search & Add Songs</span>
            </button>
          )}
        </div>
      )}

      {/* Smart Continuation / Group Recommendation Engine */}
      <div className="pt-2 border-t border-white/5 space-y-2">
        <button
          onClick={() => setSmartQueueExpanded(!smartQueueExpanded)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--aura-primary,#6366f1)] animate-pulse" />
            <span>Smart Queue Recommendations</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {smartQueueExpanded ? 'Hide' : `Show (${recommendations.length})`}
          </span>
        </button>

        {smartQueueExpanded && (
          <div className="space-y-1.5 pt-1 max-h-[220px] overflow-y-auto no-scrollbar animate-fadeIn">
            {recommendations.slice(0, 5).map((rec) => (
              <div
                key={rec.song.id}
                className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={rec.song.artwork.low || rec.song.artwork.medium}
                    alt={rec.song.title}
                    className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0"
                  />
                  <div className="min-w-0">
                    <h6 className="font-semibold text-white truncate text-[11px]">
                      {rec.song.title}
                    </h6>
                    <p className="text-[10px] text-slate-400 truncate">{rec.explanation}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    onClick={() => playTrack(rec.song)}
                    className="p-1 rounded-lg bg-[var(--aura-primary,#6366f1)] hover:opacity-90 text-white transition-opacity cursor-pointer"
                    title="Play track now"
                  >
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                  <button
                    onClick={() => addToQueue(rec.song)}
                    className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-200 text-[10px] font-bold border border-white/10 transition-colors cursor-pointer"
                  >
                    + Queue
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
