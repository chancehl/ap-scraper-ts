#!/usr/bin/env node
import { Command } from "commander";
import playwright from "playwright";

import { DEFAULT_SAVE_LOCATION, PINNED_RULES_POST_HREF } from "./constants";
import { SubredditPage, PostPage } from "./poms";
import { createLogger } from "./logger";

const program = new Command();

program.option(
  "-o, --outdir <outdir>",
  "the directory to save the images to",
  DEFAULT_SAVE_LOCATION
);

program.option(
  "-d, --debug",
  "puts the program into debug mode which enables more verbose logging and screenshots on failure",
  false
);

program.option("-q, --quiet", "disables console logging", false);

program.parse(process.argv);

(async function main(options) {
  // Setup
  const logger = createLogger({ quiet: options.quiet });

  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const subreddit = new SubredditPage(page);
  await subreddit.goto();
  await subreddit.scrollToBottom(); // necessary because reddit lazy loads posts

  const posts = await subreddit.getPosts();
  const postCount = await posts.count();

  logger.info(`Located ${postCount} posts`);

  for (let i = 0; i < postCount; i++) {
    try {
      const isPromotedPost = await subreddit.isPromotedPost(i);

      if (isPromotedPost) {
        logger.warn(`Post ${i} is a promoted post. Skipping.`);

        continue;
      }

      const postId = await subreddit.getPostId(i);

      // Some postIds are sponsored ads and have a null id, we want to skip those
      if (postId == null) {
        logger.warn(
          `Post ${i} was null (this often means this is an advertisement).`
        );

        continue;
      }

      const postPage = new PostPage(page, postId);

      // We also want to skip the pinned rules post that is always stickied at the top
      if (postPage.url.includes(PINNED_RULES_POST_HREF)) {
        logger.warn(`Post ${postId} is this pinned rules post. Skipping.`);

        continue;
      }

      await postPage.goto();

      // Some posts have two images in rare circumstances, skip those
      // TODO: figure out why posts resolve to two images (bug)
      if ((await postPage.getImageCount()) > 1) {
        logger.warn(`Post ${postId} contained more than one image. Skipping.`);

        continue;
      }

      // some of the art contains nudity and will be flagged for 18+ accounts
      if (await postPage.is18Plus()) {
        logger.warn(`Encountered 18+ image for post ${postId}. Skipping.`);

        await page.goBack();

        continue;
      }

      const [imageId] = await postPage.downloadPostImage(options.outdir);

      logger.info(
        `Successfully downloaded image for post ${postId} (saved to ${options.outdir}/${imageId})`
      );
    } catch (error) {
      // TODO: find a way to log post id even if this throws
      logger.error(
        `Encountered the following error while processing post no. ${i}:`,
        error
      );

      if (options.debug) {
        await page.screenshot({ path: `./debug/$failure-{i}.jpg` });
      }

      continue;
    } finally {
      await subreddit.goto();
    }
  }

  // Teardown
  await context.close();
  await browser.close();
})(program.opts());
