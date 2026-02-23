import { optionMap } from "@solvro/utils/option";
import { DateTime } from "luxon";
import { HTMLElement, parse } from "node-html-parser";

import logger from "@adonisjs/core/services/logger";

const PWR_URL: Record<NewsfeedLanguage, string> = {
  pl: "https://pwr.edu.pl/uczelnia/aktualnosci",
  en: "https://pwr.edu.pl/en/university/news",
};
export const NEWSFEED_LANGAUGES = Object.keys(PWR_URL) as NewsfeedLanguage[];
const DATE_REGEX = /Dat[ae]:\s*([\d.]+)/;
const NEWSFEED_PAGES = 4;

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
      .querySelector(".photo")
      ?.querySelector("img")
      ?.getAttribute("src");
    const titleElement = newsfeedItem.querySelector("a.title");
    const dateDiv = newsfeedItem.querySelector(".date");
    const makeUrlAbsolute = (link: string) => new URL(link, baseUrl).href;

    const dateText =
      dateDiv?.querySelector(".flex-shrink-0")?.text?.trim() ?? "";
    const categories =
      dateDiv
        ?.querySelectorAll("a")
        .map((a) => a.textContent.trim())
        .filter((cat) => cat.length > 0) ?? [];

    return {
      imageLink: optionMap(imageLink, makeUrlAbsolute),
      title: titleElement?.textContent.trim(),
      url: optionMap(titleElement?.getAttribute("href"), makeUrlAbsolute),
      date: DATE_REGEX.exec(dateText)?.[1] ?? undefined,
      categories,
      previewText: newsfeedItem.querySelector("p.desc")?.textContent?.trim(),
    };
  };

  private static extractNewsfeedItems(
    html: string,
    baseUrl: string,
  ): NewsfeedArticle[] {
    const root: HTMLElement = parse(html);
    const newsfeedItems = root.querySelectorAll(".news-item");
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
    // scrape multiple pages
    const pages = [];
    for (let i = 1; i <= NEWSFEED_PAGES; i++) {
      const url =
        i === 1 ? PWR_URL[language] : `${PWR_URL[language]}?i_page=${i}`;
      const page = await this.scrapeNewsfeed(url);
      if (page === null) {
        // bail if we can't scrape page 1
        if (i === 1) {
          return;
        }
        continue;
      }
      pages.push(page);
    }

    // flatten into one array (thanks javascript for not having an .append/extend function)
    const articles = pages.flat();
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
