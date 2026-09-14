// src/utils/doseUtils.ts

export type DoseStatus = 'due' | 'taken' | 'later';

export interface Dose {
  id: string;
  status: DoseStatus;
}

/**
 * Groups doses into three buckets by status
 */
export function groupDoses(doses: Dose[]): {
  due: Dose[];
  taken: Dose[];
  later: Dose[];
} {
  return {
    due: doses.filter((d) => d.status === 'due'),
    taken: doses.filter((d) => d.status === 'taken'),
    later: doses.filter((d) => d.status === 'later'),
  };
}

/**
 * Returns the percent of doses taken (0-100)
 */
export function dosesTakenPercent(doses: Dose[]): number {
  if (doses.length === 0) return 0;
  const taken = doses.filter((d) => d.status === 'taken').length;
  return Math.round((taken / doses.length) * 100);
}