import type { WidgetTimelineEntry } from '@/src/types';

// pas de widget hors iOS et Android
export const NextClassWidgetInstance = {
  updateTimeline: (_entries: WidgetTimelineEntry[]) => {},
};
