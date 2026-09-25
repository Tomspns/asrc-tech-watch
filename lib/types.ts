export type Horizon = 'H1' | 'H2' | 'H3';
export type Item = {
  id: string; date: string; horizon: Horizon; title: string; summary: string;
  source: string; url: string; verified: boolean; tags: string[];
};
export type Measurement = {
  date: string; horizon: Horizon; frequency: string; itemsCollected: number;
  itemsRelevant: number; itemsVerified: number; duplicates: number;
  weakSignals: number; note: string; source: string; sourceUrl: string;
};
export type WatchData = { lastUpdated: string; measurements: Measurement[]; items: Item[] };
