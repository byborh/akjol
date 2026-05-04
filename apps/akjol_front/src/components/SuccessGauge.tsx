/**
 * src/components/SuccessGauge.tsx
 *
 * Affiche une jauge visuelle du niveau de risque / probabilité de succès
 * Couleurs: Vert (safe) → Orange (medium) → Rouge (risky)
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  getProbabilityMetrics,
  getRiskLevelText,
  getColorForRiskLevel
} from '../services/probabilityService';

interface SuccessGaugeProps {
  probability: number; // 0-1
  showLabel?: boolean;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'bar' | 'circular'; // bar = barre horizontale, circular = rond
}

export const SuccessGauge: React.FC<SuccessGaugeProps> = ({
  probability,
  showLabel = true,
  showPercentage = true,
  size = 'md',
  variant = 'bar'
}) => {
  const metrics = getProbabilityMetrics(probability);
  const riskText = getRiskLevelText(metrics.riskLevel);

  // Tailles basées sur le paramètre size
  const heightMap = {
    sm: 'h-1.5 md:h-2',
    md: 'h-2 md:h-2.5',
    lg: 'h-3 md:h-4'
  };

  const containerHeightMap = {
    sm: 'gap-1',
    md: 'gap-1.5 md:gap-2',
    lg: 'gap-2 md:gap-3'
  };

  const textSizeMap = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base md:text-lg'
  };

  if (variant === 'circular') {
    return (
      <CircularGauge
        probability={probability}
        showLabel={showLabel}
        showPercentage={showPercentage}
        size={size}
        metrics={metrics}
        riskText={riskText}
      />
    );
  }

  // --- BAR VARIANT (défaut) ---
  return (
    <div className={`flex flex-col ${containerHeightMap[size]}`}>
      {/* Barre de progression */}
      <div className={`w-full ${heightMap[size]} bg-[#E2E8F0] dark:bg-[#27272A] rounded-full overflow-hidden ring-1 ring-[#E2E8F0] dark:ring-[#27272A] transition-colors`}>
        <motion.div
          className={`h-full bg-gradient-to-r ${getColorForRiskLevel(metrics.riskLevel)}`}
          initial={{ width: '0%' }}
          animate={{ width: `${probability * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>

      {/* Infos textuelles */}
      {(showLabel || showPercentage) && (
        <div className={`flex items-center justify-between text-gray-900 dark:text-[#F3F4F6] ${textSizeMap[size]}`}>
          {showLabel && <span className="font-semibold">{riskText}</span>}
          {showPercentage && (
            <motion.span
              className="font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {metrics.percentage}%
            </motion.span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Variant circulaire (type gauge analogique)
 */
const CircularGauge: React.FC<{
  probability: number;
  showLabel: boolean;
  showPercentage: boolean;
  size: 'sm' | 'md' | 'lg';
  metrics: ReturnType<typeof getProbabilityMetrics>;
  riskText: string;
}> = ({ probability, showLabel, showPercentage, size, metrics, riskText }) => {
  const sizeMap = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const circleSizeMap = {
    sm: 48,
    md: 64,
    lg: 80
  };

  const textSizeMap = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const circleSize = circleSizeMap[size];
  const circumference = 2 * Math.PI * (circleSize / 2 - 4);
  const strokeDashoffset = circumference * (1 - probability);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${sizeMap[size]}`}>
        {/* Fond gris */}
        <svg
          className="absolute inset-0"
          width={circleSize}
          height={circleSize}
          viewBox={`0 0 ${circleSize} ${circleSize}`}
        >
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={circleSize / 2 - 4}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-gray-700"
          />
        </svg>

        {/* Cercle de progression coloré */}
        <motion.svg
          className="absolute inset-0 -rotate-90"
          width={circleSize}
          height={circleSize}
          viewBox={`0 0 ${circleSize} ${circleSize}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <defs>
            <linearGradient id={`gradient-${metrics.riskLevel}`} x1="0%" y1="0%" x2="100%">
              <stop offset="0%" stopColor={metrics.color.split(' ')[1]} />
              <stop offset="100%" stopColor={metrics.color.split(' ')[3]} />
            </linearGradient>
          </defs>
          <motion.circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={circleSize / 2 - 4}
            fill="none"
            stroke={`url(#gradient-${metrics.riskLevel})`}
            strokeWidth="3"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </motion.svg>

        {/* Pourcentage au centre */}
        {showPercentage && (
          <motion.div
            className={`absolute inset-0 flex items-center justify-center text-white font-bold ${textSizeMap[size]}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            {metrics.percentage}%
          </motion.div>
        )}
      </div>

      {/* Label en dessous */}
      {showLabel && (
        <div className={`text-center text-white ${textSizeMap[size]}`}>
          <p className="font-semibold">{riskText}</p>
        </div>
      )}
    </div>
  );
};

export default SuccessGauge;
