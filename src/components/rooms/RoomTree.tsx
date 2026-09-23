import React, { useState } from 'react';
import { View } from 'react-native';

import { Divider, Icon, Text, TouchableRipple } from 'react-native-paper';

import type { RoomEntry, RoomNodeView, RoomStatusCounts } from '@/src/types';
import { haptics } from '@/src/utils/haptics';

import { ROOM_INDENT, RoomRow, type RoomsViewContext } from './RoomRow';
import { ROOM_STATUSES, STATUS_LABELS, StatusDot } from './status';

// une icône par niveau de l'arbre : campus, bâtiment, sous-bâtiment, puis le niveau le plus fin
const DEPTH_ICONS = ['city-variant-outline', 'office-building-outline', 'floor-plan', 'layers-outline'];

function summarize(counts: RoomStatusCounts): string {
  return ROOM_STATUSES
    .filter((status) => counts[status] > 0)
    .map((status) => `${counts[status]} ${STATUS_LABELS[status][counts[status] > 1 ? 1 : 0]}`)
    .join(', ');
}

function StatusCounts({ counts, ctx }: { counts: RoomStatusCounts; ctx: RoomsViewContext }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginTop: 2 }}>
      {ROOM_STATUSES
        .filter((status) => counts[status] > 0)
        .map((status) => (
          <View key={status} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <StatusDot color={ctx.colors[status]} size={8} />
            <Text variant="labelMedium" style={{ color: ctx.secondary }}>
              {counts[status]}
            </Text>
          </View>
        ))}
    </View>
  );
}

// Une seule branche ouverte à la fois
export function RoomTree({
  nodes,
  rooms,
  depth,
  ctx,
}: {
  nodes: RoomNodeView[];
  rooms: RoomEntry[];
  depth: number;
  ctx: RoomsViewContext;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const open = nodes.find((node) => node.key === openKey);

  function toggle(key: string) {
    haptics('selection');
    setOpenKey(open?.key === key ? null : key);
    ctx.onTreeChange();
  }

  return (
    <>
      {(open ? [open] : nodes).map((node) => (
        <NodeSection
          key={node.key}
          node={node}
          depth={depth}
          expanded={node === open}
          onPress={() => toggle(node.key)}
          ctx={ctx}
        />
      ))}
      {!open &&
        rooms.map((entry) => <RoomRow key={entry.room.id} entry={entry} depth={depth} ctx={ctx} />)}
    </>
  );
}

function NodeSection({
  node,
  depth,
  expanded,
  onPress,
  ctx,
}: {
  node: RoomNodeView;
  depth: number;
  expanded: boolean;
  onPress: () => void;
  ctx: RoomsViewContext;
}) {
  return (
    <View>
      <TouchableRipple
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${node.name}, ${summarize(node.counts)}`}
        style={{
          paddingVertical: 10,
          paddingLeft: 25 + depth * ROOM_INDENT,
          paddingRight: 25,
          backgroundColor: expanded ? ctx.highlight : undefined,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon source={DEPTH_ICONS[Math.min(depth, DEPTH_ICONS.length - 1)]} size={24} />
          <View style={{ flex: 1 }}>
            <Text variant={depth === 0 ? 'titleMedium' : 'titleSmall'} numberOfLines={2}>
              {node.name}
            </Text>
            <StatusCounts counts={node.counts} ctx={ctx} />
          </View>
          <Icon source={expanded ? 'chevron-up' : 'chevron-down'} size={24} />
        </View>
      </TouchableRipple>

      {expanded && <RoomTree nodes={node.children} rooms={node.rooms} depth={depth + 1} ctx={ctx} />}
      {depth === 0 && <Divider />}
    </View>
  );
}
