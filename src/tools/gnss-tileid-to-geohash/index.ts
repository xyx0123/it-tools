import { MapPin } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.gnss-tileid-to-geohash.title'),
  path: '/gnss-tileid-to-geohash',
  description: translate('tools.gnss-tileid-to-geohash.description'),
  keywords: ['gnss', 'tileid', 'geohash', 'map', 'location', 'base32'],
  component: () => import('./gnss-tileid-to-geohash.vue'),
  icon: MapPin,
  createdAt: new Date('2026-07-28'),
});
