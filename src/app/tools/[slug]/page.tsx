import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Instagram, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getToolBySlug, instagramTools } from '../_data/tools';

export async function generateStaticParams() {
  return instagramTools.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const tool = getToolBySlug(params.slug);
  if (!tool) {
    return { title: 'Tool Not Found | Socialora' };
  }

  return {
    title: `${tool.title} | Socialora Tools`,
    description: tool.description,
    openGraph: {
      title: `${tool.title} | Socialora Tools`,
      description: tool.description,
      type: 'website',
    },
  };
}

export default function ToolPage({ params }: { params: { slug: string } }) {
  const tool = getToolBySlug(params.slug);
  if (!tool) notFound();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent to-pink-500 flex items-center justify-center">
                <Instagram className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg">
                Social<span className="text-accent">ora</span>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/tools">
                <Button variant="ghost" size="sm">
                  Tools
                </Button>
              </Link>
              <Link href="/blog">
                <Button variant="ghost" size="sm">
                  Blog
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/tools">
          <Button variant="ghost" size="sm" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tools
          </Button>
        </Link>

        <div className="bg-background-elevated rounded-2xl border border-border p-10">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="accent">{tool.category}</Badge>
            {(tool.badges || []).slice(0, 2).map((b) => (
              <Badge key={b} variant="default">
                {b}
              </Badge>
            ))}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">{tool.title}</h1>
          <p className="text-foreground-muted text-lg leading-relaxed mb-8">{tool.description}</p>

          <div className="rounded-xl border border-border bg-background-secondary p-6 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <p className="font-medium text-foreground">Tool UI placeholder</p>
            </div>
            <p className="text-sm text-foreground-muted">
              This is the UI shell for the tool. If you want, tell me which tool(s) should be functional first and what inputs/outputs you want.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/signup">
              <Button size="lg" className="group">
                Start Free Trial
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button variant="secondary" size="lg">
                Read Docs
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent to-pink-500 flex items-center justify-center">
                <Instagram className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg">
                Social<span className="text-accent">ora</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-foreground-muted">
              <Link href="/tools" className="hover:text-foreground transition-colors">
                Tools
              </Link>
              <Link href="/blog" className="hover:text-foreground transition-colors">
                Blog
              </Link>
              <Link href="/support" className="hover:text-foreground transition-colors">
                Support
              </Link>
            </div>
            <p className="text-sm text-foreground-muted">© 2025 Socialora. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}


