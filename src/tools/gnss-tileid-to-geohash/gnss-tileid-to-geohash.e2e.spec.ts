import { expect, test } from '@playwright/test';

test.describe('Tool - GNSS tileId to GeoHash', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gnss-tileid-to-geohash');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('GNSS tileId to GeoHash - IT Tools');
  });

  test('converts tileId and displays map', async ({ page }) => {
    await page.getByPlaceholder('Enter tileId in binary (0/1)...').fill('1110010011001100010110011');

    await expect(page.getByTestId('geohash-output')).toHaveValue('wm65m');

    const frameSrc = await page.getByTestId('map-frame').getAttribute('src');

    expect(frameSrc).toContain('openstreetmap.org/export/embed.html');
    expect(frameSrc).toContain('marker=');
    expect(frameSrc).toContain('bbox=');
  });
});
