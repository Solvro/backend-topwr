import { DateTime } from "luxon";

import { BaseScraperModule } from "#commands/db_scrape";
import type { SourceResponse, TaskHandle } from "#commands/db_scrape";
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
  date_created: string | null;
  date_updated: string | null;
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

function parseDate(value: string | null): DateTime | undefined {
  if (value === null) {
    return undefined;
  }
  const parsed = DateTime.fromISO(value);
  return parsed.isValid ? parsed : undefined;
}

function findQuestionDatesForArticle(
  articleId: number,
  pivots: PivotTable[],
  questions: GuideQuestionOld[],
): { createdAt?: DateTime; updatedAt?: DateTime } {
  let createdAt: DateTime | undefined;
  let updatedAt: DateTime | undefined;

  for (const pivot of pivots) {
    if (pivot.FAQ_Types_id !== articleId) {
      continue;
    }
    const question = questions.find((q) => q.id === pivot.FAQ_id);
    if (question === undefined) {
      continue;
    }

    const qCreated = parseDate(question.date_created);
    const qUpdated = parseDate(question.date_updated);

    if (
      qCreated !== undefined &&
      (createdAt === undefined || qCreated < createdAt)
    ) {
      createdAt = qCreated;
    }
    if (
      qUpdated !== undefined &&
      (updatedAt === undefined || qUpdated > updatedAt)
    ) {
      updatedAt = qUpdated;
    }
  }

  return { createdAt, updatedAt };
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
    const [articlesResult, questionsResult, pivotTableResult] =
      (await Promise.all([
        this.fetchDirectusJSON(
          "https://admin.topwr.solvro.pl/items/FAQ_Types",
          "FAQ types",
        ),
        this.fetchDirectusJSON(
          "https://admin.topwr.solvro.pl/items/FAQ",
          "FAQ",
        ),
        this.fetchDirectusJSON(
          "https://admin.topwr.solvro.pl/items/FAQ_Types_FAQ",
          "FAQ Pivot Table",
        ),
      ])) as [
        SourceResponse<GuideArticleOld>,
        SourceResponse<GuideQuestionOld>,
        SourceResponse<PivotTable>,
      ];

    task.update("Migrating images & saving data...");
    for (const article of articlesResult.data) {
      const { createdAt, updatedAt } = findQuestionDatesForArticle(
        article.id,
        pivotTableResult.data,
        questionsResult.data,
      );

      await GuideArticle.create({
        id: article.id,
        title: article.name,
        shortDesc: article.short_description,
        description: article.description ?? null,
        imageKey: await this.directusUploadFieldAndGetKey(
          article.cover,
        ).addErrorContext(
          `Cover upload for Guide Article ${article.id} failed.`,
        ),
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
        createdAt: parseDate(question.date_created),
        updatedAt: parseDate(question.date_updated),
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
