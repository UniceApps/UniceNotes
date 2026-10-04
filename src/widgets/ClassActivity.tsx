import { createLiveActivity } from 'expo-widgets';

import type { ClassActivityProps } from '@/src/types';

// Live Activity iOS uniquement : sans effet ailleurs
export const ClassActivity = createLiveActivity<ClassActivityProps>('ClassActivity', () => ({ banner: null }));
