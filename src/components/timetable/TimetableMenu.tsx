import React from 'react';

import { Appbar, Divider, Menu } from 'react-native-paper';

interface TimetableMenuProps {
  visible: boolean;
  onToggle: () => void;
  code: string;
  zoomIcon: string;
  onOtherEdt: () => void;
  onToday: () => void;
  onChangeView: () => void;
  onSettings: () => void;
}

export function TimetableMenu({
  visible,
  onToggle,
  code,
  zoomIcon,
  onOtherEdt,
  onToday,
  onChangeView,
  onSettings,
}: TimetableMenuProps) {
  return (
    <Menu
      visible={visible}
      onDismiss={onToggle}
      anchor={<Appbar.Action icon="dots-vertical" onPress={onToggle} />}
    >
      <Menu.Item title={code} />
      <Menu.Item leadingIcon="magnify" onPress={onOtherEdt} title="Voir un autre EDT" />
      <Divider />
      <Menu.Item leadingIcon="update" onPress={onToday} title="Aujourd'hui" />
      <Menu.Item leadingIcon={zoomIcon} onPress={onChangeView} title="Changer la vue" />
      <Divider />
      <Menu.Item leadingIcon="cog" onPress={onSettings} title="Paramètres" />
    </Menu>
  );
}
