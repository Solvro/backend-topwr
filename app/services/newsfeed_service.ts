import { optionMap } from "@solvro/utils/option";
import { DateTime } from "luxon";
import { HTMLElement, NodeType, parse } from "node-html-parser";

import logger from "@adonisjs/core/services/logger";

const PWR_URL: Record<NewsfeedLanguage, string> = {
  pl: "https://pwr.edu.pl/uczelnia/aktualnosci/page1.html",
  en: "https://pwr.edu.pl/en/university/news/page1.html",
};
export const NEWSFEED_LANGAUGES = Object.keys(PWR_URL) as NewsfeedLanguage[];
const DATE_REGEX = /Dat[ae]:\s*([\d.]+)/;

export type NewsfeedLanguage = "pl" | "en";

export interface NewsfeedUpdate {
  articles: NewsfeedArticle[];
  updateTime: DateTime;
}

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
  lastUpdate: DateTime;
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

export interface NewsfeedStats {
  completeCount: number;
  totalCount: number;
  lastUpdate: DateTime;
}

const CACHE_TTL = 60 * 60 * 2; // 2 hours

export default class NewsfeedService {
  private static articleCache: Partial<Record<NewsfeedLanguage, ArticleCache>> =
    {};
  private static interval?: NodeJS.Timeout;

  private static parseNewsfeedItem = (
    newsfeedItem: HTMLElement,
    baseUrl: string,
  ): NewsfeedArticle => {
    const imageLink = newsfeedItem
      .querySelector(".col-img")
      ?.querySelector("img")
      ?.getAttribute("src");
    const titleDiv = newsfeedItem
      .querySelector(".col-text")
      ?.querySelector(".title");
    const pDivs = newsfeedItem.querySelectorAll("p");
    const makeUrlAbsolute = (link: string) => new URL(link, baseUrl).href;

    return {
      imageLink: optionMap(imageLink, makeUrlAbsolute),
      title: titleDiv?.textContent,
      url: optionMap(titleDiv?.getAttribute("href"), makeUrlAbsolute),
      date: DATE_REGEX.exec(pDivs[0]?.text.trim() ?? "")?.[1] ?? undefined,
      categories:
        pDivs[0]?.textContent
          .split(/(?:Kategoria|Category):/)[1]
          .split(",")
          .map((category) => category.trim())
          .filter((category) => category.length > 0) ?? [],
      previewText: pDivs[1]?.childNodes.find(
        (node) => node.nodeType === NodeType.TEXT_NODE,
      )?.textContent,
    };
  };

  private static extractNewsfeedItems(
    html: string,
    baseUrl: string,
  ): NewsfeedArticle[] {
    const root: HTMLElement = parse(html);
    const newsfeedItems = root.querySelectorAll(".news-box");
    return newsfeedItems.map((item) => this.parseNewsfeedItem(item, baseUrl));
  }

  private static async scrapeNewsfeed(
    url: string,
  ): Promise<NewsfeedArticle[] | null> {
    try {
      const res = await fetch(url);
      if (res.status !== 200) {
        logger.warn(
          `Failed to fetch the newsfeed - got response ${res.status} ${res.statusText}`,
        );
        return null;
      }
      return this.extractNewsfeedItems(await res.text(), url);
    } catch (err) {
      logger.warn(`Scraping newsfeed failed. Details: ${err}`);
      return null;
    }
  }

  private static async updateArticles(language: NewsfeedLanguage) {
    const articles = await this.scrapeNewsfeed(PWR_URL[language]);
    if (articles === null) {
      return;
    }
    this.articleCache[language] = {
      articles,
      completeArticles: articles.filter(isCompleteArticle),
      lastUpdate: DateTime.now(),
    };
    logger.info(
      `Newsfeed articles (${language}) updated. Currently storing ${articles.length} articles.`,
    );
  }

  private static async updateAllArticles() {
    await Promise.all(
      NEWSFEED_LANGAUGES.map((lang) => this.updateArticles(lang)),
    );
  }

  static async startNewsfeedUpdate(): Promise<boolean> {
    if (this.interval !== undefined) {
      return false;
    }
    await this.updateAllArticles();
    this.interval = setInterval(() => {
      void this.updateAllArticles();
    }, CACHE_TTL * 1000);
    return true;
  }

  static stopNewsfeedUpdates(): boolean {
    if (this.interval !== undefined) {
      clearInterval(this.interval);
      this.interval = undefined;
      return true;
    }
    return false;
  }

  static getLatestNewsfeedArticles(
    language: NewsfeedLanguage,
    completeOnly = false,
  ): NewsfeedUpdate | null {
    const cache = this.articleCache[language];
    if (cache === undefined) {
      return null;
    }
    return {
      updateTime: cache.lastUpdate,
      articles: completeOnly ? cache.completeArticles : cache.articles,
    };
  }

  static getStats(): Partial<Record<NewsfeedLanguage, NewsfeedStats>> {
    return Object.fromEntries(
      Object.entries(this.articleCache).map(([lang, cache]) => [
        lang,
        this.mapToStats(cache),
      ]),
    );
  }

  private static mapToStats(cache: ArticleCache): NewsfeedStats {
    return {
      completeCount: cache.completeArticles.length,
      totalCount: cache.articles.length,
      lastUpdate: cache.lastUpdate,
    };
  }

  static isInitialized(): boolean {
    return (
      this.interval !== undefined &&
      NEWSFEED_LANGAUGES.every((lang) => this.articleCache[lang] !== undefined)
    );
  }

  static isUpdating(): boolean {
    return this.interval !== undefined;
  }
}
