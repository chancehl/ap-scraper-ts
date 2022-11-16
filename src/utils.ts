import type { Page } from "playwright";

export async function scrollToBottom(page: Page) {
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    for (let i = 0; i < document.body.scrollHeight; i += 1000) {
      window.scrollTo(0, i);
      await delay(100);
    }
  });
}
