import { HTMLElement, parse } from "node-html-parser";

import logger from "@adonisjs/core/services/logger";

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

const CACHE_TTL = 1 * 3; //1800 seconds

export default class NewsfeedService {
  private articleCache?: ArticleCache;
  private interval?: NodeJS.Timeout;

  constructor() {
    void this.startNewsfeedUpdate();
  }

  private static addURLPrefix(url: string | undefined): string | undefined {
    return url !== undefined ? `https://pwr.edu.pl${url}` : undefined;
  }

  private parseNewsfeedItem = (newsfeedItem: HTMLElement): NewsfeedArticle => {
    const article = {
      imageLink: NewsfeedService.addURLPrefix(
        newsfeedItem
          .querySelector(".col-img")
          ?.querySelector("img")
          ?.getAttribute("src"),
      ),
    } as NewsfeedArticle;
    const titleDiv = newsfeedItem
      .querySelector(".col-text")
      ?.querySelector(".title");
    article.title = titleDiv?.textContent;
    article.url = NewsfeedService.addURLPrefix(titleDiv?.getAttribute("href"));
    const pDivs = newsfeedItem.querySelectorAll("p");
    if (pDivs.length >= 1) {
      const dateMatcher = pDivs[0].text.trim().match(/Data:\s*([\d.]+)/);
      article.date = dateMatcher !== null ? dateMatcher[1] : undefined;
      article.categories = pDivs[0].textContent
        .split("Kategoria:")[1]
        .split(",")
        .map((category) => category.trim())
        .filter((category) => category.length > 0);
      if (pDivs.length >= 2) {
        const content = pDivs[1].textContent;
        article.previewText = content.substring(0, content.length - 7); //removes the "więcej " from the content
      }
    }
    return article;
  };

  private extractNewsfeedItems(html: string): NewsfeedArticle[] {
    const root: HTMLElement = parse(html);
    const newsfeedItems = root.querySelectorAll(".news-box");
    return newsfeedItems.map(this.parseNewsfeedItem);
  }

  private async scrapeNewsfeed(): Promise<NewsfeedArticle[] | null> {
    try {
      const res = await fetch(PWR_URL);
      if (res.status !== 200) {
        logger.warn(`Scraping newsfeed failed. Details: ${await res.text()}`);
        return null;
      }
      return this.extractNewsfeedItems(await res.text());
    } catch (err) {
      logger.warn(`Scraping newsfeed failed. Details: ${err}`);
      return null;
    }
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

  async startNewsfeedUpdate(): Promise<boolean> {
    if (this.interval !== undefined) {
      return false;
    }
    await this.updateArticles();
    this.interval = setInterval(() => {
      void this.updateArticles();
    }, CACHE_TTL * 1000);
    return true;
  }

  stopNewsfeedUpdates(): boolean {
    if (this.interval !== undefined) {
      clearInterval(this.interval);
      this.interval = undefined;
      return true;
    }
    return false;
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
