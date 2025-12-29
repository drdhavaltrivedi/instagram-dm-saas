'use client';

import { Instagram, Sparkles, Rocket, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const steps = [
  {
    number: "1",
    title: "Connect",
    description: "Link your Instagram account in one click.",
    icon: Instagram,
    color: "from-purple-500 to-pink-500",
    detail: "Secure OAuth logic"
  },
  {
    number: "2",
    title: "Configure",
    description: "Set your AI persona and automation rules.",
    icon: Sparkles,
    color: "from-blue-500 to-cyan-500",
    detail: "Drag & Drop Builder"
  },
  {
    number: "3",
    title: "Scale",
    description: "Watch your engagement and sales grow on autopilot.",
    icon: Rocket,
    color: "from-green-500 to-emerald-500",
    detail: "Live Analytics"
  },
];

export function TimelineSteps({ onCtaClick }: { onCtaClick: () => void }) {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <span className="text-accent font-semibold tracking-wider uppercase text-sm">How It Works</span>
          <h2 className="mt-3 text-4xl sm:text-5xl font-bold text-foreground">
            From Zero to Automation <br />
            <span className="text-foreground-muted">in Minutes</span>
          </h2>
        </div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-border via-border to-border -translate-y-1/2 z-0">
             <div 
               className="h-full bg-gradient-to-r from-accent to-pink-500 transition-all duration-700 ease-in-out"
               style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="group relative flex flex-col items-center"
                onMouseEnter={() => setActiveStep(index)}
              >
                {/* Step Circle */}
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mb-8 transition-all duration-500 transform group-hover:scale-110 shadow-xl",
                  index <= activeStep 
                    ? `bg-gradient-to-br ${step.color} text-white` 
                    : "bg-background-elevated border-2 border-border text-foreground-muted"
                )}>
                  <step.icon className={cn(
                    "w-8 h-8",
                     index <= activeStep ? "text-white" : "text-foreground-muted"
                  )} />
                </div>

                {/* Content Card */}
                <div className="text-center md:h-48 p-6 rounded-2xl bg-background-elevated/50 backdrop-blur-sm border border-border group-hover:border-accent/40 transition-all duration-300 w-full max-w-sm">
                  <div className="inline-block px-3 py-1 bg-background rounded-full text-xs font-medium text-foreground-muted mb-4 border border-border">
                    Step 0{step.number}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-foreground-muted leading-relaxed">
                    {step.description}
                  </p>
                  <p className="mt-4 text-sm font-semibold text-accent opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-16 text-center">
            <button 
                onClick={onCtaClick}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-foreground text-background font-bold text-lg hover:bg-foreground/90 transition-colors shadow-lg hover:shadow-xl"
            >
                Start Automating Now <ArrowRight className="w-5 h-5" />
            </button>
        </div>
      </div>
    </section>
  );
}
