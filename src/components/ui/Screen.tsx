import { Children, isValidElement, type ReactElement, type ReactNode, type Ref } from 'react';
import { Platform, ScrollView, View, type RefreshControlProps, type ScrollViewProps } from 'react-native';

import Animated, { FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContentScrollMarker } from '@/modules/content-scroll';
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
    tab,
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
  // onglet : iOS ajoute la hauteur de la barre d'onglets, Android s'arrête au-dessus
  const bottom = tab ? 24 : insets.bottom + 24;
  // demandé à iOS : react-native-screens ne trouve pas cette ScrollView imbriquée
  const insetBehavior = tab && Platform.OS === 'ios' ? 'automatic' : undefined;

  const blocks = [
    <View key="header">
      {header ?? <ScreenHeader title={title} subtitle={subtitle} modal={modal} tab={tab} actions={actions} />}
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
        contentInsetAdjustmentBehavior={insetBehavior}
        refreshControl={refreshControl}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: bottom }}
      >
        {/* iOS 26 : la barre d'onglets se réduit quand on fait défiler cette liste */}
        {tab && <ContentScrollMarker />}
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
