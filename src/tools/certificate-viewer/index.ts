import { ArrowsShuffle } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: 'Certificate viewer',
  path: '/certificate-viewer',
  description: translate('tools.certificate-viewer.description'),
  keywords: ['certificate', 'viewer'],
  component: () => import('./certificate-viewer.vue'),
  icon: ArrowsShuffle,
  createdAt: new Date('2026-07-10'),
});
