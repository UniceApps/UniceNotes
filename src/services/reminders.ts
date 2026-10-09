import { Alert, Linking, Platform } from 'react-native';

import * as Notifications from 'expo-notifications';

import type { CalendarEvent } from '@/src/types';
import { DAY_MS, formatClock } from '@/src/utils/date';

export const NOTIFICATIONS_SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';
const CHANNEL_ID = 'exams';
const REMINDER_LEAD_MS = DAY_MS;

// rappel affiché même app ouverte
if (NOTIFICATIONS_SUPPORTED) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Rappels de DS',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

// false si les notifications sont refusées
export async function requestReminderPermission(): Promise<boolean> {
  if (!NOTIFICATIONS_SUPPORTED) return false;
  try {
    // android 13 : le canal doit exister avant la demande
    await ensureChannel();
    const { granted } = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true } });
    return granted;
  } catch {
    return false;
  }
}

// notifications refusées par le système : renvoie vers les réglages
export function alertNotificationsDenied(message: string): void {
  Alert.alert('Notifications désactivées', message, [
    { text: 'Plus tard', style: 'cancel' },
    { text: 'Réglages', onPress: () => Linking.openSettings() },
  ]);
}

function buildContent(event: CalendarEvent): Notifications.NotificationContentInput {
  const start = new Date(event.start.dateTime);
  return {
    title: `DS demain à ${formatClock(start)}`,
    body: [event.title || 'Cours sans titre', event.room].filter(Boolean).join(' · '),
    data: { url: 'unicenotes://edt' },
  };
}

async function syncReminders(events: CalendarEvent[] | null, exams: ReadonlySet<string>): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!events || exams.size === 0) return;
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;
  await ensureChannel();

  const now = Date.now();
  const reminders = events
    .filter((event) => exams.has(event.id))
    .map((event) => ({ event, at: new Date(event.start.dateTime).getTime() - REMINDER_LEAD_MS }))
    .filter(({ at }) => at > now);

  await Promise.all(
    reminders.map(({ event, at }) =>
      Notifications.scheduleNotificationAsync({
        identifier: `exam-${event.id}`,
        content: buildContent(event),
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL_ID },
      }),
    ),
  );
}

let queue: Promise<void> = Promise.resolve();

export function updateExamReminders(events: CalendarEvent[] | null, exams: ReadonlySet<string>): void {
  if (!NOTIFICATIONS_SUPPORTED) return;
  queue = queue
    .then(() => syncReminders(events, exams))
    .catch(() => {
      // notifications indisponibles
    });
}

// rappel touché, au lancement ou app ouverte
export function addReminderTapListener(listener: (url: unknown) => void): () => void {
  if (!NOTIFICATIONS_SUPPORTED) return () => {};
  const handle = (response: Notifications.NotificationResponse | null) => {
    if (!response) return;
    Notifications.clearLastNotificationResponse();
    listener(response.notification.request.content.data?.url);
  };
  handle(Notifications.getLastNotificationResponse());
  const subscription = Notifications.addNotificationResponseReceivedListener(handle);
  return () => subscription.remove();
}
