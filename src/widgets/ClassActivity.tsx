import type { LiveActivity } from 'expo-widgets';

import type { ClassActivityProps } from '@/src/types';

// Live Activity iOS 
export const ClassActivity = {
  getInstances: (): LiveActivity<ClassActivityProps>[] => [],
  start: (_props: ClassActivityProps, _url?: string, _staleDate?: Date) => {},
};
