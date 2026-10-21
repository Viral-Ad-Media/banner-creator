import { downloadGeneratedVideo } from "../../services/videoService";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Image as ImageIcon,
  RefreshCcw,
  Sparkles,
  Video,
  Wand2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Skeleton } from "../ui/skeleton";
import { Spinner } from "../ui/spinner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { cn } from "@/lib/utils";
import {
  getGenerationActivity,
  getGenerationDetail,
  type GenerationRecord,
  type UsageSummary,
} from "../../services/workspaceService";

const formatGenerationType = (value: GenerationRecord["type"]) => {
  switch (value) {
    case "BANNER_PLAN":
      return "Banner plan";
    case "IMAGE_GENERATION":
      return "Picture";
    case "IMAGE_EDIT":
      return "Image edit";
    case "VIDEO_GENERATION":
      return "Video";
    default:
      return value;
  }
};

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const STATUS: Record<GenerationRecord["status"], { label: string; className: string }> = {
  SUCCESS: { label: "Done", className: "text-muted-foreground" },
  FAILED: { label: "Failed, credits returned", className: "text-destructive" },
  QUEUED: { label: "Queued", className: "text-warning" },
  RUNNING: { label: "Running", className: "text-warning" },
  UNKNOWN: { label: "Being checked, credits held", className: "text-warning" },
};

const COST: Record<GenerationRecord["type"], number> = {
  BANNER_PLAN: 3,
  IMAGE_GENERATION: 5,
  IMAGE_EDIT: 5,
  VIDEO_GENERATION: 25,
};

const getGenerationIcon = (type: GenerationRecord["type"]) => {
  if (type === "BANNER_PLAN") return Sparkles;
  if (type === "IMAGE_EDIT") return Wand2;
  if (type === "VIDEO_GENERATION") return Video;
  return ImageIcon;
};

export const ActivitiesPanel: React.FC = () => {
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  useEffect(
    () => () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    },
    [resultUrl],
  );
  const [generations, setGenerations] = useState<GenerationRecord[]>([]);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadActivity = async (append = false) => {
    // Paging keeps the list on screen; only a full refresh shows the loading state.
    (append ? setIsLoadingMore : setIsLoading)(true);
    setErrorMessage(null);

    try {
      const response = await getGenerationActivity(
        append ? (nextOffset ?? 0) : 0,
      );
      setGenerations((prev) =>
        append ? [...prev, ...response.generations] : response.generations,
      );
      setNextOffset(response.nextOffset ?? null);
      setUsage(response.usage);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not load activity right now.",
      );
    } finally {
      (append ? setIsLoadingMore : setIsLoading)(false);
    }
  };

  useEffect(() => {
    void loadActivity();
  }, []);

  const openResult = async (id: string) => {
    setOpeningId(id);
    try {
      const { generation } = await getGenerationDetail(id);
      setSelected(generation);
      setResultUrl(null);
      if (
        generation.type === "VIDEO_GENERATION" &&
        generation.status === "SUCCESS"
      )
        setResultUrl(URL.createObjectURL(await downloadGeneratedVideo(id)));
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setOpeningId(null);
    }
  };
  const successCount = generations.filter(
    (item) => item.status === "SUCCESS",
  ).length;
  const failureCount = generations.filter(
    (item) => item.status === "FAILED",
  ).length;

  const plan = selected?.type === "BANNER_PLAN" ? selected.result?.data : null;

  return (
    <div className="space-y-6">
      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader className="border-b border-border p-6">
                <SheetTitle className="text-lg">
                  {formatGenerationType(selected.type)}
                </SheetTitle>
                <SheetDescription>
                  {formatTimestamp(selected.created_at)} ·{" "}
                  {STATUS[selected.status as GenerationRecord["status"]]?.label ?? selected.status}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-5 p-6">
                <p className="text-sm leading-relaxed text-foreground">{selected.prompt}</p>
                {typeof selected.result?.data === "string" ? (
                  <>
                    <img
                      alt={selected.prompt}
                      src={selected.result.data}
                      className="w-full rounded-lg border border-border"
                    />
                    <Button asChild variant="secondary">
                      <a href={selected.result.data} download={`generation-${selected.id}.png`}>
                        Download image
                      </a>
                    </Button>
                  </>
                ) : selected.type === "VIDEO_GENERATION" ? (
                  <>
                    {resultUrl ? (
                      <>
                        <video src={resultUrl} controls className="w-full rounded-lg border border-border" />
                        <Button asChild variant="secondary">
                          <a href={resultUrl} download={`video-${selected.id}.mp4`}>
                            Download video
                          </a>
                        </Button>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Not ready yet. Check again in a minute.
                      </p>
                    )}
                    <Button
                      variant="outline"
                      isLoading={openingId === selected.id}
                      onClick={() => void openResult(selected.id)}
                    >
                      Check again
                    </Button>
                  </>
                ) : plan?.main_banner ? (
                  <dl className="divide-y divide-border rounded-lg border border-border text-sm">
                    <div className="p-4">
                      <dt className="text-muted-foreground">Headline</dt>
                      <dd className="mt-1 font-semibold text-foreground">{plan.main_banner.headline}</dd>
                    </div>
                    <div className="p-4">
                      <dt className="text-muted-foreground">Caption</dt>
                      <dd className="mt-1 whitespace-pre-wrap text-foreground">{plan.seo?.caption}</dd>
                    </div>
                    {(plan.additional_banners ?? []).length > 0 && (
                      <div className="p-4">
                        <dt className="text-muted-foreground">Variations</dt>
                        <dd className="mt-1 space-y-1 text-foreground">
                          {plan.additional_banners.map((b: { title: string }, i: number) => (
                            <p key={i}>{b.title}</p>
                          ))}
                        </dd>
                      </div>
                    )}
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {selected.error_message ?? "No stored result for this run."}
                  </p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <section aria-label="Credits this month" className="grid grid-cols-1 divide-y divide-border rounded-xl border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-5">
          <p className="text-sm text-muted-foreground">Credits left</p>
          <p className="tabular mt-1 text-2xl font-semibold text-foreground">
            {usage ? usage.remainingCredits : "—"}
            <span className="text-base font-normal text-muted-foreground"> of {usage?.limit ?? "—"}</span>
          </p>
          <Progress
            value={Math.min(100, Math.round(((usage?.usedCredits ?? 0) / Math.max(1, usage?.limit ?? 1)) * 100))}
            className="mt-3 h-1.5 bg-secondary [&>div]:bg-brand"
            aria-label="Credits used"
          />
        </div>
        <div className="p-5">
          <p className="text-sm text-muted-foreground">Used this month</p>
          <p className="tabular mt-1 text-2xl font-semibold text-foreground">{usage ? usage.usedCredits : "—"}</p>
          {(usage?.reservedCredits ?? 0) > 0 && (
            <p className="tabular mt-1 text-sm text-muted-foreground">
              {usage?.reservedCredits} held by runs in progress
            </p>
          )}
        </div>
        <div className="p-5">
          <p className="text-sm text-muted-foreground">Runs listed below</p>
          <p className="tabular mt-1 text-2xl font-semibold text-foreground">{generations.length}</p>
          <p className={cn("tabular mt-1 text-sm", failureCount > 0 ? "text-destructive" : "text-muted-foreground")}>
            {successCount} done · {failureCount} failed
          </p>
        </div>
      </section>

      <section aria-labelledby="runs-heading" className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
          <h2 id="runs-heading" className="text-base font-semibold text-foreground">Runs</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void loadActivity()}
            disabled={isLoading}
          >
            <RefreshCcw className={cn(isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <ul aria-label="Loading runs" className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="size-4" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </li>
            ))}
          </ul>
        ) : errorMessage ? (
          <div role="alert" className="flex items-center justify-between gap-4 px-5 py-6 text-sm">
            <p className="text-foreground">Couldn't load runs. {errorMessage}</p>
            <Button variant="ghost" size="sm" onClick={() => void loadActivity()}>
              Retry
            </Button>
          </div>
        ) : generations.length === 0 ? (
          <div className="px-5 py-10">
            <p className="text-base font-medium text-foreground">No runs yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Banner plans, pictures, edits and videos appear here with the credits each one used.
            </p>
            <Button asChild variant="secondary" size="sm" className="mt-4">
              <Link to="/app/banner-generator">Write your first brief</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {generations.map((generation, index) => {
              const Icon = getGenerationIcon(generation.type);
              const status = STATUS[generation.status];
              return (
                <li
                  key={generation.id}
                  className="enter"
                  style={{ "--i": Math.min(index, 6) } as React.CSSProperties}
                >
                  <button
                    type="button"
                    onClick={() => void openResult(generation.id)}
                    className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors duration-150 hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none"
                  >
                    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="text-sm font-medium text-foreground">
                          {formatGenerationType(generation.type)}
                        </span>
                        <span className={cn("text-xs", status.className)}>{status.label}</span>
                        {generation.aspect_ratio && (
                          <span className="tabular text-xs text-muted-foreground">{generation.aspect_ratio}</span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{generation.prompt}</p>
                      {generation.error_message && (
                        <p className="mt-1 text-xs text-destructive">{generation.error_message}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="tabular text-sm text-foreground">
                        {generation.status === "FAILED" ? "0" : COST[generation.type]} cr
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {openingId === generation.id ? <Spinner className="ml-auto size-3" /> : formatTimestamp(generation.created_at)}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {nextOffset !== null && (
        <Button variant="outline" onClick={() => void loadActivity(true)} isLoading={isLoadingMore}>
          Load older runs
        </Button>
      )}
    </div>
  );
};
