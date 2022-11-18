// Heads up: This file uses the Playwright POM (https://playwright.dev/docs/pom)
import { Locator, Page } from "playwright";
import Axios from "axios";
import path from "path";
import fs from "fs";

import { REDDIT_URL } from "../constants";

export class PostPage {
  readonly page: Page;
  readonly id: string;
  readonly url: string;
  readonly image: Locator;

  constructor(page: Page, id: string) {
    this.page = page;
    this.id = id;
    this.url = REDDIT_URL.concat(id);
    this.image = page.locator(
      `div[data-testid="post-container"] >> div[data-test-id="post-content"] >> a:not([data-click-id="comments"], [data-click-id="user"])`
    );
  }

  async goto() {
    await this.page.goto(this.url);
  }

  async getImageCount() {
    return await this.image.count();
  }

  async is18Plus() {
    const nsfwWarning = this.page.getByText("Log in to confirm you're over 18");

    return await nsfwWarning.isVisible();
  }

  async downloadPostImage(dir: string) {
    const cdnUrl = await this.image.getAttribute("href");

    if (cdnUrl == null) {
      throw new Error(`Could not extract download url for post ${this.id}`);
    }

    const [_, id] = cdnUrl.split("https://i.redd.it/");

    const location = path.resolve(dir, id);

    const writer = fs.createWriteStream(location);

    const response = await Axios({
      url: cdnUrl,
      method: "GET",
      responseType: "stream",
    });

    response.data.pipe(writer);

    return [
      id,
      new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      }),
    ];
  }
}
