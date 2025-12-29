'use client';

import { Play, Sparkles } from 'lucide-react';
import { useState } from 'react';

export function HeroVideo({ videoId = "qfZBnw7G2Tw" }: { videoId?: string }) {
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <div id="demo-video-section" className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 mb-32">
        {/* Glow Effects - Reference from user image */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/20 blur-[100px] rounded-full -z-10 opacity-60"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none"></div>

        {/* Video Container */}
        <div className="relative rounded-3xl overflow-hidden border border-border/50 dark:border-white/10 shadow-2xl bg-background-elevated/40 backdrop-blur-sm group">
            {/* Top Bar (Browser-like) */}
            <div className="h-12 bg-background/80 dark:bg-black/40 backdrop-blur-md border-b border-border/50 dark:border-white/5 flex items-center px-4 gap-2">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
                <div className="mx-auto bg-foreground/5 dark:bg-white/5 rounded-full px-4 py-1 flex items-center gap-2">
                   <span className="text-xs text-foreground/70 dark:text-foreground-muted font-medium ml-2">socialora.app</span>
                </div>
            </div>

            {/* Video Area */}
            <div className="relative aspect-video w-full bg-black/90">
                {!isPlaying ? (
                    <div className="absolute inset-0 flex items-center justify-center cursor-pointer group-hover:bg-black/40 transition-colors" onClick={() => setIsPlaying(true)}>
                        {/* Play Button */}
                         <div className="w-20 h-20 bg-accent/90 hover:bg-accent rounded-full flex items-center justify-center pl-1 shadow-2xl shadow-accent/40 backdrop-blur-sm transition-all transform group-hover:scale-110">
                            <Play className="w-8 h-8 text-white fill-white" />
                        </div>
                        {/* Thumbnail or Placeholder */}
                        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-900/20 to-purple-900/20" />
                        
                        <div className="absolute bottom-8 left-8 text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-white mb-3">
                                <Sparkles className="w-3 h-3 text-yellow-400" />
                                <span>See it in action</span>
                            </div>
                            <h3 className="text-2xl font-bold text-white">Automate your Instagram DMs</h3>
                        </div>
                    </div>
                ) : (
                    <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&rel=0`}
                        title="SocialOra AI Demo"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                )}
            </div>
        </div>
    </div>
  );
}
