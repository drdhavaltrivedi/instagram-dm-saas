'use client';

import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const plans = [
  {
    name: "Starter",
    description: "Perfect for growing creators",
    price: { monthly: 29, yearly: 19 },
    features: [
      "Up to 500 automated DMs/mo",
      "Basic AI response engine",
      "Unified Inbox access",
      "Email support",
      "1 Instagram account"
    ],
    cta: "Join Waitlist",
    highlight: false
  },
  {
    name: "Pro",
    description: "For serious businesses & agencies",
    price: { monthly: 79, yearly: 49 },
    features: [
      "Unlimited automated DMs",
      "Advanced AI with persona training",
      "Lead scoring & qualification",
      "Priority support",
      "Up to 5 Instagram accounts",
      "Analytics Dashboard"
    ],
    cta: "Join Waitlist",
    highlight: true
  },
  {
    name: "Enterprise",
    description: "Custom solutions for large scale",
    price: { monthly: "Custom", yearly: "Custom" },
    features: [
      "Multi-user collaboration",
      "API access",
      "Custom AI model training",
      "Dedicated account manager",
      "Unlimited accounts",
      "SLA guarantee"
    ],
    cta: "Contact Sales",
    highlight: false
  }
];

export function PricingSection({ onJoinWaitlist }: { onJoinWaitlist: () => void }) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Simple, Transparent <span className="bg-gradient-to-r from-accent to-pink-500 bg-clip-text text-transparent">Pricing</span>
          </h2>
          <p className="text-xl text-foreground-muted mb-10 max-w-2xl mx-auto">
            Choose the plan that fits your growth. Save up to 40% with yearly billing.
          </p>

          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm ${billingCycle === 'monthly' ? 'text-foreground font-bold' : 'text-foreground-muted'}`}>Monthly</span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-14 h-7 bg-background-elevated rounded-full p-1 transition-colors hover:bg-border"
            >
              <div className={`w-5 h-5 bg-accent rounded-full transition-transform ${billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm ${billingCycle === 'yearly' ? 'text-foreground font-bold' : 'text-foreground-muted'}`}>
              Yearly <span className="text-accent text-xs font-bold ml-1">SAVE 40%</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-background-secondary rounded-3xl p-10 border transition-all duration-300 hover:scale-105 ${
                plan.highlight 
                  ? 'border-accent shadow-2xl shadow-accent/20 scale-105' 
                  : 'border-border hover:border-accent/50'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  MOST POPULAR
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-foreground-muted text-sm">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    {typeof plan.price === 'string' ? '' : '$'}
                    {typeof plan.price === 'string' ? plan.price : plan.price[billingCycle]}
                  </span>
                  {typeof plan.price !== 'string' && (
                    <span className="text-foreground-muted">/month</span>
                  )}
                </div>
                {billingCycle === 'yearly' && typeof plan.price !== 'string' && (
                  <p className="text-accent text-xs font-semibold mt-2">Billed annually</p>
                )}
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start gap-3 text-foreground-muted text-sm">
                    <Check className="h-5 w-5 text-accent flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlight ? 'primary' : 'secondary'}
                className={`w-full py-6 text-lg font-bold rounded-2xl ${
                  plan.highlight 
                    ? 'bg-gradient-to-r from-accent to-pink-600 hover:from-accent/90 hover:to-pink-500 text-white' 
                    : 'bg-background hover:bg-background-elevated'
                }`}
                onClick={onJoinWaitlist}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
