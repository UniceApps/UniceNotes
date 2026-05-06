import { File, Paths } from 'expo-file-system';
import { stringToColour } from '../utils/color';
import type { CalendarEvent, NextEvent } from '../types';

const ICAL = require('ical.js') as {
  parse: (input: string) => unknown[];
  Component: new (jcalData: unknown) => ICALComponent;
  Event: new (component: unknown) => ICALEvent;
};

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

class EDTDate {
  ADE_DATE: string;

  constructor() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const startYear = month >= 9 ? year : year - 1;
    const endYear = startYear + 1;
    this.ADE_DATE = `&firstDate=${startYear}-09-01&lastDate=${endYear}-08-31`;
  }
}

class EDTConfig {
  async getSessionId(): Promise<string | null> {
    try {
      const res = await fetch(
        `${ADE_BASE}/jsp/webapi?function=connect&login=Individuel&password=`,
      );
      if (!res.ok) return null;
      const text = await res.text();
      const match = text.match(/<session id="(.*?)"\s*\/>/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  async getProjects(sessionId: string): Promise<string | null> {
    try {
      const res = await fetch(
        `${ADE_BASE}/jsp/webapi?function=getProjects&sessionId=${sessionId}&detail=2`,
      );
      if (!res.ok) return null;
      const text = await res.text();
      const now = new Date();
      const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
      const yearStr = `${startYear}-${startYear + 1}`;
      const projectRegex = /<project\s+id="(\d+)"\s+name="([^"]*)"/g;
      const matches = text.matchAll(projectRegex);

      for (const match of matches) {
        const [_, id, name] = match;

        if (name.includes(yearStr) && name.toLowerCase().includes('prod')) {
          return id;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  async getConfig(): Promise<string | null> {
    const sessionId = await this.getSessionId();
    if (!sessionId) return null;
    return this.getProjects(sessionId);
  }
}

export class EDT {
  private ADE_PROJECT: string | null = null;
  private ADE_DATE: string;
  READY = false;

  constructor() {
    this.ADE_DATE = new EDTDate().ADE_DATE;
    new EDTConfig().getConfig().then((projectId) => {
      this.ADE_PROJECT = projectId;
      this.READY = true;
    });
  }

  private waitUntilReady(): Promise<void> {
    if (this.READY) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (this.READY) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, 10000);
    });
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
      const comp = new ICAL.Component(parsed);
      return comp.getAllSubcomponents('vevent').map((v) => new ICAL.Event(v));
    } catch {
      return [];
    }
  }

  findNextEvent(events: ICALEvent[]): NextEvent {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 15 * 60 * 1000);

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
    const icalData = await this.fetchEDT(adeid);
    if (!icalData) return getCalendarFromCache();
    const events = this.parseICal(icalData);
    const calEvents = this.convertToCalendarEvents(events);
    try {
      CALENDAR_FILE.write(JSON.stringify(calEvents));
    } catch { }
    return calEvents;
  }
}

async function getCalendarFromCache(): Promise<CalendarEvent[]> {
  try {
    const json = await CALENDAR_FILE.text();
    return JSON.parse(json) as CalendarEvent[];
  } catch {
    return [];
  }
}

export const edtService = new EDT();
