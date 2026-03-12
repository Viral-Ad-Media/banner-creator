import React from 'react';
import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'FREE',
    price: '$0',
    blurb: 'For trying the product and light personal use.',
    features: ['120 monthly credits', 'Up to 5 projects', 'Basic generation history'],
  },
  {
    name: 'PRO',
    price: '$29/mo',
    blurb: 'For creators and small teams shipping weekly campaigns.',
    features: ['3000 monthly credits', 'Up to 100 projects', 'Priority workspace performance'],
  },
  {
    name: 'ENTERPRISE',
    price: '$199/mo',
    blurb: 'For scale teams with heavy production needs.',
    features: ['50000 monthly credits', 'Up to 1000 projects', 'Large workspace allowance'],
  },
];

export const PricingPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white">Simple pricing for teams that publish fast</h1>
        <p className="text-muted mt-4">
          Start with the free plan, then scale credits and project limits as production grows.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mt-10">
        {plans.map((plan) => (
          <article key={plan.name} className="rounded-2xl border border-white/10 bg-surface/70 p-6">
            <h2 className="text-xl font-semibold text-white">{plan.name}</h2>
            <p className="text-3xl font-bold text-white mt-4">{plan.price}</p>
            <p className="text-sm text-muted mt-2">{plan.blurb}</p>
            <ul className="mt-5 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="text-sm text-muted">
                  • {feature}
                </li>
              ))}
            </ul>
            <Link
              to="/auth?mode=register"
              className="inline-flex mt-6 px-4 py-2 rounded-lg bg-primary/80 hover:bg-primary text-white text-sm"
            >
              Choose {plan.name}
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
};
