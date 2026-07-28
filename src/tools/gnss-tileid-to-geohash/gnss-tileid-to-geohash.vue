<script setup lang="ts">
import { convertGnssTileIdToGeohash } from './gnss-tileid-to-geohash.service';
import InputCopyable from '@/components/InputCopyable.vue';
import { getErrorMessageIfThrows } from '@/utils/error';

const rawTileId = useStorage('gnss-tileid-to-geohash:raw-tileid', '1110010011001100010110011');

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
          <iframe
            data-test-id="map-frame"
            title="GeoHash map preview"
            :src="conversionResult.osmEmbedUrl"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
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

  iframe {
    width: 100%;
    height: 340px;
    border: 0;
  }
}
</style>
