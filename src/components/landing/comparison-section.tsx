'use client';

import { Check, X } from 'lucide-react';

const comparisonData = [
  {
    feature: 'Response Time',
    manual: '2-24 hours',
    socialora: 'Under 5 seconds',
    better: 'socialora',
  },
  {
    feature: 'Scalability',
    manual: 'Limited by human hours',
    socialora: 'Unlimited automated DMs',
    better: 'socialora',
  },
  {
    feature: 'Lead Qualification',
    manual: 'Manual vetting',
    socialora: 'AI-automated qualifying',
    better: 'socialora',
  },
  {
    feature: 'Consistency',
    manual: 'Varies with mood/energy',
    socialora: '24/7 perfect brand voice',
    better: 'socialora',
  },
  {
    feature: 'Cost per Lead',
    manual: 'High (Labor costs)',
    socialora: 'Minimal (Automation)',
    better: 'socialora',
  },
];

export function ComparisonSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Why Switch to <span className="bg-gradient-to-r from-accent to-pink-500 bg-clip-text text-transparent">SocialOra?</span>
          </h2>
          <p className="text-xl text-foreground-muted max-w-2xl mx-auto">
            Stop wasting hours on manual outreach. Let AI handle the heavy lifting while you focus on closing deals.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-6 px-4 text-left text-lg font-semibold text-foreground">Feature</th>
                <th className="py-6 px-4 text-center text-lg font-semibold text-foreground-muted">Manual Outreach</th>
                <th className="py-6 px-4 text-center text-lg font-semibold text-accent bg-accent/5 rounded-t-2xl">SocialOra AI</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((item, index) => (
                <tr key={index} className="border-b border-border/50 group hover:bg-background-elevated/30 transition-colors">
                  <td className="py-6 px-4 text-foreground font-medium">{item.feature}</td>
                  <td className="py-6 px-4 text-center text-foreground-muted">
                    <div className="flex items-center justify-center gap-2">
                      <X className="h-4 w-4 text-red-500" />
                      {item.manual}
                    </div>
                  </td>
                  <td className="py-6 px-4 text-center text-foreground font-bold bg-accent/5">
                    <div className="flex items-center justify-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      {item.socialora}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
