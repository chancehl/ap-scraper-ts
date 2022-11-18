#!/usr/bin/env node
import { Command } from "commander";
import playwright from "playwright";

import { DEFAULT_SAVE_LOCATION, PINNED_RULES_POST_HREF } from "./constants";
import { SubredditPage, PostPage } from "./poms";

const program = new Command();

program.option(
  "-o, --outdir <outdir>",
  "the directory to save the images to",
  DEFAULT_SAVE_LOCATION
);

program.option(
  "-d, --debug <debug>",
  "puts the program into debug mode which enables more verbose logging and screenshots on failure"
);

program.parse(process.argv);

(async function main(options) {
  // Setup
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const subreddit = new SubredditPage(page);
  await subreddit.goto();
  await subreddit.scrollToBottom(); // necessary because reddit lazy loads posts
  const posts = await subreddit.getPosts();
  const postCount = await posts.count();

  console.log(`Located ${postCount} posts`);

  for (let i = 0; i < postCount; i++) {
    console.log(`Processing post ${i + 1} of ${postCount}`);

    try {
      const postId = await subreddit.getPostId(i);

      // Some postIds are sponsored ads and have a null id, we want to skip those
      if (postId == null) {
        console.log(
          `Post ${postId} was null (this often means this is a sponsored post or an ad).`
        );

        continue;
      }

      const postPage = new PostPage(page, postId);

      // We also want to skip the pinned rules post that is always stickied at the top
      if (postPage.url.includes(PINNED_RULES_POST_HREF)) {
        console.log(`Post ${postId} is this pinned rules post. Skipping.`);

        continue;
      }

      await postPage.goto();

      // Some posts have two images in rare circumstances, skip those
      // TODO: figure out why posts resolve to two images (bug)
      if ((await postPage.getImageCount()) > 1) {
        console.log(`Post ${postId} contained more than one image. Skipping.`);

        continue;
      }

      const [imageId] = await postPage.downloadPostImage(options.outdir);

      console.log(
        `[${i}] Successfully downloaded image for post ${postId} (saved to ${options.outdir}/${imageId})`
      );
    } catch (error) {
      // TODO: find a way to log post id even if this throws
      console.error(
        `Encountered the following error while processing post no. ${i}:`,
        error
      );

      continue;
    }
  }

  // Teardown
  await context.close();
  await browser.close();
})(program.opts());
