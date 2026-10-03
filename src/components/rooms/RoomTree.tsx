import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { Card } from '@/src/components/ui/Card';
import { IconBadge } from '@/src/components/ui/IconBadge';
import type { RoomEntry, RoomNodeView, RoomStatusCounts } from '@/src/types';
import { haptics } from '@/src/utils/haptics';

import { ROOM_INDENT, RoomRow, type RoomsViewContext } from './RoomRow';
import { ROOM_STATUSES, STATUS_LABELS, StatusDot } from './status';

// une icône par niveau de l'arbre : campus, bâtiment, sous-bâtiment, puis le niveau le plus fin
const DEPTH_ICONS = ['city-variant-outline', 'office-building-outline', 'floor-plan', 'layers-outline'];

const NO_ROOMS: RoomEntry[] = [];

function summarize(counts: RoomStatusCounts): string {
  return ROOM_STATUSES.filter((status) => counts[status] > 0)
    .map((status) => `${counts[status]} ${STATUS_LABELS[status][counts[status] > 1 ? 1 : 0]}`)
    .join(', ');
}

function StatusCounts({ counts, ctx }: { counts: RoomStatusCounts; ctx: RoomsViewContext }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginTop: 2 }}>
      {ROOM_STATUSES.filter((status) => counts[status] > 0).map((status) => (
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

interface RoomTreeProps {
  nodes: RoomNodeView[];
  // salles rattachées directement à ce niveau
  rooms?: RoomEntry[];
  depth?: number;
  ctx: RoomsViewContext;
}

// une seule branche ouverte à la fois : ses voisines sont masquées
// les campus (depth 0) sont des cartes, les niveaux suivants s'y emboîtent
export function RoomTree({ nodes, rooms = NO_ROOMS, depth = 0, ctx }: RoomTreeProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const open = nodes.find((node) => node.key === openKey);

  function toggle(key: string) {
    haptics('selection');
    setOpenKey(open?.key === key ? null : key);
    ctx.onTreeChange();
  }

  return (
    <View style={depth === 0 ? { gap: 12 } : undefined}>
      {(open ? [open] : nodes).map((node) => {
        const expanded = node === open;
        const Wrapper = depth === 0 ? CampusCard : View;
        return (
          <Wrapper key={node.key}>
            <NodeHeader node={node} depth={depth} expanded={expanded} onPress={() => toggle(node.key)} ctx={ctx} />
            {expanded && <RoomTree nodes={node.children} rooms={node.rooms} depth={depth + 1} ctx={ctx} />}
          </Wrapper>
        );
      })}
      {!open && rooms.map((entry) => <RoomRow key={entry.room.id} entry={entry} depth={depth - 1} ctx={ctx} />)}
    </View>
  );
}

function CampusCard({ children }: { children: ReactNode }) {
  return <Card padded={false}>{children}</Card>;
}

interface NodeHeaderProps {
  node: RoomNodeView;
  depth: number;
  expanded: boolean;
  onPress: () => void;
  ctx: RoomsViewContext;
}

function NodeHeader({ node, depth, expanded, onPress, ctx }: NodeHeaderProps) {
  const icon = DEPTH_ICONS[Math.min(depth, DEPTH_ICONS.length - 1)];

  return (
    <TouchableRipple
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`${node.name}, ${summarize(node.counts)}`}
      style={{
        paddingVertical: depth === 0 ? 14 : 10,
        paddingLeft: 16 + Math.max(depth - 1, 0) * ROOM_INDENT,
        paddingRight: 16,
        backgroundColor: expanded && depth > 0 ? ctx.highlight : undefined,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {depth === 0 ? <IconBadge icon={icon} size={40} /> : <Icon source={icon} size={22} color={ctx.secondary} />}
        <View style={{ flex: 1 }}>
          <Text variant={depth === 0 ? 'titleMedium' : 'titleSmall'} numberOfLines={2}>
            {node.name}
          </Text>
          <StatusCounts counts={node.counts} ctx={ctx} />
        </View>
        <Icon source={expanded ? 'chevron-up' : 'chevron-down'} size={24} color={ctx.secondary} />
      </View>
    </TouchableRipple>
  );
}
