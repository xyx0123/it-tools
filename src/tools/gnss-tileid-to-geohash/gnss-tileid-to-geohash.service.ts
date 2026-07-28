const GEOHASH_BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export interface GeohashStep {
  binary: string
  decimal: number
  character: string
}

export interface GeohashBBox {
  south: number
  west: number
  north: number
  east: number
}

export interface GeohashCenter {
  lat: number
  lng: number
}

export interface GnssTileIdConversionResult {
  normalizedBinary: string
  paddedBinary: string
  geohash: string
  steps: GeohashStep[]
  center: GeohashCenter
  bbox: GeohashBBox
  osmEmbedUrl: string
}

export {
  convertGnssTileIdToGeohash,
  decodeGeohashToCenterAndBbox,
  sanitizeBinaryTileId,
  leftPadToFiveBits,
  buildOsmEmbedUrl,
};

function sanitizeBinaryTileId(input: string) {
  const normalized = input.replace(/\s+/g, '');

  if (!normalized) {
    throw new Error('TileId is required.');
  }

  if (!/^[01]+$/.test(normalized)) {
    throw new Error('TileId must contain only 0 and 1.');
  }

  return normalized;
}

function leftPadToFiveBits(binary: string) {
  const missingBits = (5 - (binary.length % 5)) % 5;
  return `${'0'.repeat(missingBits)}${binary}`;
}

function toFiveBitGroups(binary: string) {
  return binary.match(/.{1,5}/g) ?? [];
}

function groupsToSteps(groups: string[]) {
  return groups.map((group) => {
    const decimal = Number.parseInt(group, 2);
    const character = GEOHASH_BASE32[decimal];

    return {
      binary: group,
      decimal,
      character,
    };
  });
}

function decodeGeohashToCenterAndBbox(geohash: string) {
  const lat: [number, number] = [-90, 90];
  const lng: [number, number] = [-180, 180];
  let isEvenBit = true;

  for (const char of geohash) {
    const value = GEOHASH_BASE32.indexOf(char);

    if (value === -1) {
      throw new Error(`Invalid geohash character: ${char}`);
    }

    for (const mask of [16, 8, 4, 2, 1]) {
      if (isEvenBit) {
        const midpoint = (lng[0] + lng[1]) / 2;
        if (value & mask) {
          lng[0] = midpoint;
        }
        else {
          lng[1] = midpoint;
        }
      }
      else {
        const midpoint = (lat[0] + lat[1]) / 2;
        if (value & mask) {
          lat[0] = midpoint;
        }
        else {
          lat[1] = midpoint;
        }
      }

      isEvenBit = !isEvenBit;
    }
  }

  return {
    center: {
      lat: (lat[0] + lat[1]) / 2,
      lng: (lng[0] + lng[1]) / 2,
    },
    bbox: {
      south: lat[0],
      west: lng[0],
      north: lat[1],
      east: lng[1],
    },
  };
}

function buildOsmEmbedUrl({ center, bbox }: { center: GeohashCenter; bbox: GeohashBBox }) {
  const params = new URLSearchParams({
    bbox: `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`,
    layer: 'mapnik',
    marker: `${center.lat},${center.lng}`,
  });

  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}

function convertGnssTileIdToGeohash(tileId: string): GnssTileIdConversionResult {
  const normalizedBinary = sanitizeBinaryTileId(tileId);
  const paddedBinary = leftPadToFiveBits(normalizedBinary);
  const groups = toFiveBitGroups(paddedBinary);
  const steps = groupsToSteps(groups);
  const geohash = steps.map(({ character }) => character).join('');
  const { center, bbox } = decodeGeohashToCenterAndBbox(geohash);
  const osmEmbedUrl = buildOsmEmbedUrl({ center, bbox });

  return {
    normalizedBinary,
    paddedBinary,
    geohash,
    steps,
    center,
    bbox,
    osmEmbedUrl,
  };
}
