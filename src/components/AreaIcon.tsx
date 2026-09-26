import React from 'react';
import { Flame, Store, Utensils, Droplets, Sparkles, Box, ShieldCheck } from 'lucide-react';

interface AreaIconProps {
  categoryOrId?: string;
  className?: string;
}

export const AreaIcon: React.FC<AreaIconProps> = ({ categoryOrId = '', className = 'w-5 h-5' }) => {
  const key = categoryOrId.toLowerCase();

  if (key.includes('fryer') || key.includes('penggorengan')) {
    return <Flame className={className} />;
  }
  if (key.includes('cashier') || key.includes('kasir') || key.includes('service')) {
    return <Store className={className} />;
  }
  if (key.includes('dining') || key.includes('tamu') || key.includes('meja')) {
    return <Utensils className={className} />;
  }
  if (key.includes('dishwashing') || key.includes('cuci') || key.includes('waste')) {
    return <Droplets className={className} />;
  }
  if (key.includes('restroom') || key.includes('toilet') || key.includes('facility')) {
    return <Sparkles className={className} />;
  }
  if (key.includes('storage') || key.includes('gudang') || key.includes('chiller')) {
    return <Box className={className} />;
  }

  return <ShieldCheck className={className} />;
};
