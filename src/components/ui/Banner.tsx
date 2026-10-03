import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Button, Icon, Text } from 'react-native-paper';

import { getToneColors, useAppTheme, type Tone } from '@/src/theme';

interface BannerProps {
  icon: string;
  text: string;
  tone?: Tone;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
}

// bandeau d'information (hors ligne, edt temporaire…)
export function Banner({ icon, text, tone = 'primary', action, style }: BannerProps) {
  const theme = useAppTheme();
  const { container, onContainer } = getToneColors(theme, tone);

  return (
    <View
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          minHeight: 48,
          paddingLeft: 16,
          paddingRight: action ? 4 : 16,
          paddingVertical: 6,
          borderRadius: 16,
          backgroundColor: container,
        },
        style,
      ]}
    >
      <Icon source={icon} size={20} color={onContainer} />
      <Text variant="labelLarge" style={{ flex: 1, color: onContainer }}>
        {text}
      </Text>
      {action && (
        <Button compact textColor={onContainer} onPress={action.onPress}>
          {action.label}
        </Button>
      )}
    </View>
  );
}
