import React from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: "$0",
    status: "Available now",
    blurb: "Try every tool on your own account.",
    credits: "120",
    projects: "5",
    features: [
      "Banner Generator, Image Studio and Video",
      "Avatar library synced to your account",
      "Activity history and credit usage",
    ],
    action: { label: "Start free", to: "/auth?mode=register" },
    available: true,
  },
  {
    name: "Pro",
    price: "Not yet on sale",
    status: "Coming soon",
    blurb: "For creators and small teams shipping campaigns every week.",
    credits: "3,000",
    projects: "100",
    features: [
      "Everything in Free",
      "Up to 100 saved projects",
      "A larger credit allowance for video",
    ],
    action: { label: "Ask to be told", to: "/contact" },
    available: false,
  },
  {
    name: "Enterprise",
    price: "By arrangement",
    status: "Talk to sales",
    blurb: "For teams producing at volume.",
    credits: "50,000",
    projects: "1,000",
    features: [
      "Everything in Pro",
      "Up to 1,000 saved projects",
      "Onboarding with the team",
    ],
    action: { label: "Contact sales", to: "/contact" },
    available: false,
  },
];

export const PricingPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 sm:pt-24 lg:px-8">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-6xl">
          Pay in credits, start at zero
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-foreground">
          Every run costs credits. They are held while it works and only spent
          when it succeeds. Paid plans are not on sale yet; the free plan has
          every tool.
        </p>
      </div>

      <div className="mt-16 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.name} className="flex flex-col bg-background p-6 sm:p-8">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-xl font-semibold text-foreground">{plan.name}</h2>
              <span
                className={cn(
                  "text-sm",
                  plan.available ? "text-brand" : "text-muted-foreground",
                )}
              >
                {plan.status}
              </span>
            </div>
            <p className="mt-6 text-3xl font-semibold tracking-[-0.02em] text-foreground">
              {plan.price}
            </p>
            <p className="mt-2 text-base text-muted-foreground">{plan.blurb}</p>

            <dl className="mt-8 grid grid-cols-2 gap-4 border-y border-border py-5">
              <div>
                <dt className="text-sm text-muted-foreground">Credits a month</dt>
                <dd className="tabular mt-1 text-2xl font-semibold text-foreground">{plan.credits}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Projects</dt>
                <dd className="tabular mt-1 text-2xl font-semibold text-foreground">{plan.projects}</dd>
              </div>
            </dl>

            <ul className="mt-6 mb-8 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-3 text-sm text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              asChild
              size="lg"
              variant={plan.available ? "default" : "outline"}
              className="mt-auto w-full"
            >
              <Link to={plan.action.to}>{plan.action.label}</Link>
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
};
