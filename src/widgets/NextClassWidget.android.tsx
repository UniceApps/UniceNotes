import React from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FlexWidget,
  registerWidgetTaskHandler,
  requestWidgetUpdate,
  TextWidget,
  type ColorProp,
  type WidgetInfo,
  type WidgetRepresentation,
} from 'react-native-android-widget';

import type { NextClassWidgetProps, WidgetClass } from '../types';

// 4x2 et 2x2 par défaut
const WIDGET_NAMES = ['NextClassWidget', 'NextClassWidgetSmall'];

const TIMELINE_KEY = 'androidWidgetTimeline';
const WIDE_MIN_DP = 230;
const EDT_URI = 'unicenotes://edt';

interface StoredEntry {
  date: number;
  props: NextClassWidgetProps;
}

interface Palette {
  background: ColorProp;
  panel: ColorProp;
  text: ColorProp;
  secondary: ColorProp;
  accent: ColorProp;
}

const LIGHT: Palette = {
  background: '#FFFFFF',
  panel: '#F1F3F4',
  text: '#1B1B1F',
  secondary: '#5F6368',
  accent: '#00629F',
};

const DARK: Palette = {
  background: '#1E1F22',
  panel: '#2A2B2F',
  text: '#E3E2E6',
  secondary: '#A8ABB0',
  accent: '#9BCBFF',
};

// ---
// Stockage
// ---

type Entry = { date: Date; props: NextClassWidgetProps };

async function saveTimeline(entries: Entry[]): Promise<void> {
  const stored: StoredEntry[] = entries.map((e) => ({ date: e.date.getTime(), props: e.props }));
  await AsyncStorage.setItem(TIMELINE_KEY, JSON.stringify(stored));
}

async function loadTimeline(): Promise<StoredEntry[] | null> {
  try {
    const raw = await AsyncStorage.getItem(TIMELINE_KEY);
    const value: unknown = raw ? JSON.parse(raw) : null;
    return Array.isArray(value) && value.length > 0 ? (value as StoredEntry[]) : null;
  } catch {
    return null;
  }
}

// dernière entrée commencée, sans les cours terminés depuis
function currentProps(timeline: StoredEntry[] | null, now: number): NextClassWidgetProps {
  if (!timeline) return { courses: [] };

  const entry = timeline.filter((e) => e.date <= now).pop() ?? timeline[0];
  if (entry.props.configured === false) return entry.props;

  const all = entry.props.courses ?? [];
  const courses = all.filter((c) => !c.endsAt || c.endsAt > now);
  if (courses.length === 0 && all.length >= 3) return { courses: [] };
  return { courses, configured: true };
}

// ---
// Rendu
// ---

function courseColor(c: WidgetClass): ColorProp {
  return c.color && /^#[0-9a-f]{6}$/i.test(c.color) ? (c.color as ColorProp) : '#9E9E9E';
}

function Header({ palette, compact }: { palette: Palette; compact: boolean }) {
  return (
    <TextWidget
      text="UniceNotes"
      style={{ fontSize: compact ? 11 : 12, color: palette.accent, fontWeight: '500' }}
    />
  );
}

function MainCourse({ course, palette, compact }: { course: WidgetClass; palette: Palette; compact: boolean }) {
  const time = compact ? `${course.startTime}–${course.endTime}` : `${course.startTime} – ${course.endTime}`;
  return (
    <FlexWidget style={{ flexDirection: 'column', width: 'match_parent' }}>
      <TextWidget
        text={time}
        maxLines={1}
        style={{ fontSize: compact ? 11 : 12, color: palette.secondary, marginBottom: 3 }}
      />
      <FlexWidget style={{ flexDirection: 'row', width: 'match_parent', alignItems: 'center' }}>
        <FlexWidget
          style={{
            width: compact ? 3 : 4,
            height: compact ? 44 : 38,
            borderRadius: 2,
            backgroundColor: courseColor(course),
            marginRight: compact ? 6 : 8,
          }}
        />
        <FlexWidget style={{ flexDirection: 'column', flex: 1 }}>
          <TextWidget
            text={course.title}
            maxLines={3}
            truncate="END"
            style={{ fontSize: compact ? 14 : 16, fontWeight: '600', color: palette.text }}
          />
          <TextWidget
            text={course.room || 'Salle non précisée'}
            maxLines={compact ? 1 : 2}
            truncate="END"
            style={{ fontSize: compact ? 11 : 12, color: palette.secondary }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}

function NextCourse({ course, palette }: { course: WidgetClass; palette: Palette }) {
  return (
    <FlexWidget style={{ flexDirection: 'row', width: 'match_parent', alignItems: 'center', marginTop: 8 }}>
      <FlexWidget
        style={{ width: 3, height: 28, borderRadius: 2, backgroundColor: courseColor(course), marginRight: 6 }}
      />
      <FlexWidget style={{ flexDirection: 'column', flex: 1 }}>
        <TextWidget
          text={course.title}
          maxLines={1}
          truncate="END"
          style={{ fontSize: 13, fontWeight: '600', color: palette.text }}
        />
        <TextWidget
          text={`${course.startTime} · ${course.room || 'Salle non précisée'}`}
          maxLines={1}
          truncate="END"
          style={{ fontSize: 11, color: palette.secondary }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

function NextClassWidget({
  props,
  palette,
  wide,
}: {
  props: NextClassWidgetProps;
  palette: Palette;
  wide: boolean;
}) {
  const compact = !wide;
  const root = {
    height: 'match_parent',
    width: 'match_parent',
    backgroundColor: palette.background,
    borderRadius: 22,
    padding: compact ? 12 : 14,
  } as const;

  // EDT non configuré ou timeline expirée
  if (props.configured !== true) {
    const text =
      props.configured === false
        ? compact
          ? "Configure ton EDT dans l'app"
          : 'Ouvre UniceNotes et configure ton EDT pour voir tes prochains cours ici.'
        : compact
          ? 'Ouvre UniceNotes pour mettre à jour'
          : "Ouvre UniceNotes pour mettre à jour l'emploi du temps.";
    return (
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: EDT_URI }}
        style={{ ...root, flexDirection: 'column', justifyContent: 'space-between' }}
      >
        <Header palette={palette} compact={compact} />
        <TextWidget text={text} maxLines={4} style={{ fontSize: compact ? 12 : 13, color: palette.secondary }} />
      </FlexWidget>
    );
  }

  const [main, ...upNext] = props.courses;

  const mainColumn = (
    <FlexWidget style={{ flexDirection: 'column', justifyContent: 'space-between', flex: 1, height: 'match_parent' }}>
      <Header palette={palette} compact={compact} />
      {main ? (
        <MainCourse course={main} palette={palette} compact={compact} />
      ) : (
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget
            text="Aucun cours"
            style={{ fontSize: compact ? 14 : 16, fontWeight: '600', color: palette.text }}
          />
          <TextWidget text="Profites-en !" style={{ fontSize: compact ? 11 : 12, color: palette.secondary }} />
        </FlexWidget>
      )}
    </FlexWidget>
  );

  if (compact) {
    return (
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: EDT_URI }}
        style={{ ...root, flexDirection: 'column' }}
      >
        {mainColumn}
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: EDT_URI }}
      style={{ ...root, flexDirection: 'row', flexGap: 12 }}
    >
      {mainColumn}
      <FlexWidget
        style={{
          flexDirection: 'column',
          flex: 1,
          height: 'match_parent',
          backgroundColor: palette.panel,
          borderRadius: 14,
          padding: 10,
        }}
      >
        <TextWidget text="À suivre" style={{ fontSize: 13, fontWeight: '600', color: palette.text }} />
        {upNext.length > 0 ? (
          upNext.slice(0, 2).map((c, i) => <NextCourse key={i} course={c} palette={palette} />)
        ) : (
          <TextWidget
            text="Rien d'autre de prévu"
            style={{ fontSize: 11, color: palette.secondary, marginTop: 8 }}
          />
        )}
      </FlexWidget>
    </FlexWidget>
  );
}

async function renderNextClassWidget(info: WidgetInfo): Promise<WidgetRepresentation> {
  const props = currentProps(await loadTimeline(), Date.now());
  const wide = info.width >= WIDE_MIN_DP;
  return {
    light: <NextClassWidget props={props} palette={LIGHT} wide={wide} />,
    dark: <NextClassWidget props={props} palette={DARK} wide={wide} />,
  };
}

function redrawAll(): Promise<void[]> {
  return Promise.all(
    WIDGET_NAMES.map((widgetName) => requestWidgetUpdate({ widgetName, renderWidget: renderNextClassWidget })),
  );
}

// ---
// Tâches de fond
// ---

registerWidgetTaskHandler(async ({ widgetInfo, widgetAction, renderWidget }) => {
  if (!WIDGET_NAMES.includes(widgetInfo.widgetName)) return;
  if (widgetAction === 'WIDGET_DELETED' || widgetAction === 'WIDGET_CLICK') return;
  renderWidget(await renderNextClassWidget(widgetInfo));
});

// même interface que le widget iOS
export const NextClassWidgetInstance = {
  updateTimeline: (entries: Entry[]) => {
    saveTimeline(entries)
      .then(redrawAll)
      .catch(() => {});
  },
  updateSnapshot: (props: NextClassWidgetProps) => {
    NextClassWidgetInstance.updateTimeline([{ date: new Date(), props }]);
  },
  getTimeline: () => Promise.resolve([] as Entry[]),
  reload: () => {
    redrawAll().catch(() => {});
  },
};
