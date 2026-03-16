import type { UserPlan } from './authService';
import { apiFetch } from './apiClient';

export interface UsageSummary {
  usedCredits: number;
  remainingCredits: number;
  limit: number;
}

export interface GenerationRecord {
  id: string;
  project_id: string | null;
  type: 'BANNER_PLAN' | 'IMAGE_GENERATION' | 'IMAGE_EDIT';
  status: 'SUCCESS' | 'FAILED';
  prompt: string;
  aspect_ratio: string | null;
  error_message: string | null;
  created_at: string;
}

type GenerationsResponse = {
  generations: GenerationRecord[];
  usage: UsageSummary;
};

export interface PlanSummary {
  tier: UserPlan;
  monthlyCredits: number;
  projectLimit: number;
  maxTeamMembers: number;
}

export interface BillingSummary {
  id: string;
  user_id: string;
  provider: string | null;
  customer_id: string | null;
  subscription_id: string | null;
  status: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

type BillingResponse = {
  plan: PlanSummary;
  usage: UsageSummary;
  billing: BillingSummary | null;
};

export const getGenerationActivity = async () => {
  return apiFetch<GenerationsResponse>('/generations');
};

export const getBillingSummary = async () => {
  return apiFetch<BillingResponse>('/billing/summary');
};
