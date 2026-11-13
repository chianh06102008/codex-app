// The list of flooded streets reported by users.
//
// For now the list lives in the phone's memory only: it starts with a few fake
// reports, and "Share warning" adds new ones. It resets when the app restarts,
// and other phones do not see it. Later, a teammate can replace this with a real
// server so reports are shared between users.
import { useSyncExternalStore } from 'react';

import type { DepthLevel, Passable } from './fake-flood-ai';

export type FloodReport = {
  id: string;
  district: string;
  street: string;
  depth_level: DepthLevel;
  depth_cm: number;
  passable: Passable;
  photoUri?: string; // fake reports have no photo
  reported_at: string; // ISO date string
};

// A time `minutes` ago, as an ISO date string.
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

let reports: FloodReport[] = [
  { id: 'seed-1', district: 'Thanh Xuân', street: 'Nguyễn Trãi', depth_level: 'half_wheel', depth_cm: 25, passable: 'risky', reported_at: minutesAgo(12) },
  { id: 'seed-2', district: 'Thanh Xuân', street: 'Khuất Duy Tiến', depth_level: 'ankle', depth_cm: 8, passable: 'yes', reported_at: minutesAgo(35) },
  { id: 'seed-3', district: 'Đống Đa', street: 'Láng', depth_level: 'above_wheel', depth_cm: 40, passable: 'no', reported_at: minutesAgo(20) },
  { id: 'seed-4', district: 'Hoàng Mai', street: 'Giải Phóng', depth_level: 'half_wheel', depth_cm: 30, passable: 'risky', reported_at: minutesAgo(5) },
  { id: 'seed-5', district: 'Cầu Giấy', street: 'Trần Duy Hưng', depth_level: 'ankle', depth_cm: 10, passable: 'yes', reported_at: minutesAgo(50) },
];

// Screens that show the list "subscribe" so they redraw when a report is added.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Add a new report to the top of the list and tell every screen to redraw.
export function addReport(report: Omit<FloodReport, 'id' | 'reported_at'>) {
  const newReport: FloodReport = {
    ...report,
    id: String(Date.now()),
    reported_at: new Date().toISOString(),
  };
  reports = [newReport, ...reports];
  listeners.forEach((listener) => listener());
}

// React hook: returns the current list and redraws the screen when it changes.
export function useFloodReports(): FloodReport[] {
  return useSyncExternalStore(subscribe, () => reports);
}
