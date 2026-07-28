import { describe, expect, it } from 'vitest';
import {
  convertGnssTileIdToGeohash,
  decodeGeohashToCenterAndBbox,
  leftPadToFiveBits,
  sanitizeBinaryTileId,
} from './gnss-tileid-to-geohash.service';

describe('gnssTileIdToGeohash', () => {
  it('converts known GNSS tileId to geohash', () => {
    const result = convertGnssTileIdToGeohash('1110010011001100010110011');

    expect(result.geohash).toBe('wm65m');
    expect(result.steps.map(step => step.decimal)).toEqual([28, 19, 6, 5, 19]);
    expect(result.steps.map(step => step.character).join('')).toBe('wm65m');
  });

  it('left pads input to 5-bit groups', () => {
    expect(leftPadToFiveBits('1010101')).toBe('0001010101');
  });

  it('throws for invalid characters', () => {
    expect(() => sanitizeBinaryTileId('1012')).toThrow('TileId must contain only 0 and 1.');
  });

  it('decodes geohash to finite coordinates and valid bbox', () => {
    const { center, bbox } = decodeGeohashToCenterAndBbox('wm65m');

    expect(Number.isFinite(center.lat)).toBe(true);
    expect(Number.isFinite(center.lng)).toBe(true);
    expect(bbox.south).toBeLessThan(bbox.north);
    expect(bbox.west).toBeLessThan(bbox.east);
  });
});
