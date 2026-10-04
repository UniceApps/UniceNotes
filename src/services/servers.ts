import { withTimeout } from '@/src/utils/network';

const CHECK_TIMEOUT_MS = 5000;

export interface Server {
  name: string;
  description: string;
  icon: string;
  url: string;
}

export const SERVERS: Server[] = [
  {
    name: 'ADE',
    description: 'Emploi du temps, salles libres',
    icon: 'calendar-month-outline',
    url: 'https://edtweb.univ-cotedazur.fr',
  },
  {
    name: 'PronoteCampus',
    description: 'Notes',
    icon: 'calculator-variant-outline',
    url: 'https://sco.polytech.unice.fr/1',
  },
  {
    name: 'Mon Dossier Web',
    description: 'Scolarité',
    icon: 'school-outline',
    url: 'https://mondossierweb.univ-cotedazur.fr',
  },
  {
    name: 'Login UniCA',
    description: 'Connexion aux services',
    icon: 'account-key-outline',
    url: 'https://login.univ-cotedazur.fr',
  },
];

// temps de réponse en ms, null si le serveur ne répond pas
export async function checkServer(url: string): Promise<number | null> {
  const start = Date.now();
  const ok = await withTimeout(CHECK_TIMEOUT_MS, async (signal) => {
    const res = await fetch(url, { signal });
    return res.status < 400;
  });
  return ok ? Date.now() - start : null;
}
