'use client';

import React from 'react';
import HeroSection from './HeroSection';

interface HeroSectionWrapperProps {
  showHero?: boolean;
  className?: string;
}

export default function HeroSectionWrapper({ 
  showHero = true,
  className = ''
}: HeroSectionWrapperProps) {
  if (!showHero) {
    return null;
  }

  return (
    <div className={className}>
      <HeroSection 
        autoPlay={true}
        showDots={true}
        transitionTime={5}
      />
    </div>
  );
}