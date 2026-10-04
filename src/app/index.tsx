import { Redirect } from 'expo-router';

import { useSettings } from '@/src/context/SettingsContext';

export default function Index() {
  const { oobeCompleted } = useSettings();
  return <Redirect href={oobeCompleted ? '/home' : '/oobe'} />;
}
