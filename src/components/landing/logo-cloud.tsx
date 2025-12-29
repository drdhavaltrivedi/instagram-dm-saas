'use client';

import { Instagram, Zap, Shield, Star, Heart, MessageSquare } from 'lucide-react';

const logos = [
  { name: 'InstaGrow', icon: Instagram },
  { name: 'FastScale', icon: Zap },
  { name: 'SecureDM', icon: Shield },
  { name: 'HighFive', icon: Star },
  { name: 'LovelySocial', icon: Heart },
  { name: 'TalkFlow', icon: MessageSquare },
];

export function LogoCloud() {
  return (
    <div className="py-12 mt-12 border-y border-border/50 bg-background-elevated/20 backdrop-blur-sm relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <div className="w-[1000px] h-px bg-gradient-to-r from-transparent via-accent to-transparent"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-semibold text-foreground-muted mb-8 uppercase tracking-widest">
          Trusted by 500+ fast-growing brands
        </p>
        
        <div className="flex flex-wrap justify-center gap-10 md:gap-16 lg:gap-24 items-center grayscale opacity-60 hover:grayscale-0 transition-all duration-500">
          {logos.map((logo, index) => (
            <div key={index} className="flex items-center gap-2 group cursor-default">
              <logo.icon className="h-6 w-6 text-foreground group-hover:text-accent transition-colors" />
              <span className="font-bold text-lg text-foreground group-hover:text-accent transition-colors">
                {logo.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
