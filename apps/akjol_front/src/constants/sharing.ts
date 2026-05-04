export type ShareDurationOption = {
  label: string;
  ttlMs: number;
};

export const SHARE_DURATION_OPTIONS: ShareDurationOption[] = [
  { label: '24h', ttlMs: 24 * 60 * 60 * 1000 },
  { label: '7 jours', ttlMs: 7 * 24 * 60 * 60 * 1000 },
  { label: '30 jours', ttlMs: 30 * 24 * 60 * 60 * 1000 }
];
