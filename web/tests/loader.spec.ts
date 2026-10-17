import { test, expect, type Page } from '@playwright/test';

async function delayContent(page: Page) {
  await page.route('**/content/*.enc.json', async (route) => {
    const response = await route.fetch();
    await new Promise((resolve) => setTimeout(resolve, 400));
    await route.fulfill({ response });
  });
}

test('逐塊墓碑跟隨解密進度，完成後才進入墓園', async ({ page }) => {
  await delayContent(page);
  await page.goto('/');
  await page.getByLabel('密碼', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: '進入', exact: true }).click();
  const progress = page.getByRole('progressbar', { name: '解開內容' });
  await expect(progress).toBeVisible();
  await expect(progress).toHaveAttribute('aria-valuemax', '10');
  expect(Number(await progress.getAttribute('aria-valuenow'))).toBeLessThan(10);
  await page.evaluate(() => {
    const root = document.querySelector('[role="progressbar"]')!;
    const samples: number[] = [];
    const record = () => samples.push(root.querySelectorAll('[data-laid="true"]').length);
    record();
    const observer = new MutationObserver(record);
    observer.observe(root, { subtree: true, attributes: true });
    Object.assign(window, { loaderSamples: samples });
  });
  await expect(progress).toHaveAttribute('aria-valuenow', '10');
  await expect(page.locator('[data-laid="true"]')).toHaveCount(15);
  await expect(page.getByRole('button', { name: '上鎖', exact: true })).toBeVisible();
  await expect(progress).toHaveCount(0);
  const samples = await page.evaluate(() => (window as unknown as { loaderSamples: number[] }).loaderSamples);
  expect(samples.length).toBeGreaterThan(1);
  expect(samples.at(-1)).toBe(15);
  for (let i = 1; i < samples.length; i++) expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1]);
});

test('錯密碼立即撤掉墓碑，清空並聚焦密碼欄', async ({ page }) => {
  await delayContent(page);
  await page.goto('/');
  const input = page.getByLabel('密碼', { exact: true });
  await input.fill('incorrect');
  await page.getByRole('button', { name: '進入', exact: true }).click();
  await expect(page.getByRole('progressbar', { name: '解開內容' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveText('密碼不正確');
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  await expect(input).toHaveValue('');
  await expect(input).toBeFocused();
});

test('減弱動效直接填石，仍能進入墓園', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await delayContent(page);
  await page.goto('/');
  await page.getByLabel('密碼', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: '進入', exact: true }).click();
  await expect(page.getByRole('progressbar', { name: '解開內容' })).toBeVisible();
  await expect(page.locator('[data-laid="true"]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: '上鎖', exact: true })).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveCount(0);
});
