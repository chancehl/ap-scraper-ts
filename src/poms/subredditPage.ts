// Heads up: This file uses the Playwright POM (https://playwright.dev/docs/pom)
import { Locator, Page } from "playwright";

import { SUBREDDIT_URL } from "../constants";

export class SubredditPage {
  readonly page: Page;
  readonly posts: Locator;

  constructor(page: Page) {
    this.page = page;
    this.posts = page.locator(`[data-testid="post-container"]`);
  }

  async goto() {
    await this.page.goto(SUBREDDIT_URL);
  }

  async getPosts() {
    return this.posts;
  }

  async getPostId(n: number) {
    const a = this.posts.nth(n).locator(`a[data-click-id="body"]`);

    const href = await a.getAttribute("href");

    if (href == null) {
      throw new Error("Could not get href for post ${n}");
    }

    return href;
  }

  async scrollToBottom() {
    await this.page.evaluate(async () => {
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      for (let i = 0; i < document.body.scrollHeight; i += 1000) {
        window.scrollTo(0, i);
        await delay(100);
      }
    });
  }
}
