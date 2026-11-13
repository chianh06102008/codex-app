// Display text and colors for flood data, shared by all screens.
import type { DepthLevel, Passable } from '@/data/fake-flood-ai';
import type { RiskLevel } from '@/data/fake-weather';

type Badge = { label: string; color: string; background: string };

// Traffic-light colors: green = safe, yellow = careful, red = danger.
const GREEN = { color: '#15803D', background: '#DCFCE7' };
const YELLOW = { color: '#A16207', background: '#FEF9C3' };
const RED = { color: '#B91C1C', background: '#FEE2E2' };

export const RISK_BADGES: Record<RiskLevel, Badge> = {
  low: { label: 'Low risk', ...GREEN },
  medium: { label: 'Medium risk', ...YELLOW },
  high: { label: 'High risk', ...RED },
};

export const PASSABLE_BADGES: Record<Passable, Badge> = {
  yes: { label: 'Motorbike can pass', ...GREEN },
  risky: { label: 'Risky for motorbikes', ...YELLOW },
  no: { label: 'Do not ride through', ...RED },
};

export const DEPTH_LABELS: Record<DepthLevel, string> = {
  ankle: 'Ankle deep',
  half_wheel: 'Half a wheel',
  above_wheel: 'Above the wheel',
};

// "5 min ago", "2 h ago", for the report list.
export function timeAgo(isoDate: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(isoDate).getTime()) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.round(minutes / 60)} h ago`;
}
