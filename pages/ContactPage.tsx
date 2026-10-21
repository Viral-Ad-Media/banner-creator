import React from 'react';

const contacts = [
  { team: 'Sales', note: 'Plans, credits and team seats.', email: 'sales@socialstudio.app' },
  { team: 'Support', note: 'Account, billing and anything that broke.', email: 'support@socialstudio.app' },
  { team: 'Enterprise', note: 'High-volume production and onboarding.', email: 'enterprise@socialstudio.app' },
];

export const ContactPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 sm:px-6 sm:pt-24 lg:px-8">
      <h1 className="text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">Talk to the team</h1>
      <p className="mt-4 text-lg leading-relaxed text-foreground">
        Write to the address that fits and a person replies, usually within one working day.
      </p>

      <dl className="mt-12 divide-y divide-border border-y border-border">
        {contacts.map((contact) => (
          <div key={contact.team} className="grid gap-1 py-6 sm:grid-cols-[180px_1fr_auto] sm:items-baseline sm:gap-6">
            <dt className="text-lg font-semibold text-foreground">{contact.team}</dt>
            <dd className="text-base text-muted-foreground">{contact.note}</dd>
            <dd>
              <a
                href={`mailto:${contact.email}`}
                className="text-base text-foreground underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
              >
                {contact.email}
              </a>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
