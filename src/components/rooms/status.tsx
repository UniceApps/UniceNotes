import React from 'react';
import { View } from 'react-native';

import type { RoomStatus } from '@/src/types';

export type StatusColors = Record<RoomStatus, string>;

export const STATUS_LABELS: Record<RoomStatus, [singular: string, plural: string]> = {
  free: ['libre', 'libres'],
  tight: ['juste', 'justes'],
  busy: ['occupée', 'occupées'],
};

export const ROOM_STATUSES = Object.keys(STATUS_LABELS) as RoomStatus[];

export function StatusDot({ color, size = 12 }: { color: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
}
