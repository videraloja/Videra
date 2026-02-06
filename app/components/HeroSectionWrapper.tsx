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
    <div 
      className={className}
      style={{
        marginBottom: '40px',
        borderRadius: '24px',
        overflow: 'hidden'
      }}
    >
      <HeroSection 
        autoPlay={true}
        showDots={true}
        transitionTime={5}
      />
    </div>
  );
}