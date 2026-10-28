import React from 'react';
import {
  Flame,
  Car,
  HeartPulse,
  Waves,
  Activity,
  ShieldAlert,
  Wind,
  Zap,
  AlertCircle,
} from 'lucide-react';

const ICON_MAP = {
  fire: { icon: Flame, color: 'bg-pastel-peach-bg text-pastel-peach-text' },
  road_accident: { icon: Car, color: 'bg-pastel-slate-bg text-pastel-slate-text' },
  medical_emergency: { icon: HeartPulse, color: 'bg-pastel-rose-bg text-pastel-rose-text' },
  flood: { icon: Waves, color: 'bg-pastel-sky-bg text-pastel-sky-text' },
  earthquake: { icon: Activity, color: 'bg-pastel-butter-bg text-pastel-butter-text' },
  crime: { icon: ShieldAlert, color: 'bg-pastel-lavender-bg text-pastel-lavender-text' },
  gas_leak: { icon: Wind, color: 'bg-pastel-sky-bg text-pastel-sky-text' },
  electrical_hazard: { icon: Zap, color: 'bg-pastel-butter-bg text-pastel-butter-text' },
  other: { icon: AlertCircle, color: 'bg-pastel-slate-bg text-pastel-slate-text' },
};

export const TypeIcon = ({ type, size = 'md', className = '' }) => {
  const item = ICON_MAP[type] || ICON_MAP.other;
  const IconComponent = item.icon;

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg p-1.5',
    md: 'w-10 h-10 rounded-xl p-2',
    lg: 'w-12 h-12 rounded-xl p-2.5',
  }[size] || 'w-10 h-10 rounded-xl p-2';

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 ${item.color} ${sizeClasses} ${className}`}
      title={type}
    >
      <IconComponent className="w-full h-full" aria-hidden="true" />
    </div>
  );
};

export default TypeIcon;
