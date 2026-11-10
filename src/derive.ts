import { pbkdf2Sync } from 'node:crypto';
export function derive(seed: string, id: string, iterations: number) {
  return pbkdf2Sync(seed + ':' + id, 'cidr-graph-v1', iterations, 32, 'sha256').toString('hex');
}
