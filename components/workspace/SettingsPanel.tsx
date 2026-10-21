import React, { useEffect, useState } from 'react';
import type { AuthUser } from '../../services/authService';
import { updateProfile } from '../../services/authService';
import { getBillingSummary, type BillingSummary as BillingSummaryRecord, type PlanSummary, type UsageSummary } from '../../services/workspaceService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

interface SettingsPanelProps {
  user: AuthUser;
  onUserUpdated: (user: AuthUser) => void;
  onReplayTour: () => void;
}

const PLAN_NAME = { FREE: 'Free', PRO: 'Pro', ENTERPRISE: 'Enterprise' } as const;

const formatCredits = (value: number | undefined) =>
  value === undefined ? '—' : new Intl.NumberFormat('en-US').format(value);

const formatDate = (value: string | null) => {
  if (!value) return '—';

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(new Date(value));
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ user, onUserUpdated, onReplayTour }) => {
  const [name, setName] = useState(user.name);
  const [billing, setBilling] = useState<BillingSummaryRecord | null>(null);
  const [plan, setPlan] = useState<PlanSummary | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [isBillingLoading, setIsBillingLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const remainingPercentage = Math.max(0, Math.min(100, Math.round(((usage?.remainingCredits ?? 0) / Math.max(1, usage?.limit ?? 1)) * 100)));

  useEffect(() => {
    setName(user.name);
  }, [user.name]);

  useEffect(() => {
    let isMounted = true;

    const loadBilling = async () => {
      setIsBillingLoading(true);

      try {
        const response = await getBillingSummary();
        if (!isMounted) return;
        setBilling(response.billing);
        setPlan(response.plan);
        setUsage(response.usage);
      } catch (error) {
        if (!isMounted) return;
        setStatusMessage({
          type: 'error',
          text: error instanceof Error ? error.message : 'Could not load billing summary.',
        });
      } finally {
        if (isMounted) {
          setIsBillingLoading(false);
        }
      }
    };

    void loadBilling();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName === user.name) return;

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const updatedUser = await updateProfile({ name: trimmedName });
      onUserUpdated(updatedUser);
      setStatusMessage({ type: 'success', text: 'Profile updated.' });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not update profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const held = usage?.reservedCredits ?? 0;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
      <section aria-labelledby="profile-heading" className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 id="profile-heading" className="text-base font-semibold text-foreground">Profile</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">The name shown on your workspace.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-5 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="settings-name">Display name</Label>
              <Input
                id="settings-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                minLength={2}
                maxLength={120}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="settings-email">Email</Label>
              <Input id="settings-email" value={user.email} readOnly disabled />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" isLoading={isSaving} disabled={name.trim().length < 2 || name.trim() === user.name}>
              Save changes
            </Button>
            {statusMessage && (
              <p
                role={statusMessage.type === 'error' ? 'alert' : 'status'}
                className={cn('text-sm', statusMessage.type === 'error' ? 'text-destructive' : 'text-positive')}
              >
                {statusMessage.text}
              </p>
            )}
          </div>
        </form>
      </section>

      <div className="space-y-6">
        <section aria-labelledby="plan-heading" className="rounded-xl border border-border bg-card">
          <div className="flex items-baseline justify-between border-b border-border px-6 py-4">
            <h2 id="plan-heading" className="text-base font-semibold text-foreground">Plan and credits</h2>
            <span className="text-sm text-muted-foreground">{PLAN_NAME[plan?.tier ?? user.plan]} plan</span>
          </div>

          <div className="space-y-5 p-6">
            {isBillingLoading ? (
              <div className="space-y-3" aria-label="Loading credits">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : (
              <>
                <div>
                  <p className="tabular text-2xl font-semibold text-foreground">
                    {formatCredits(usage?.remainingCredits)}
                    <span className="text-base font-normal text-muted-foreground"> of {formatCredits(usage?.limit ?? plan?.monthlyCredits)} left</span>
                  </p>
                  <Progress value={remainingPercentage} className="mt-3 h-1.5 bg-secondary [&>div]:bg-brand" aria-label="Credits left this month" />
                  <p className="tabular mt-2 text-sm text-muted-foreground">
                    {formatCredits(usage?.usedCredits)} used this month
                    {held > 0 ? ` · ${formatCredits(held)} held by runs in progress` : ''}
                  </p>
                </div>

                <dl className="divide-y divide-border border-t border-border text-sm">
                  <div className="flex justify-between py-3">
                    <dt className="text-muted-foreground">Saved projects</dt>
                    <dd className="tabular text-foreground">up to {formatCredits(plan?.projectLimit)}</dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-muted-foreground">Subscription</dt>
                    <dd className="text-foreground">{billing?.status ?? 'None'}</dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-muted-foreground">Renews</dt>
                    <dd className="text-foreground">{formatDate(billing?.current_period_end ?? null)}</dd>
                  </div>
                </dl>
                <p className="text-xs text-muted-foreground">
                  A banner plan costs 3 credits, each picture or edit 5, each video clip 25. Credits reset on the first of the month (UTC).
                </p>
              </>
            )}
          </div>
        </section>

        <section aria-labelledby="tour-heading" className="rounded-xl border border-border bg-card p-6">
          <h2 id="tour-heading" className="text-base font-semibold text-foreground">Product tour</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Walk through the sidebar again, one tool at a time.
          </p>
          <Button variant="secondary" onClick={onReplayTour} className="mt-4">
            Replay the tour
          </Button>
        </section>
      </div>
    </div>
  );
};
