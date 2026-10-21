import React, { useId, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SAMPLE_BRIEF =
  "Cold brew is back. 20% off at the roastery this weekend only.";

const FORMATS = [
  { ratio: "1:1", label: "Feed post", w: 1, h: 1 },
  { ratio: "4:5", label: "Portrait", w: 4, h: 5 },
  { ratio: "9:16", label: "Story", w: 9, h: 16 },
  { ratio: "16:9", label: "Banner", w: 16, h: 9 },
] as const;

const splitBrief = (brief: string) => {
  const text = brief.trim() || SAMPLE_BRIEF;
  const match = text.match(/^(.{4,60}?[.!?])\s+(.*)$/);
  return match
    ? { headline: match[1], support: match[2] }
    : { headline: text.slice(0, 60), support: text.slice(60) };
};

/** One generated banner, drawn the way the editor composes it: field, headline, support, action. */
const FormatFrame: React.FC<{
  format: (typeof FORMATS)[number];
  headline: string;
  support: string;
  tone: "paper" | "brand" | "ink";
}> = ({ format, headline, support, tone }) => {
  const tall = format.h > format.w;
  const wide = format.w > format.h * 1.4;
  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <div
        data-ui
        className={cn(
          "relative flex flex-col justify-between overflow-hidden rounded-md p-[7%]",
          tone === "paper" && "bg-[#f1efe9] text-[#141414]",
          tone === "brand" && "bg-brand text-brand-foreground",
          tone === "ink" && "bg-[#1d1d1f] text-[#f4f4f3]",
        )}
        style={{ aspectRatio: `${format.w} / ${format.h}` }}
      >
        <span
          className={cn(
            "font-semibold leading-[1.02] tracking-[-0.02em] [overflow-wrap:anywhere]",
            wide ? "max-w-[70%] text-[clamp(13px,1.6vw,22px)]" : tall ? "text-[clamp(13px,1.5vw,20px)]" : "text-[clamp(13px,1.7vw,24px)]",
          )}
        >
          {headline}
        </span>
        <div className="flex flex-col gap-2">
          {support && !wide && (
            <span className="line-clamp-3 text-[clamp(12px,0.95vw,13px)] leading-snug opacity-80">
              {support}
            </span>
          )}
          <span
            className={cn(
              "w-fit rounded-sm px-2 py-1 text-[clamp(11px,0.8vw,12px)] font-semibold",
              tone === "brand" ? "bg-brand-foreground text-brand" : "bg-brand text-brand-foreground",
            )}
          >
            Shop now
          </span>
        </div>
      </div>
      <figcaption className="text-xs text-muted-foreground">
        {format.label} <span className="tabular text-muted-foreground">{format.ratio}</span>
      </figcaption>
    </figure>
  );
};

const PLAN_OUTPUT = {
  headline: "Cold brew is back.",
  sub: "20% off at the roastery, Saturday and Sunday.",
  caption:
    "Twelve hours in the steep, ready by nine. Bring a friend and a bottle; refills are on us this weekend.",
  hashtags: ["#coldbrew", "#weekendroast", "#localcoffee", "#summerdrinks"],
  variations: [
    "Twelve hours in the making",
    "Refills on us this weekend",
    "Bring your own bottle",
  ],
};

const TOOLS = [
  {
    name: "Banner Generator",
    body: "A brief becomes copy, a caption, hashtags and up to six banners you can open in the layer editor.",
  },
  {
    name: "Avatar Studio",
    body: "Upload or generate a character once and reuse it across banners, edits and video.",
  },
  {
    name: "Image Studio",
    body: "Change a picture by describing the change. Every step keeps an undo.",
  },
  {
    name: "Video Generator",
    body: "Short clips from a prompt, a still or an avatar, or a reel of several scenes merged into one file.",
  },
  {
    name: "Activities",
    body: "Every run with its status and the credits it used, so nothing paid for goes missing.",
  },
];

export const HomePage: React.FC = () => {
  const [brief, setBrief] = useState(SAMPLE_BRIEF);
  const briefId = useId();
  const { headline, support } = splitBrief(brief);
  const tones = ["paper", "brand", "ink", "paper"] as const;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <section className="pt-16 sm:pt-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <h1
              className="enter text-[clamp(2.75rem,7vw,6.5rem)] font-semibold leading-[0.95] tracking-[-0.035em] text-foreground"
              style={{ "--i": 0 } as React.CSSProperties}
            >
              One brief.
              <br />
              Every format.
            </h1>
          </div>
          <div className="lg:col-span-5 lg:pb-3">
            <p
              className="enter max-w-md text-lg leading-relaxed text-foreground"
              style={{ "--i": 1 } as React.CSSProperties}
            >
              Social Studio turns a campaign brief into copy, banners for feed,
              story and web, image edits and short video, in one workspace.
            </p>
            <div
              className="enter mt-8 flex flex-wrap items-center gap-3"
              style={{ "--i": 2 } as React.CSSProperties}
            >
              <Button asChild size="lg">
                <Link to="/auth?mode=register">
                  Start free with 120 credits
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link to="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>
        </div>

        <div
          className="enter mt-16 rounded-xl bg-card p-4 sm:p-6"
          style={{ "--i": 3 } as React.CSSProperties}
        >
          <label
            htmlFor={briefId}
            className="block text-sm font-medium text-foreground"
          >
            Try a brief
          </label>
          <input
            id={briefId}
            value={brief}
            maxLength={140}
            onChange={(event) => setBrief(event.target.value)}
            className="mt-2 h-12 w-full rounded-md border border-input bg-background px-4 text-base text-foreground outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
            placeholder={SAMPLE_BRIEF}
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Your words, set in the four sizes the generator makes. In the
            workspace the planner writes the copy and paints the pictures.
          </p>
          <div className="mt-6 grid grid-cols-2 items-end gap-4 sm:grid-cols-[1fr_0.8fr_0.5625fr_1.6fr] sm:gap-5">
            {FORMATS.map((format, index) => (
              <div
                key={format.ratio}
                className={cn(index === 3 && "col-span-2 sm:col-span-1")}
              >
                <FormatFrame
                  format={format}
                  headline={headline}
                  support={support}
                  tone={tones[index]}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-32 grid gap-10 lg:mt-48 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 className="text-3xl font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-4xl">
            What one brief returns
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-foreground">
            The planner answers with everything a post needs: a headline and
            support line, a caption, hashtags and keywords, and the angles for
            each extra banner. Each banner opens in the editor as layers you can
            move, restyle and export.
          </p>
          <Button asChild variant="outline" className="mt-8">
            <Link to="/features">How each tool works</Link>
          </Button>
        </div>

        <div
          data-ui
          className="overflow-hidden rounded-xl border border-border bg-card lg:col-span-7"
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-3 text-sm">
            <span className="font-medium text-foreground">Campaign plan</span>
            <span className="text-muted-foreground">Gemini planner · 3 banners</span>
          </div>
          <dl className="divide-y divide-border">
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[140px_1fr]">
              <dt className="text-sm text-muted-foreground">Headline</dt>
              <dd className="text-lg font-semibold text-foreground">
                {PLAN_OUTPUT.headline}
              </dd>
            </div>
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[140px_1fr]">
              <dt className="text-sm text-muted-foreground">Support</dt>
              <dd className="text-sm text-foreground">{PLAN_OUTPUT.sub}</dd>
            </div>
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[140px_1fr]">
              <dt className="text-sm text-muted-foreground">Caption</dt>
              <dd className="text-sm leading-relaxed text-foreground">
                {PLAN_OUTPUT.caption}
              </dd>
            </div>
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[140px_1fr]">
              <dt className="text-sm text-muted-foreground">Hashtags</dt>
              <dd className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-brand">
                {PLAN_OUTPUT.hashtags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </dd>
            </div>
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[140px_1fr]">
              <dt className="text-sm text-muted-foreground">Variations</dt>
              <dd>
                <ul className="space-y-1 text-sm text-foreground">
                  {PLAN_OUTPUT.variations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mt-32 grid gap-10 lg:mt-48 lg:grid-cols-12">
        <h2 className="text-3xl font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-4xl lg:col-span-4">
          Five tools on one account
        </h2>
        <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:col-span-8">
          {TOOLS.map((tool) => (
            <div key={tool.name}>
              <dt className="text-lg font-semibold text-foreground">
                {tool.name}
              </dt>
              <dd className="mt-2 text-base leading-relaxed text-muted-foreground">
                {tool.body}
              </dd>
            </div>
          ))}
          <div>
            <dt className="text-lg font-semibold text-foreground">
              Credits you can see
            </dt>
            <dd className="mt-2 text-base leading-relaxed text-muted-foreground">
              Credits are held when a run starts and only spent when it
              succeeds. A failed run gives them back.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
};
