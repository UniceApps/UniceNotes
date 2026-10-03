import { Children, isValidElement, type ReactElement, type ReactNode, type Ref } from 'react';
import { Platform, ScrollView, View, type RefreshControlProps, type ScrollViewProps } from 'react-native';

import Animated, { FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/src/theme';

import { enter, layout } from './motion';
import { ScreenHeader, type ScreenHeaderProps } from './ScreenHeader';

interface ScreenProps extends Partial<ScreenHeaderProps> {
  // remplace l'en-tête standard (accueil)
  header?: ReactNode;
  refreshControl?: ReactElement<RefreshControlProps>;
  scrollRef?: Ref<ScrollView>;
  onScroll?: ScrollViewProps['onScroll'];
  // posé par-dessus la page : feuilles, snackbar…
  overlay?: ReactNode;
  children: ReactNode;
}

// page défilante : en-tête puis blocs espacés, qui apparaissent en cascade
export function Screen(props: ScreenProps) {
  const {
    title = '',
    subtitle,
    modal,
    actions,
    header,
    refreshControl,
    scrollRef,
    onScroll,
    overlay,
    children,
  } = props;
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  // une modale iOS s'ouvre déjà sous la barre d'état
  const top = modal && Platform.OS === 'ios' ? 8 : insets.top;

  const blocks = [
    <View key="header">
      {header ?? <ScreenHeader title={title} subtitle={subtitle} modal={modal} actions={actions} />}
    </View>,
    ...Children.toArray(children),
  ];

  return (
    <View style={{ flex: 1, paddingTop: top, backgroundColor: theme.colors.background }}>
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={64}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        refreshControl={refreshControl}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 24 }}
      >
        <View style={{ width: '100%', maxWidth: 600, alignSelf: 'center', gap: 24 }}>
          {blocks.map((block, index) => (
            <Animated.View
              key={isValidElement(block) ? block.key : index}
              entering={enter(index)}
              exiting={FadeOut}
              layout={layout}
            >
              {block}
            </Animated.View>
          ))}
        </View>
      </ScrollView>
      {overlay}
    </View>
  );
}
