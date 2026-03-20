import React from 'react';
import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'FREE',
    price: '$0',
    blurb: 'For trying the product and light personal use.',
    features: [
      '120 monthly credits',
      'Up to 5 projects',
      'Banner generation and Image Studio',
      'Shared avatar library synced to your account',
      'Basic activity and settings access',
    ],
  },
  {
    name: 'PRO',
    price: '$29/mo',
    blurb: 'For creators and small teams shipping weekly campaigns.',
    features: [
      '3000 monthly credits',
      'Up to 100 projects',
      'Banner, avatar, and image workflows',
      'Video generator access',
      'Priority workspace performance',
    ],
  },
  {
    name: 'ENTERPRISE',
    price: '$199/mo',
    blurb: 'For scale teams with heavy production needs.',
    features: [
      '50000 monthly credits',
      'Up to 1000 projects',
      'Large workspace allowance',
      'High-volume campaign production',
      'Operational visibility for bigger teams',
    ],
  },
];

export const PricingPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
      <div className="mx-auto max-w-3xl text-center">
        <span className="section-kicker">Pricing</span>
        <h1 className="mt-6 text-balance text-5xl font-semibold leading-tight text-white">Simple pricing for teams that publish fast</h1>
        <p className="mt-4 text-lg leading-8 text-[#c2d2df]">
          Start with the free workspace, then scale credits and production capacity as campaigns, avatars, and video volume grow.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {plans.map((plan, index) => (
          <article key={plan.name} className={`surface-card rounded-[30px] p-6 ${index === 1 ? 'ring-1 ring-primary/25' : ''}`}>
            {index === 1 && (
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                Most Popular
              </span>
            )}
            <h2 className="text-xl font-semibold text-white">{plan.name}</h2>
            <p className="text-3xl font-bold text-white mt-4">{plan.price}</p>
            <p className="text-sm text-muted mt-2 leading-7">{plan.blurb}</p>
            <ul className="mt-5 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="text-sm text-muted">
                  • {feature}
                </li>
              ))}
            </ul>
            <Link
              to="/auth?mode=register"
              className="inline-flex mt-6 rounded-full bg-[linear-gradient(135deg,#83efe0_0%,#48d9c8_42%,#168d87_100%)] px-4 py-2.5 text-sm font-semibold text-[#04161a]"
            >
              Choose {plan.name}
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
};
