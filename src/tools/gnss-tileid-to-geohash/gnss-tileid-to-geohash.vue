<script setup lang="ts">
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { convertGnssTileIdToGeohash } from './gnss-tileid-to-geohash.service';
import InputCopyable from '@/components/InputCopyable.vue';
import { getErrorMessageIfThrows } from '@/utils/error';

const normalizedBaseUrl = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

const geohashMarkerIcon = L.icon({
  iconRetinaUrl: `${normalizedBaseUrl}leaflet/marker-icon-2x.png`,
  iconUrl: `${normalizedBaseUrl}leaflet/marker-icon.png`,
  shadowUrl: `${normalizedBaseUrl}leaflet/marker-shadow.png`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

const rawTileId = useStorage('gnss-tileid-to-geohash:raw-tileid', '1110010011001100010110011');
const mapElement = ref<HTMLElement>();
const leafletMap = ref<L.Map>();
const centerMarker = ref<L.Marker>();
const bboxRectangle = ref<L.Rectangle>();

const conversionResult = computed(() => {
  try {
    return convertGnssTileIdToGeohash(rawTileId.value);
  }
  catch {
    return undefined;
  }
});

const error = computed(() => getErrorMessageIfThrows(() => convertGnssTileIdToGeohash(rawTileId.value)));

function formatCoordinate(value: number) {
  return value.toFixed(6);
}

function removeOverlay() {
  centerMarker.value?.remove();
  bboxRectangle.value?.remove();
  centerMarker.value = undefined;
  bboxRectangle.value = undefined;
}

function resetMapIfContainerChanged() {
  const currentContainer = mapElement.value;

  if (!leafletMap.value || !currentContainer) {
    return;
  }

  if (leafletMap.value.getContainer() !== currentContainer) {
    removeOverlay();
    leafletMap.value.remove();
    leafletMap.value = undefined;
  }
}

function ensureMap() {
  if (leafletMap.value || !mapElement.value) {
    return;
  }

  leafletMap.value = L.map(mapElement.value, {
    zoomControl: true,
    attributionControl: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(leafletMap.value);
}

function syncMapFromConversion() {
  resetMapIfContainerChanged();
  ensureMap();

  if (!leafletMap.value || !conversionResult.value) {
    removeOverlay();
    return;
  }

  const { center, bbox } = conversionResult.value;
  const bounds = L.latLngBounds(
    [bbox.south, bbox.west],
    [bbox.north, bbox.east],
  );

  if (!bboxRectangle.value) {
    bboxRectangle.value = L.rectangle(bounds, {
      color: '#d03050',
      weight: 2,
      fillOpacity: 0.12,
    }).addTo(leafletMap.value);
  }
  else {
    bboxRectangle.value.setBounds(bounds);
  }

  const centerLatLng = L.latLng(center.lat, center.lng);

  if (!centerMarker.value) {
    centerMarker.value = L.marker(centerLatLng, {
      icon: geohashMarkerIcon,
    }).addTo(leafletMap.value);
  }
  else {
    centerMarker.value.setLatLng(centerLatLng);
  }

  leafletMap.value.fitBounds(bounds, {
    padding: [24, 24],
    maxZoom: 19,
  });
}

onMounted(() => {
  syncMapFromConversion();
});

watch(conversionResult, () => {
  syncMapFromConversion();
}, { flush: 'post' });

onBeforeUnmount(() => {
  removeOverlay();
  leafletMap.value?.remove();
  leafletMap.value = undefined;
});
</script>

<template>
  <div>
    <c-card>
      <c-input-text
        v-model:value="rawTileId"
        label="GNSS tileId (binary)"
        placeholder="Enter tileId in binary (0/1)..."
        clearable
      />

      <n-alert v-if="error" type="error" mt-4>
        {{ error }}
      </n-alert>

      <template v-else-if="conversionResult">
        <n-divider />

        <InputCopyable
          data-test-id="geohash-output"
          :value="conversionResult.geohash"
          label="GeoHash"
          placeholder="GeoHash will be shown here"
          readonly
        />

        <n-descriptions bordered mt-4 label-placement="left" :column="1" size="small">
          <n-descriptions-item label="Normalized binary">
            {{ conversionResult.normalizedBinary }}
          </n-descriptions-item>
          <n-descriptions-item label="Padded binary">
            {{ conversionResult.paddedBinary }}
          </n-descriptions-item>
          <n-descriptions-item label="Center latitude">
            {{ formatCoordinate(conversionResult.center.lat) }}
          </n-descriptions-item>
          <n-descriptions-item label="Center longitude">
            {{ formatCoordinate(conversionResult.center.lng) }}
          </n-descriptions-item>
        </n-descriptions>

        <n-table striped mt-4>
          <thead>
            <tr>
              <th>Binary (5 bits)</th>
              <th>Decimal</th>
              <th>GeoHash Base32</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(step, index) in conversionResult.steps" :key="`${step.binary}-${index}`">
              <td>{{ step.binary }}</td>
              <td>{{ step.decimal }}</td>
              <td>{{ step.character }}</td>
            </tr>
          </tbody>
        </n-table>

        <div class="map-wrapper" mt-4>
          <div
            ref="mapElement"
            data-test-id="map-frame"
            class="map-canvas"
          />
        </div>
      </template>
    </c-card>
  </div>
</template>

<style lang="less" scoped>
.map-wrapper {
  width: 100%;
  min-height: 340px;
  border: 1px solid var(--c-border-color);
  border-radius: var(--border-radius);
  overflow: hidden;

  .map-canvas {
    width: 100%;
    height: 340px;
  }
}
</style>
