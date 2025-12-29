'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Instagram, Bot, User, Sparkles } from 'lucide-react';

const exampleConvo = [
  { sender: 'user', text: "Do you have this in blue?", delay: 1000 },
  { sender: 'ai', text: "Yes! We just restocked the Deep Blue variant. Would you like a direct link to check it out?", delay: 2000 },
  { sender: 'user', text: "Yes please!", delay: 1500 },
  { sender: 'ai', text: "Here you go: socialora.app/products/blue-variant 🚀 Anything else I can help with?", delay: 1000 },
];

export function InteractiveSimulation() {
  const [messages, setMessages] = useState<{sender: string, text: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step < exampleConvo.length) {
      const timer = setTimeout(() => {
        if (exampleConvo[step].sender === 'ai') {
          setIsTyping(true);
          setTimeout(() => {
            setMessages(prev => [...prev, exampleConvo[step]]);
            setIsTyping(false);
            setStep(s => s + 1);
          }, 1500);
        } else {
          setMessages(prev => [...prev, exampleConvo[step]]);
          setStep(s => s + 1);
        }
      }, exampleConvo[step].delay);
      return () => clearTimeout(timer);
    } else {
      // Loop after finish
      const resetTimer = setTimeout(() => {
        setMessages([]);
        setStep(0);
      }, 5000);
      return () => clearTimeout(resetTimer);
    }
  }, [step]);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-background-secondary overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="lg:w-1/2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6 font-semibold text-accent animate-pulse">
            <Sparkles className="h-4 w-4" />
            Live AI Simulation
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 leading-tight">
            See the AI <br />
            <span className="bg-gradient-to-r from-accent to-pink-500 bg-clip-text text-transparent">Magic in Real-Time</span>
          </h2>
          <p className="text-xl text-foreground-muted mb-8 max-w-lg leading-relaxed">
            SocialOra's AI doesn't just send automated replies. It understands context, handles objections, and nudges followers toward a purchase—all while maintaining your unique brand voice.
          </p>
          <div className="space-y-4">
            {[
              "Handles complex product questions",
              "Nurtures leads with personalized follow-ups",
              "Identifies high-value customers automatically"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-foreground font-medium">
                <div className="h-2 w-2 bg-accent rounded-full" />
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:w-1/2 w-full max-w-[400px] mx-auto relative group">
          {/* Enhanced Gloving Background */}
          <div className="absolute -inset-4 bg-gradient-to-r from-accent/30 to-pink-500/30 rounded-[4rem] blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
          
          {/* Mock Instagram Device */}
          <div className="relative bg-[#121212] rounded-[3rem] p-4 border-[8px] border-[#2a2a2a] shadow-2xl transition-transform duration-500 hover:scale-[1.02] hover:-rotate-1">
            <div className="bg-background rounded-[2rem] h-[600px] flex flex-col overflow-hidden relative">
              {/* Top Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#2a2a2a] rounded-b-2xl z-20"></div>
              
              {/* Header */}
              <div className="p-4 pt-8 border-b border-border flex items-center justify-between bg-background/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-0.5">
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                      <Bot className="h-6 w-6 text-accent" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold flex items-center gap-1">
                      SocialOra AI <Sparkles className="h-3 w-3 text-accent fill-accent" />
                    </p>
                    <p className="text-[10px] text-green-500">Active now</p>
                  </div>
                </div>
                <Instagram className="h-5 w-5 text-foreground-muted" />
              </div>

              {/* Chat Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans no-scrollbar">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.sender === 'user' 
                        ? 'bg-accent text-white rounded-br-none' 
                        : 'bg-background-elevated text-foreground rounded-bl-none border border-border'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-background-elevated p-3 rounded-2xl flex gap-1">
                      <div className="w-1.5 h-1.5 bg-accent/50 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-accent/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-accent/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border flex items-center gap-3 bg-background">
                <div className="flex-1 bg-background-elevated rounded-full px-4 py-2 text-xs text-foreground-muted">
                  Message...
                </div>
                <Send className="h-5 w-5 text-accent" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
