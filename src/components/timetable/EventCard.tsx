import React from 'react';
import { View } from 'react-native';

import { Text } from 'react-native-paper';

// case d'un cours dans la grille
export function EventCard({ event }: { event: any }) {
  const e = event && event.title !== undefined ? event : event?.event ?? {};
  return (
    <View style={{ padding: 8 }}>
      <Text style={{ fontWeight: 'bold', color: 'black', marginBottom: 4 }}>
        {e.title ?? ''}
      </Text>
      <Text style={{ color: 'black' }}>{e.description ?? ''}</Text>
    </View>
  );
}
