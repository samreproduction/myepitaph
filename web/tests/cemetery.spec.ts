import { test, expect } from '@playwright/test';
import { fixtures } from '../src/fixtures';

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`${viewport.width}×${viewport.height} 墓園完整互動`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const noOverflow = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await noOverflow();
    const objects = page.getByTestId('memory-object');
    await expect(objects).toHaveCount(0);
    await expect(page.getByRole('heading')).toHaveCount(0);
    await page.getByRole('button', { name: '進入', exact: true }).click();
    await expect(page.getByText('生長完成', { exact: true })).toBeVisible();
    await expect(objects).toHaveCount(fixtures.length);
    await noOverflow();
    await page.screenshot({ path: testInfo.outputPath(`cemetery-${viewport.width}.png`), fullPage: true });
    for (let index = 0; index < fixtures.length; index++) {
      await objects.nth(index).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.locator('.memory-text')).toHaveText(fixtures[index].text);
      if (index === 0) {
        await page.getByRole('button', { name: '歷史', exact: true }).click();
        await expect(page.getByText('尚未接入', { exact: true })).toBeVisible();
        await noOverflow();
        await page.screenshot({ path: testInfo.outputPath(`panel-${viewport.width}.png`), fullPage: true });
      }
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
    await objects.first().focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: '關閉文字面板' }).click();
    await expect(objects.first()).toBeFocused();
  });
}
