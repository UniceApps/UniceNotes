import type { AdeProject } from '@/src/types';
import { withTimeout } from '@/src/utils/network';
import { storage } from '@/src/utils/storage';

// API ADE : voir .docs/ADE_API.md
export const ADE_URL = 'https://edtweb.univ-cotedazur.fr';

const PROJECTS_TIMEOUT_MS = 5000;

export interface ProjectSelection {
  projects: AdeProject[];
  selected: AdeProject | null;
  // true si l'année a été choisie à la main dans la config de l'EDT
  manual: boolean;
}

// session anonyme : jeton Basic fourni au build (EXPO_PUBLIC_ADE_TOKEN)
export async function openSession(signal?: AbortSignal): Promise<string | null> {
  const res = await fetch(`${ADE_URL}/jsp/webapi?function=connect`, {
    headers: { Authorization: `Basic ${process.env.EXPO_PUBLIC_ADE_TOKEN ?? ''}` },
    signal,
  });
  if (!res.ok) return null;
  return (await res.text()).match(/<session id="(.*?)"\s*\/>/)?.[1] ?? null;
}

// sans réponse, la session expire d'elle-même côté serveur
export function closeSession(sessionId: string): void {
  fetch(`${ADE_URL}/jsp/webapi?function=disconnect&sessionId=${sessionId}`).catch(() => {});
}

export async function adeRequest(
  sessionId: string,
  params: Record<string, string>,
  signal?: AbortSignal,
): Promise<string> {
  const query = Object.entries({ ...params, sessionId })
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  const res = await fetch(`${ADE_URL}/jsp/webapi?${query}`, { signal });
  if (!res.ok) throw new Error(`ADE ${res.status}`);
  return res.text();
}

async function fetchProjects(signal: AbortSignal): Promise<AdeProject[] | null> {
  const sessionId = await openSession(signal);
  if (!sessionId) return null;
  try {
    const xml = await adeRequest(sessionId, { function: 'getProjects', detail: '2' }, signal);
    const projects = Array.from(xml.matchAll(/<project\s+id="(\d+)"\s+name="([^"]*)"/g), ([, id, name]) => ({
      id,
      name,
    }));
    return projects.length > 0 ? projects : null;
  } finally {
    closeSession(sessionId);
  }
}

let projectsRequest: Promise<AdeProject[] | null> | null = null;

// gardés le temps de la session de l'app, redemandés après un échec
function getProjects(): Promise<AdeProject[] | null> {
  projectsRequest ??= withTimeout(PROJECTS_TIMEOUT_MS, fetchProjects).then((projects) => {
    if (!projects) projectsRequest = null;
    return projects;
  });
  return projectsRequest;
}

// année scolaire de septembre à août : 2025 pour octobre 2025 comme pour mars 2026
function getAcademicYear(date = new Date()): number {
  return date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
}

// "2025-2026 PROD" -> 2025
export function getProjectYear(project: AdeProject): number {
  const match = project.name.match(/(\d{4})-\d{4}/);
  return match ? Number(match[1]) : getAcademicYear();
}

function pickAutoProject(projects: AdeProject[]): AdeProject | null {
  const year = getAcademicYear();
  return projects.find((p) => p.name.includes(`${year}-${year + 1}`) && p.name.toLowerCase().includes('prod')) ?? null;
}

export async function getProjectSelection(): Promise<ProjectSelection> {
  const [projects, overrideId] = await Promise.all([getProjects(), storage.get('adeProjectOverride')]);
  if (!projects) return { projects: [], selected: null, manual: false };

  const override = projects.find((p) => p.id === overrideId);
  if (override) return { projects, selected: override, manual: true };
  // l'année choisie à la main n'existe plus dans ADE : retour en automatique
  if (overrideId) storage.remove('adeProjectOverride');
  return { projects, selected: pickAutoProject(projects), manual: false };
}

export async function getCurrentProject(): Promise<AdeProject | null> {
  return (await getProjectSelection()).selected;
}

// null : choix automatique
export async function setProjectOverride(id: string | null): Promise<void> {
  if (id) await storage.set('adeProjectOverride', id);
  else await storage.remove('adeProjectOverride');
}
