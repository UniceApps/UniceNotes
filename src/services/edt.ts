import { File, Paths } from 'expo-file-system';
import ICAL from 'ical.js';
import type { AdeProject, CalendarEvent, NextClassWidgetProps, NextEvent, WidgetClass } from '../types';
import { stringToColour } from '../utils/color';
import { getAsync, removeAsync, saveAsync } from '../utils/storage';

interface ICALComponent {
  getAllSubcomponents(name: string): unknown[];
}

interface ICALEvent {
  summary: string;
  location: string;
  description: string;
  uid: string;
  startDate: { toJSDate: () => Date };
  endDate: { toJSDate: () => Date };
}

const ADE_BASE = 'https://edtweb.univ-cotedazur.fr';
const CALENDAR_FILE = new File(Paths.document, 'calendar.json');
const ONGOING_THRESHOLD_MS = 15 * 60 * 1000;
const ADE_PROJECT_OVERRIDE_KEY = 'adeProjectOverride';

function getAcademicYearDateRange(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startYear = month >= 9 ? year : year - 1;
  const endYear = startYear + 1;
  return `&firstDate=${startYear}-09-01&lastDate=${endYear}-08-31`;
}

function getCurrentAcademicYearString(): string {
  const now = new Date();
  const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}-${startYear + 1}`;
}

async function fetchSessionId(): Promise<string | null> {
  try {
    // nouveau mode d'authentification de l'API ADE
    // header Basic avec un token codé en base64
    const authHeader = `Basic SW5kaXZpZHVlbDpVbGdrVEdqcmg2OWU=`;

    const res = await fetch(`${ADE_BASE}/jsp/webapi?function=connect`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    });

    if (!res.ok) return null;
    const text = await res.text();
    const match = text.match(/<session id="(.*?)"\s*\/>/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function fetchProjects(sessionId: string): Promise<AdeProject[]> {
  try {
    const res = await fetch(
      `${ADE_BASE}/jsp/webapi?function=getProjects&sessionId=${sessionId}&detail=2`,
    );
    if (!res.ok) return [];
    const text = await res.text();
    const projectRegex = /<project\s+id="(\d+)"\s+name="([^"]*)"/g;
    return Array.from(text.matchAll(projectRegex)).map(([, id, name]) => ({ id, name }));
  } catch {
    return [];
  }
}

function pickAutoProjectId(projects: AdeProject[]): string | null {
  const yearStr = getCurrentAcademicYearString();
  const match = projects.find(
    (p) => p.name.includes(yearStr) && p.name.toLowerCase().includes('prod'),
  );
  return match?.id ?? null;
}

async function getCalendarFromCache(): Promise<CalendarEvent[]> {
  try {
    const json = await CALENDAR_FILE.text();
    return JSON.parse(json) as CalendarEvent[];
  } catch {
    return [];
  }
}

export class EDT {
  private ADE_PROJECT: string | null = null;
  private isOverridden = false;
  private projects: AdeProject[] = [];
  private readonly ADE_DATE: string;
  private readonly _ready: Promise<void>;

  constructor() {
    this.ADE_DATE = getAcademicYearDateRange();
    this._ready = this.resolveProject();
  }

  private async resolveProject(): Promise<void> {
    const sessionId = await fetchSessionId();
    if (!sessionId) return;
    this.projects = await fetchProjects(sessionId);

    const override = await getAsync(ADE_PROJECT_OVERRIDE_KEY);
    if (override) {
      const stillExists = this.projects.some((p) => p.id === override);
      if (stillExists) {
        this.ADE_PROJECT = override;
        this.isOverridden = true;
        return;
      }
      // le projet choisi manuellement n'existe plus (nouvelle année ADE), retour en mode auto
      await removeAsync(ADE_PROJECT_OVERRIDE_KEY);
    }

    this.ADE_PROJECT = pickAutoProjectId(this.projects);
    this.isOverridden = false;
  }

  private waitUntilReady(): Promise<void> {
    return this._ready;
  }

  async getProjectSelection(): Promise<{
    projects: AdeProject[];
    selectedId: string | null;
    isOverridden: boolean;
  }> {
    await this.waitUntilReady();
    return { projects: this.projects, selectedId: this.ADE_PROJECT, isOverridden: this.isOverridden };
  }

  async setProjectOverride(id: string | null): Promise<void> {
    await this.waitUntilReady();
    if (id === null) {
      await removeAsync(ADE_PROJECT_OVERRIDE_KEY);
      this.ADE_PROJECT = pickAutoProjectId(this.projects);
      this.isOverridden = false;
      return;
    }
    if (!this.projects.some((p) => p.id === id)) return;
    await saveAsync(ADE_PROJECT_OVERRIDE_KEY, id);
    this.ADE_PROJECT = id;
    this.isOverridden = true;
  }

  async fetchEDT(adeid: string): Promise<string | null> {
    await this.waitUntilReady();
    if (!this.ADE_PROJECT) return null;
    try {
      const url =
        `${ADE_BASE}/jsp/custom/modules/plannings/anonymous_cal.jsp` +
        `?code=${adeid}&projectId=${this.ADE_PROJECT}&calType=ical${this.ADE_DATE}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      return res.text();
    } catch {
      return null;
    }
  }

  parseICal(icalData: string): ICALEvent[] {
    try {
      const parsed = ICAL.parse(icalData);
      const comp = new ICAL.Component(parsed) as ICALComponent;
      return comp.getAllSubcomponents('vevent').map((v) => new ICAL.Event(v as ICAL.Component) as ICALEvent);
    } catch {
      return [];
    }
  }

  findNextEvent(events: ICALEvent[]): NextEvent {
    const now = new Date();
    const windowStart = new Date(now.getTime() - ONGOING_THRESHOLD_MS);

    const sorted = events
      .map((e) => ({
        start: e.startDate.toJSDate(),
        summary: e.summary ?? 'Cours inconnu',
        location: e.location ?? '',
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const next = sorted.find((e) => e.start >= windowStart);
    if (!next) return { summary: 'Aucun cours', location: 'Profitez-en !' };
    return { summary: next.summary, location: next.location };
  }

  async getNextEvent(adeid: string): Promise<NextEvent> {
    const icalData = await this.fetchEDT(adeid);
    if (!icalData) {
      return { summary: 'ADE Indisponible', location: 'Impossible de récupérer le cours.' };
    }
    const events = this.parseICal(icalData);
    return this.findNextEvent(events);
  }

  private convertToCalendarEvents(events: ICALEvent[]): CalendarEvent[] {
    return events.map((e, index) => ({
      id: e.uid ?? String(index),
      start: { dateTime: e.startDate.toJSDate().toISOString() },
      end: { dateTime: e.endDate.toJSDate().toISOString() },
      title: e.summary ?? '',
      subtitle: e.description ?? '',
      description: e.location ?? '',
      color: stringToColour(e.summary ?? ''),
    }));
  }

  async getEDT(adeid: string): Promise<CalendarEvent[]> {
    if (!adeid || adeid === 'demo') return [];

    const icalData = await this.fetchEDT(adeid);
    if (!icalData) return getCalendarFromCache();
    const events = this.parseICal(icalData);
    const calEvents = this.convertToCalendarEvents(events);
    try {
      CALENDAR_FILE.write(JSON.stringify(calEvents));
    } catch { }
    return calEvents;
  }

  // Widget
  findNextTwoCourses(events: ICALEvent[]): WidgetClass[] {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 15 * 60 * 1000);

    const pad = (n: number) => String(n).padStart(2, '0');
    const fmt = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

    return events
      .map((e) => ({
        start: e.startDate.toJSDate(),
        end: e.endDate.toJSDate(),
        title: e.summary ?? 'Cours inconnu',
        room: e.location ?? '',
      }))
      .filter((e) => e.start >= windowStart)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 2)
      .map((e) => ({
        title: e.title,
        room: e.room,
        startTime: fmt(e.start),
        endTime: fmt(e.end),
      }));
  }

  async getNextTwoCourses(adeid: string): Promise<WidgetClass[]> {
    const icalData = await this.fetchEDT(adeid);
    if (!icalData) return [];
    const events = this.parseICal(icalData);
    return this.findNextTwoCourses(events);
  }

  buildWidgetTimeline(
    events: CalendarEvent[],
  ): Array<{ date: Date; props: NextClassWidgetProps }> {
    if (events.length === 0) {
      return [
        {
          date: new Date(),
          props: { courses: [], configured: false },
        },
      ];
    }

    const now = new Date();
    const cutoff = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    const pad = (n: number) => String(n).padStart(2, '0');
    const fmt = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

    // Tous les cours futurs triés par heure de début
    const allFuture = events
      .filter((e) => new Date(e.end.dateTime) > now)
      .sort(
        (a, b) =>
          new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime(),
      );

    // Les 2 prochains cours non encore terminés à partir d'un instant donné
    const getCoursesAt = (from: Date): WidgetClass[] =>
      allFuture
        .filter((e) => new Date(e.end.dateTime) > from)
        .slice(0, 2)
        .map((e) => ({
          title: e.title,
          room: e.description, // description = location dans CalendarEvent
          startTime: fmt(new Date(e.start.dateTime)),
          endTime: fmt(new Date(e.end.dateTime)),
        }));

    const seen = new Set<number>();
    const timeline: Array<{ date: Date; props: NextClassWidgetProps }> = [];

    seen.add(now.getTime());
    timeline.push({ date: now, props: { courses: getCoursesAt(now), configured: true } });

    // Une entrée à chaque fin de cours dans les 24h
    for (const event of allFuture) {
      const endDate = new Date(event.end.dateTime);
      const ms = endDate.getTime();
      if (endDate <= cutoff && !seen.has(ms)) {
        seen.add(ms);
        timeline.push({ date: endDate, props: { courses: getCoursesAt(endDate), configured: true } });
      }
    }

    return timeline;
  }
}

export const edtService = new EDT();