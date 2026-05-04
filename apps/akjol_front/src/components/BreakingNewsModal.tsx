/**
 * src/components/BreakingNewsModal.tsx
 *
 * Modale "BREAKING NEWS" affichée lors d'événements aléatoires
 * Style inspiré des notifications de jeux AAA
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { RandomEvent } from '../types';
import {
  formatEventEffects,
  getEventTypeColor,
  getRarityColor,
  getRarityText
} from '../services/eventService';
import { X, Zap } from 'lucide-react';

interface BreakingNewsModalProps {
  isOpen: boolean;
  event: RandomEvent;
  onClose: () => void;
}

export default function BreakingNewsModal({
  isOpen,
  event,
  onClose
}: BreakingNewsModalProps) {
  const effects = formatEventEffects(event.effect);
  const typeColor = getEventTypeColor(event.type);
  const rarityColor = getRarityColor(event.rarity);
  const rarityText = getRarityText(event.rarity);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay avec blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modale */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-white dark:bg-[#27272A] rounded-2xl shadow-2xl border-2 border-[#E2E8F0] dark:border-[#27272A] max-w-2xl w-full overflow-hidden pointer-events-auto transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header avec gradient */}
              <div className={`bg-gradient-to-r ${typeColor} p-6 relative overflow-hidden`}>
                {/* Effet de brillance animé */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                />

                {/* Bouton fermer */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors z-10"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                {/* Breaking News Badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="flex items-center gap-2 mb-2"
                >
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
                    <Zap className="w-5 h-5 text-yellow-300 animate-pulse" fill="currentColor" />
                    <span className="text-white font-bold text-sm uppercase tracking-wider">
                      Breaking News
                    </span>
                  </div>

                  {/* Badge de rareté */}
                  <span className={`${rarityColor} font-bold text-sm`}>
                    {rarityText}
                  </span>
                </motion.div>

                {/* Icon avec animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
                  className="text-6xl mb-4"
                >
                  {event.icon}
                </motion.div>

                {/* Titre */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl md:text-4xl font-bold text-white mb-2"
                >
                  {event.title}
                </motion.h2>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Description */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed"
                >
                  {event.description}
                </motion.p>

                {/* Effets */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <h3 className="text-gray-900 dark:text-[#F3F4F6] font-semibold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Effets Immédiats
                  </h3>
                  <div className="space-y-2">
                    {effects.map((effect, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg
                          ${event.type === 'positive' ? 'bg-green-500/10 border border-green-500/30' : ''}
                          ${event.type === 'negative' ? 'bg-red-500/10 border border-red-500/30' : ''}
                          ${event.type === 'neutral' ? 'bg-blue-500/10 border border-blue-500/30' : ''}
                        `}
                      >
                        <div
                          className={`
                            w-2 h-2 rounded-full
                            ${event.type === 'positive' ? 'bg-green-400' : ''}
                            ${event.type === 'negative' ? 'bg-red-400' : ''}
                            ${event.type === 'neutral' ? 'bg-blue-400' : ''}
                          `}
                        />
                        <span className="text-gray-900 dark:text-[#F3F4F6] font-medium">{effect}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Bouton de confirmation */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  onClick={onClose}
                  className={`
                    w-full py-4 rounded-xl font-bold text-white text-lg
                    bg-gradient-to-r ${typeColor}
                    hover:scale-[1.02] active:scale-[0.98]
                    transition-transform shadow-lg
                  `}
                >
                  Continuer mon parcours
                </motion.button>
              </div>

              {/* Footer avec probabilité (dev info) */}
              {import.meta.env.DEV && (
                <div className="px-6 pb-4">
                  <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    Probabilité: {(event.probability * 100).toFixed(2)}% • Type: {event.type} • Rareté: {event.rarity}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
