import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useJamStore } from '../store/useJamStore';
import { JamReaction } from '../types/jam.types';

export const REACTION_EMOJIS = ['🔥', '❤️', '😂', '🎵', '💀', '✨', '🫶'] as const;

interface FloatingItem extends JamReaction {
  xOffset: number;
}

export const JamReactions: React.FC = () => {
  const { room, sendReaction } = useJamStore();
  const [floatingItems, setFloatingItems] = useState<FloatingItem[]>([]);

  // When room reactions update, add new ones to floating animation queue
  useEffect(() => {
    if (!room?.reactions || room.reactions.length === 0) return;

    const latest = room.reactions[room.reactions.length - 1];
    if (!latest) return;

    const now = Date.now();
    // Only animate if sent within the last 3 seconds
    if (now - latest.timestamp < 3000) {
      const newItem: FloatingItem = {
        ...latest,
        xOffset: (Math.random() - 0.5) * 160,
      };

      setFloatingItems((prev) => [...prev.slice(-15), newItem]);

      // Remove after animation completes
      const timer = setTimeout(() => {
        setFloatingItems((prev) => prev.filter((item) => item.id !== latest.id));
      }, 2600);

      return () => clearTimeout(timer);
    }
  }, [room?.reactions]);

  return (
    <>
      {/* Floating Canvas Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
        <AnimatePresence>
          {floatingItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 40, scale: 0.5, x: item.xOffset }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: -220,
                scale: [0.5, 1.3, 1.1, 0.8],
                x: item.xOffset + (Math.random() - 0.5) * 40,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.4, ease: 'easeOut' }}
              className="absolute bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 shadow-2xl"
            >
              <img
                src={item.userAvatar}
                alt={item.userName}
                className="w-4 h-4 rounded-full object-cover"
              />
              <span className="text-xl select-none">{item.emoji}</span>
              <span className="text-[10px] font-medium text-slate-300 max-w-[80px] truncate">
                {item.userName}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Interactive Reaction Quick Bar */}
      <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 shadow-xl">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            aria-label={`React with ${emoji}`}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-lg sm:text-xl hover:scale-125 active:scale-95 transition-transform duration-150 cursor-pointer bg-white/5 hover:bg-white/15"
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
};
