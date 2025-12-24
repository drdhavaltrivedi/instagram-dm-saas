'use client';

import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import NextImage from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export function BlogHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center">
                <div className="h-14 w-14 flex items-center justify-center overflow-hidden">
                  <NextImage 
                    src="/images/logo.png" 
                    alt="SocialOra" 
                    width={56} 
                    height={56} 
                    className="h-full w-full object-contain" 
                  />
                </div>
                <span className="font-bold text-xl">
                  Social<span className="text-accent">Ora</span>
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/blog">
                <Button variant="ghost" size="sm">Blog</Button>
              </Link>
              <Link href="/docs">
                <Button variant="ghost" size="sm">Docs</Button>
              </Link>
              <Link href="/support">
                <Button variant="ghost" size="sm">Support</Button>
              </Link>
              <Link href="/">
                <Button size="sm">Join Waiting List</Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-4 pt-2 pb-4 space-y-1">
              <Link href="/blog" className="block">
                <Button variant="ghost" className="w-full justify-start">Blog</Button>
              </Link>
              <Link href="/docs" className="block">
                <Button variant="ghost" className="w-full justify-start">Docs</Button>
              </Link>
              <Link href="/support" className="block">
                <Button variant="ghost" className="w-full justify-start">Support</Button>
              </Link>
              <div className="pt-2">
                <Link href="/" className="block">
                  <Button className="w-full">Join Waiting List</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
  );
}
