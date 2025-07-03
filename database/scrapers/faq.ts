import { DateTime } from "luxon";

import {
  BaseScraperModule,
  SourceResponse,
  TaskHandle,
} from "#commands/db_scrape";
import GuideArticle from "#models/guide_article";
import GuideQuestion from "#models/guide_question";
import { fixSequence } from "#utils/db";

interface GuideArticleOld {
  id: number;
  name: string;
  cover: string;
  short_description: string;
  description: string | null;
  order: number;
  questions: number[];
}

interface GuideQuestionOld {
  id: number;
  status: string;
  date_created: string;
  date_updated: string;
  question: string;
  answer: string;
  type: number;
}

interface PivotTable {
  id: number;
  FAQ_Types_id: number | null;
  FAQ_id: number;
  sort: number | null;
}

export default class FaqSectionScrapper extends BaseScraperModule {
  static name = "FAQs";
  static description =
    "Articles, questions, answers, and authors of the FAQ section";
  static taskTitle = "Scrape the faq section";

  async shouldRun(): Promise<boolean> {
    return await this.modelHasNoRows(GuideArticle, GuideQuestion);
  }

  async run(task: TaskHandle) {
    task.update("Fetching data...");
    const [articlesResponse, questionsResponse, pivotTableResponse] =
      await Promise.all([
        fetch("https://admin.topwr.solvro.pl/items/FAQ_Types"),
        fetch("https://admin.topwr.solvro.pl/items/FAQ"),
        fetch("https://admin.topwr.solvro.pl/items/FAQ_Types_FAQ"),
      ]);

    if (!articlesResponse.ok) {
      throw new Error(
        `Failed to fetch articles - got response status code ${articlesResponse.status}`,
      );
    }
    if (!questionsResponse.ok) {
      throw new Error(
        `Failed to fetch questions - got response status code ${questionsResponse.status}`,
      );
    }
    if (!pivotTableResponse.ok) {
      throw new Error(
        `Failed to fetch pivot table - got response status code ${pivotTableResponse.status}`,
      );
    }
    const [articlesResult, questionsResult, pivotTableResult] =
      await Promise.all([
        articlesResponse.json() as Promise<SourceResponse<GuideArticleOld>>,
        questionsResponse.json() as Promise<SourceResponse<GuideQuestionOld>>,
        pivotTableResponse.json() as Promise<SourceResponse<PivotTable>>,
      ]);

    task.update("Migrating images & saving data...");
    for (const article of articlesResult.data) {
      let createdAt: DateTime = DateTime.now();
      let updatedAt = DateTime.fromMillis(0);

      for (const pivot of pivotTableResult.data.filter(
        (p) => p.FAQ_Types_id === article.id,
      )) {
        const question = questionsResult.data.find(
          (q) => q.id === pivot.FAQ_id,
        );

        if (question === undefined) {
          this.logger.warning(
            `Pivot references missing question (ID=${pivot.FAQ_id}) for article ID=${article.id} ("${article.name}"). ` +
              `This may be a data inconsistency in the source. Skipping this question...`,
          );
          continue;
        }

        const questionCreatedAt = DateTime.fromISO(question.date_created);
        const questionUpdatedAt = DateTime.fromISO(question.date_updated);

        if (questionCreatedAt < createdAt) {
          createdAt = questionCreatedAt;
        }

        if (questionUpdatedAt > updatedAt) {
          updatedAt = questionUpdatedAt;
        }
      }
      await GuideArticle.create({
        id: article.id,
        title: article.name,
        shortDesc: article.short_description,
        description: article.description ?? "",
        imageKey:
          (await this.directusUploadFieldAndGetKey(article.cover)) ?? "",
        createdAt,
        updatedAt,
      });
    }

    for (const pivot of pivotTableResult.data) {
      if (pivot.FAQ_Types_id === null) {
        continue;
      }
      const question = questionsResult.data.find((q) => q.id === pivot.FAQ_id);

      if (question === undefined) {
        this.logger.warning(
          `Pivot references missing question (ID=${pivot.FAQ_id}) for article ID=${pivot.FAQ_Types_id}. ` +
            `This may be a data inconsistency in the source. Skipping this question...`,
        );
        continue;
      }

      await GuideQuestion.create({
        title: question.question,
        answer: question.answer,
        articleId: pivot.FAQ_Types_id,
      });
    }

    for (const question of questionsResult.data) {
      if (!pivotTableResult.data.some((p) => p.FAQ_id === question.id)) {
        this.logger.warning(
          `Question (ID=${question.id}) is not referenced by any article. This may be a data inconsistency in the source. Skipping this question...`,
        );
      }
    }
    task.update("Fixing primary key sequences");
    const newId = await fixSequence("guide_articles");
    task.update(`Next ID for guide_articles updated to ${newId}`);
  }
}
