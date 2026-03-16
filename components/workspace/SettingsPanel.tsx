import React, { useEffect, useState } from 'react';
import { CreditCard, Mail, Save, Settings, Sparkles, UserCircle2 } from 'lucide-react';
import type { AuthUser } from '../../services/authService';
import { updateProfile } from '../../services/authService';
import { getBillingSummary, type BillingSummary as BillingSummaryRecord, type PlanSummary, type UsageSummary } from '../../services/workspaceService';
import { Button } from '../ui/Button';

interface SettingsPanelProps {
  user: AuthUser;
  onUserUpdated: (user: AuthUser) => void;
}

const formatDate = (value: string | null) => {
  if (!value) return 'Not available';

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(new Date(value));
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ user, onUserUpdated }) => {
  const [name, setName] = useState(user.name);
  const [billing, setBilling] = useState<BillingSummaryRecord | null>(null);
  const [plan, setPlan] = useState<PlanSummary | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [isBillingLoading, setIsBillingLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const usagePercentage = Math.min(100, Math.round(((usage?.usedCredits ?? 0) / Math.max(1, usage?.limit ?? 1)) * 100));

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

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]">
      <section className="surface-card rounded-[32px] p-6">
        <div className="border-b border-white/8 pb-5">
          <span className="section-kicker">
            <Settings className="h-5 w-5 text-primary" />
            Workspace Settings
          </span>
          <p className="mt-4 text-sm leading-7 text-[#c0d1de]">Keep your profile details current and review the plan attached to this account.</p>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.24em] text-muted">Display Name</label>
              <div className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 transition-colors focus-within:border-primary/30">
                <UserCircle2 className="h-4 w-4 text-primary" />
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-muted"
                  placeholder="Your name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.24em] text-muted">Email</label>
              <div className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/85">
                <Mail className="h-4 w-4 text-primary" />
                <span>{user.email}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" isLoading={isSaving} disabled={name.trim() === user.name}>
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {user.plan} plan
            </span>
          </div>

          {statusMessage && (
            <p className={`text-sm ${statusMessage.type === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>
              {statusMessage.text}
            </p>
          )}
        </form>
      </section>

      <div className="space-y-6">
        <section className="surface-card rounded-[32px] p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <CreditCard className="h-5 w-5 text-primary" />
            Billing Snapshot
          </h3>

          {isBillingLoading ? (
            <div className="flex min-h-[180px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="mt-3 text-sm text-muted">Loading billing details...</p>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-4 text-sm">
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted">Current Plan</p>
                <p className="mt-2 text-2xl font-semibold text-white">{plan?.tier ?? user.plan}</p>
                <p className="mt-1 text-muted">{plan?.monthlyCredits ?? 0} monthly credits</p>
                <div className="mt-4 h-2 rounded-full bg-white/6">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#83efe0_0%,#48d9c8_55%,#168d87_100%)]"
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Used</p>
                  <p className="mt-2 text-xl font-semibold text-white">{usage?.usedCredits ?? 0}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Remaining</p>
                  <p className="mt-2 text-xl font-semibold text-white">{usage?.remainingCredits ?? 0}</p>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted">Subscription Status</p>
                <p className="mt-2 text-white">{billing?.status ?? 'No active subscription record'}</p>
                <p className="mt-1 text-muted">Period ends: {formatDate(billing?.current_period_end ?? null)}</p>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-[32px] border border-primary/15 bg-primary/5 p-6 shadow-[0_28px_80px_-44px_rgba(0,0,0,0.8)]">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 h-5 w-5 text-primary" />
            <div>
              <h3 className="text-lg font-semibold text-white">Team-ready foundation</h3>
              <p className="mt-2 text-sm leading-6 text-white/75">
                We now have a real settings surface for profile and plan visibility, so expanding this into team roles,
                brand preferences, and notification settings later will be straightforward.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
