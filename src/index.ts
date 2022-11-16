#!/usr/bin/env node
import { Command } from "commander";
import playwright from "playwright";

import { download } from "./download";
import {
  PINNED_RULES_POST_HREF,
  REDDIT_BASE,
  SUBREDDIT_BASE,
} from "./constants";
import { scrollToBottom } from "./utils";

const program = new Command();

program.option("-o, --outdir <outdir>", "the directory to save the images to");

program.parse(process.argv);

(async function main(options) {
  // Setup
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(SUBREDDIT_BASE);

  // Scroll to the bottom of the page (this is necessary because reddit lazy loads images)
  await scrollToBottom(page);

  const postContainers = page.locator(`[data-testid="post-container"]`);
  const postCount = await postContainers.count();

  for (let i = 0; i < postCount; i++) {
    const post = postContainers.nth(i);
    const link = post.locator(`a[data-click-id="body"]`);
    const href = await link.getAttribute("href");

    if (href == null) {
      continue;
    }

    const detailPageUrl = REDDIT_BASE.concat(href);

    if (!detailPageUrl.includes(PINNED_RULES_POST_HREF)) {
      await page.goto(detailPageUrl);

      const imageLink = page.locator(
        `div[data-testid="post-container"] >> div[data-test-id="post-content"] >> a:not([data-click-id="comments"], [data-click-id="user"])`
      );

      const src = await imageLink.getAttribute("href");

      if (src) {
        await download(src, options.outdir ?? "./imgs");
      }

      // go back to the subreddit
      await page.goto(SUBREDDIT_BASE);
    }
  }

  // Teardown
  await context.close();
  await browser.close();
})(program.opts());
