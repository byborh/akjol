/**
 * src/components/NodeCard.tsx
 * 
 * Card pour afficher un Node (Bac, Étude, Métier)
 * Design style Pinterest/Canva : minimaliste et élégant
 * Avec animations fluides Framer Motion
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { Node } from '../types';
import SuccessGauge from './SuccessGauge';

interface NodeCardProps {
  node: Node;
  onClick?: () => void;
  isActive?: boolean;
  showArrow?: boolean;
  variant?: 'compact' | 'expanded';
  animationDelay?: number;
  successProbability?: number; // 0-1, optionnel
  riskLevel?: 'safe' | 'medium' | 'risky'; // optionnel
}

export const NodeCard: React.FC<NodeCardProps> = ({
  node,
  onClick,
  isActive = false,
  showArrow = true,
  variant = 'compact',
  animationDelay = 0,
  successProbability,
  riskLevel
}) => {
  const baseClasses =
    'rounded-lg border-2 border-transparent transition-all cursor-pointer relative overflow-hidden group';

  const sizeClasses = variant === 'expanded' ? 'p-4 md:p-6 w-full' : 'p-3 md:p-4 w-full';

  // Utilise les couleurs du thème 60-30-10 : surfaces (30%) avec accent violet (10%)
  const bgClass = 'bg-[#E2E8F0] dark:bg-[#27272A] hover:bg-[#8B5CF6]/90 dark:hover:bg-[#8B5CF6]/90 transition-colors duration-200';

  const hoverClasses = isActive
    ? 'ring-4 ring-[#8B5CF6] shadow-2xl'
    : 'shadow-md hover:shadow-lg';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.4, delay: animationDelay * 0.05 }}
      whileHover={{ scale: isActive ? 1.05 : 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses} ${bgClass} ${hoverClasses} text-gray-900 dark:text-[#F3F4F6]`}
    >
      {/* Overlay violet accent au hover */}
      <motion.div
        className="absolute inset-0 bg-[#8B5CF6]/0 group-hover:bg-[#8B5CF6]/10 pointer-events-none transition-colors duration-200"
        whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
      />

      {/* Contenu */}
      <div className="relative z-10">
        {/* Icon + Type Badge */}
        <motion.div className="flex items-center justify-between mb-2 md:mb-3" whileHover={{ x: 4 }}>
          <motion.span
            className="text-xl md:text-2xl"
            animate={isActive ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.5 }}
          >
            {node.icon || '📌'}
          </motion.span>
          <motion.span
            className="text-xs bg-[#8B5CF6]/20 dark:bg-[#8B5CF6]/30 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full font-semibold text-[#8B5CF6] dark:text-[#C4B5FD]"
            whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.3)' }}
          >
            {node.type}
          </motion.span>
        </motion.div>

        {/* Titre */}
        <h3 className="text-base md:text-lg font-bold mb-1 md:mb-2 line-clamp-2 group-hover:line-clamp-none">
          {node.title}
        </h3>

        {/* Description */}
        {variant === 'expanded' && (
          <motion.p
            className="text-xs md:text-sm text-gray-700 dark:text-gray-300 mb-3 md:mb-4 line-clamp-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: animationDelay * 0.05 + 0.1 }}
          >
            {node.description}
          </motion.p>
        )}  

        {/* Metadata mini display */}
        {variant === 'expanded' && node.metadata && (
          <motion.div
            className="grid grid-cols-2 gap-1.5 md:gap-2 mb-3 md:mb-4 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.05, delayChildren: 0.1 }}
          >
            {Object.entries(node.metadata)
              .slice(0, 4)
              .map(([key, value]) => (
                <motion.div
                  key={key}
                  className="bg-[#F8F9FA] dark:bg-[#121212] rounded p-1.5 md:p-2 text-xs border border-[#E2E8F0] dark:border-[#27272A]"
                  whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                >
                  <span className="font-semibold text-gray-900 dark:text-[#F3F4F6]">{key}:</span>
                  <span className="text-gray-700 dark:text-gray-300 hidden md:inline"> {String(value).substring(0, 15)}</span>
                </motion.div>
              ))}
          </motion.div>
        )}

        {/* Jauge de Risque / Probabilité de succès */}
        {successProbability !== undefined && riskLevel && (
          <div className="mb-3 md:mb-4">
            <SuccessGauge
              probability={successProbability}
              showLabel={variant === 'expanded'}
              showPercentage={true}
              size={variant === 'expanded' ? 'sm' : 'sm'}
              variant="bar"
            />
          </div>
        )}

        {/* Arrow indicator */}
        {showArrow && (
          <motion.div
            className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-semibold mt-2 md:mt-3 opacity-0 group-hover:opacity-100"
            whileHover={{ x: 4 }}
          >
            <span className="hidden md:inline">Voir plus</span>
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ArrowRight size={14} className="md:w-4 md:h-4" />
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Active indicator avec animation pulse */}
      {isActive && (
        <motion.div
          className="absolute top-2 right-2 w-3 h-3 rounded-full bg-white/80"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};

export default NodeCard;
