import { HTMLElement, parse } from "node-html-parser";

import { Logger } from "@adonisjs/core/logger";

const PWR_URL = "https://pwr.edu.pl/uczelnia/aktualnosci/page1.html";

interface NewsfeedArticle {
  url: string | undefined;
  imageLink: string | undefined;
  title: string | undefined;
  previewText: string | undefined;
  date: string | undefined;
  categories: string[];
}

export default class NewsfeedService {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  private parseNewsfeedItem = (newsfeedItem: HTMLElement): NewsfeedArticle => {
    const article = {
      imageLink: newsfeedItem
        .querySelector(".col-img")
        ?.querySelector("img")
        ?.getAttribute("src"),
    } as NewsfeedArticle;
    const titleDiv = newsfeedItem
      .querySelector(".col-text")
      ?.querySelector(".title");
    const title = titleDiv?.textContent;
    const url = titleDiv?.getAttribute("href");
    article.title = title;
    article.url = url;
    const pDivs = newsfeedItem.querySelectorAll("p");
    if (pDivs.length >= 1) {
      const dateCatContent = pDivs[0].textContent.split("/n");
      console.log(dateCatContent);
      const date = dateCatContent[0].substring(6);
      const categories = [];
      for (let i = 1; i < dateCatContent.length; i++) {
        if (dateCatContent[i] === "\n" || dateCatContent[i] === ",") {
          continue;
        }
        categories.push(dateCatContent[i]);
      }
      article.date = date;
      article.categories = categories;
      if (pDivs.length >= 2) {
        article.previewText = pDivs[1].textContent;
      }
    }
    return article;
  };

  private extractNewsfeedItems(html: string): NewsfeedArticle[] {
    const root: HTMLElement = parse(html);
    const newsfeedItems = root.querySelectorAll(".newsfeed-item");
    const featuredItem = root.querySelector(".news-box-big");
    return (
      featuredItem !== null ? [featuredItem, ...newsfeedItems] : newsfeedItems
    ).map(this.parseNewsfeedItem);
  }

  private async scrapeNewsfeed(): Promise<NewsfeedArticle[] | null> {
    return fetch(PWR_URL)
      .then(async (res: Response) => {
        if (res.status !== 200) {
          this.logger.warn(
            `Scraping newsfeed failed. Details: ${await res.text()}`,
          );
          return null;
        }
        return this.extractNewsfeedItems(await res.text());
      })
      .catch((err) => {
        this.logger.warn(`Scraping newsfeed failed. Details: ${err}`);
        return null;
      });
  }
}
