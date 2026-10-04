import { useEffect } from 'react';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { TimetableScreen } from '@/src/components/timetable/TimetableScreen';
import { isValidEdtCode } from '@/src/utils/deeplink';

// edt d'un autre code ADE, ouvert par un lien unicenotes://edt/{code} : lecture seule
export default function SharedTimetableScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const tempCode = isValidEdtCode(code) ? code : null;

  // code invalide : rien n'est chargé ni affiché
  useEffect(() => {
    if (tempCode) return;
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }, [tempCode, router]);

  if (!tempCode) return null;
  return <TimetableScreen tempCode={tempCode} />;
}
