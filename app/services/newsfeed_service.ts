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

interface ArticleCache {
  articles: NewsfeedArticle[];
  completeArticles: NewsfeedArticle[];
}

const isCompleteArticle = (article: NewsfeedArticle): boolean => {
  return (
    article.url !== undefined &&
    article.imageLink !== undefined &&
    article.title !== undefined &&
    article.previewText !== undefined &&
    article.date !== undefined
  );
};

const CACHE_TTL = 60 * 30; //1800 seconds

export default class NewsfeedService {
  private readonly logger: Logger;
  private articleCache?: ArticleCache;

  constructor(logger: Logger) {
    this.logger = logger;
    void this.startNewsfeedUpdate();
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
    try {
      const res = await fetch(PWR_URL);
      if (res.status !== 200) {
        this.logger.warn(
          `Scraping newsfeed failed. Details: ${await res.text()}`,
        );
        return null;
      }
      return this.extractNewsfeedItems(await res.text());
    } catch (err) {
      this.logger.warn(`Scraping newsfeed failed. Details: ${err}`);
      return null;
    }
  }

  private async startNewsfeedUpdate() {
    await this.updateArticles();
    setInterval(() => {
      void this.updateArticles();
    }, CACHE_TTL * 1000);
  }

  private async updateArticles() {
    const articles = await this.scrapeNewsfeed();
    if (articles === null) {
      return;
    }
    if (this.articleCache === undefined) {
      this.articleCache = {
        articles,
        completeArticles: articles.filter(isCompleteArticle),
      };
    } else {
      this.articleCache.articles = articles;
      this.articleCache.completeArticles = articles.filter(isCompleteArticle);
    }
  }

  getLatestNewsfeedArticles(completeOnly = false): NewsfeedArticle[] | null {
    if (this.articleCache === undefined) {
      return null;
    }
    return completeOnly
      ? this.articleCache.completeArticles
      : this.articleCache.articles;
  }
}
