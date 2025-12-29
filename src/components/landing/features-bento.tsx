'use client';

import { useRef, useState } from 'react';
import { MessageSquare, Bot, Send, BarChart3, Target, Shield, ArrowRight, Lightbulb, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const features = [
  {
    icon: MessageSquare,
    title: "Unified Smart Inbox",
    description: "Streamline your chaos. View, filter, and manage DMs from all your accounts in one distraction-free dashboard.",
    color: "bg-blue-500",
    colSpan: "md:col-span-2",
    delay: "0",
    visual: (
      <div className="absolute right-4 bottom-4 w-32 h-24 bg-background-elevated rounded-lg border border-border shadow-xl overflow-hidden opacity-50 group-hover:opacity-100 transition-opacity flex flex-col p-2 space-y-2">
        <div className="flex gap-2 items-center"><div className="w-6 h-6 rounded-full bg-blue-500/20" /><div className="w-16 h-2 bg-foreground-muted/20 rounded-full" /></div>
        <div className="flex gap-2 items-center"><div className="w-6 h-6 rounded-full bg-purple-500/20" /><div className="w-20 h-2 bg-foreground-muted/20 rounded-full" /></div>
        <div className="flex gap-2 items-center"><div className="w-6 h-6 rounded-full bg-green-500/20" /><div className="w-12 h-2 bg-foreground-muted/20 rounded-full" /></div>
      </div>
    )
  },
  {
    icon: Bot,
    title: "AI Response Engine",
    description: "Context-aware auto-replies that actually sound like you. Train the AI on your brand voice.",
    color: "bg-purple-500",
    colSpan: "md:col-span-1",
    delay: "100",
    visual: null
  },
  {
    icon: Send,
    title: "Bulk Campaigns",
    description: "Launch personalized DM campaigns to your followers with one click.",
    color: "bg-orange-500",
    colSpan: "md:col-span-1",
    delay: "0",
    visual: null
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    description: "Track open rates, reply rates, and conversion metrics in real-time.",
    color: "bg-green-500",
    colSpan: "md:col-span-2",
    delay: "200",
    visual: (
        <div className="absolute right-6 bottom-6 flex gap-2 items-end h-16 opacity-50 group-hover:opacity-100 transition-opacity">
            <div className="w-4 bg-green-500/20 h-8 rounded-t-sm group-hover:h-12 transition-all duration-500" />
            <div className="w-4 bg-green-500/40 h-10 rounded-t-sm group-hover:h-16 transition-all duration-500 delay-75" />
            <div className="w-4 bg-green-500/60 h-6 rounded-t-sm group-hover:h-10 transition-all duration-500 delay-150" />
            <div className="w-4 bg-green-500/80 h-12 rounded-t-sm group-hover:h-14 transition-all duration-500 delay-200" />
            <div className="w-4 bg-green-500 h-14 rounded-t-sm group-hover:h-20 transition-all duration-500 delay-300" />
        </div>
    )
  },
  {
    icon: Target,
    title: "Lead Scoring",
    description: "Automatically identify high-value conversations.",
    color: "bg-indigo-500",
    colSpan: "md:col-span-1",
    delay: "0",
    visual: null
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade encryption and Meta-compliant API usage.",
    color: "bg-teal-500",
    colSpan: "md:col-span-1",
    delay: "100",
    visual: null
  },
    {
    icon: Sparkles,
    title: "Smart Automation",
    description: "Trigger flows based on keywords, story mentions, and more.",
    color: "bg-pink-500",
    colSpan: "md:col-span-1",
    delay: "200",
    visual: null
  },
];

const SpotlightCard = ({ feature }: { feature: any }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative rounded-3xl border border-border bg-background-elevated/20 overflow-hidden group cursor-pointer hover:border-accent/40 transition-colors duration-500",
        feature.colSpan
      )}
    >
      {/* Spotlight Gradient */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(236,72,153,.15), transparent 40%)`,
        }}
      />
      
      <div className="relative h-full p-8 flex flex-col z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.color} bg-opacity-10 group-hover:scale-110 transition-transform duration-500`}>
          <feature.icon className={`h-6 w-6 ${feature.color.replace('bg-', 'text-')}`} />
        </div>
        
        <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-accent transition-colors">
            {feature.title}
        </h3>
        
        <p className="text-foreground-muted leading-relaxed mb-6 max-w-[90%]">
            {feature.description}
        </p>
        
        <div className="mt-auto flex items-center text-sm font-semibold text-accent opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            Learn more <ArrowRight className="ml-2 h-4 w-4" />
        </div>

        {/* Visual Element (Bottom Right) */}
        {feature.visual}
      </div>

       {/* Top Border Highlight */}
       <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
};

export function FeaturesBento() {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <Lightbulb className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-accent">Power-Packed Tools</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
            Everything You Need to <br/>
            <span className="bg-gradient-to-r from-accent via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Dominate Instagram
            </span>
          </h2>
          <p className="text-xl text-foreground-muted max-w-2xl mx-auto leading-relaxed">
            A complete suite of tools designed to turn your Instagram DMs into a scalable revenue channel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(0,1fr)]">
          {features.map((feature, index) => (
            <SpotlightCard key={index} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
