import { Children, Fragment, type ReactNode } from 'react';
import { View } from 'react-native';

import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { useAppTheme, type Tone } from '@/src/theme';

import { Card } from './Card';
import { IconBadge } from './IconBadge';

export function ListGroup({ children }: { children: ReactNode }) {
  const theme = useAppTheme();
  const items = Children.toArray(children);

  return (
    <Card padded={false}>
      {items.map((item, index) => (
        <Fragment key={index}>
          {index > 0 && (
            <View style={{ height: 1, marginLeft: 72, backgroundColor: theme.colors.outlineVariant, opacity: 0.6 }} />
          )}
          {item}
        </Fragment>
      ))}
    </Card>
  );
}

interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: string;
  tone?: Tone;
  // élément à droite (interrupteur, statut…), par défaut un chevron si la ligne est pressable
  right?: ReactNode;
  // lien vers l'extérieur : icône dédiée au lieu du chevron
  external?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

export function ListItem({ title, subtitle, icon, tone, right, external, onPress, disabled }: ListItemProps) {
  const theme = useAppTheme();
  const color = tone === 'error' ? theme.colors.error : theme.colors.onSurface;
  const trailing =
    right !== undefined
      ? right
      : onPress && (
          <Icon
            source={external ? 'open-in-new' : 'chevron-right'}
            size={external ? 20 : 24}
            color={theme.colors.onSurfaceVariant}
          />
        );

  return (
    <TouchableRipple
      disabled={disabled || !onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      onPress={onPress}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          minHeight: 64,
          paddingVertical: 12,
          paddingHorizontal: 16,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {icon && <IconBadge icon={icon} tone={tone} size={40} />}
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={{ color }}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {subtitle}
            </Text>
          )}
        </View>
        {trailing}
      </View>
    </TouchableRipple>
  );
}
