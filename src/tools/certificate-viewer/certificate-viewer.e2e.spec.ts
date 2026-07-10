import { expect, test } from '@playwright/test';

const sampleValidPem = [
  '-----BEGIN CERTIFICATE-----',
  'MIICUjCCAbugAwIBAgIUHchLrh73T8lpAiYiIdcIToxEv6swDQYJKoZIhvcNAQEL',
  'BQAwOzEZMBcGA1UEAwwQbGVhZi5leGFtcGxlLmNvbTERMA8GA1UECgwISVQgVG9v',
  'bHMxCzAJBgNVBAYTAlVTMB4XDTI2MDcxMDAzNTMzMFoXDTI3MDcxMDAzNTMzMFow',
  'OzEZMBcGA1UEAwwQbGVhZi5leGFtcGxlLmNvbTERMA8GA1UECgwISVQgVG9vbHMx',
  'CzAJBgNVBAYTAlVTMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDsadkKlejE',
  '1kYBvb2F4yfO6ZVyMAZPgWb2a8J8KbsCFX8z2t4oiYvS8Z26b3P7Xt5szkzPeYuh',
  '4ry0lpMu1gW1U++3tNKhBtK9HmB/BUSYCqJzs998FUlSK4S1jP27CpCx6Sy1z/mA',
  '6vJb40HM8ByajFLViHKIjD4W1whBs0tB8QIDAQABo1MwUTAdBgNVHQ4EFgQUBiGa',
  'rQC5huRnQA/R6xGOCq07nT8wHwYDVR0jBBgwFoAUBiGarQC5huRnQA/R6xGOCq07',
  'nT8wDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOBgQCnYLJ7exvhigpt',
  'g7NUWJTe8UW4yqCiiMC1AxFYT/URPpITs4GJBszCVBgy7UF1E360SGz0OP3QL/Z6',
  'nzOqonOGvxemhlwi8Ek+4tRt9C9R0u/MKpKgl1bvtpRzkp2cfsIfEbn3IvyvXNzZ',
  'Z4U0ZObAZ32TrtzhHkk8tSTbNNnsGw==',
  '-----END CERTIFICATE-----',
].join('\n');

const invalidPem = [
  '-----BEGIN CERTIFICATE-----',
  'NOT_A_VALID_CERTIFICATE_BLOCK',
  '-----END CERTIFICATE-----',
].join('\n');

test.describe('Tool - Certificate viewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/certificate-viewer');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Certificate viewer - IT Tools');
  });

  test('parses certificate chain and shows certificate details', async ({ page }) => {
    await page.getByTestId('input').fill(sampleValidPem);
    await page.getByTestId('parse-button').click();

    await expect(page.getByText('Certificate 1')).toBeVisible();
    await expect(page.getByText('Subject common name')).toBeVisible();
    await expect(page.getByText('leaf.example.com')).toBeVisible();
    await expect(page.getByText('SHA-256 fingerprint')).toBeVisible();
  });

  test('shows partial errors when one certificate block is invalid', async ({ page }) => {
    await page.getByTestId('input').fill(`${sampleValidPem}\n${invalidPem}`);
    await page.getByTestId('parse-button').click();

    await expect(page.getByText('Some certificate blocks could not be parsed')).toBeVisible();
    await expect(page.getByText('Certificate 1')).toBeVisible();
  });
});
