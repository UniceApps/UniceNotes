import { emitDeepLink, isDeepLinkUrl, parseDeepLink } from '@/src/utils/deeplink';

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (!isDeepLinkUrl(path)) return path;
    const link = parseDeepLink(path);
    if (link) emitDeepLink(link);
    return null;
  } catch {
    return null;
  }
}
