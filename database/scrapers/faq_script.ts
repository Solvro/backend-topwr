import { DateTime } from "luxon";
import { Readable } from "node:stream";

import logger from "@adonisjs/core/services/logger";

import GuideArticle from "#models/guide_article";
import GuideQuestion from "#models/guide_question";
import FilesService from "#services/files_service";

interface GuideArticlesOld {
  data: {
    id: number;
    name: string;
    cover: string;
    short_description: string;
    description: string | null;
    order: number;
    questions: number[];
  }[];
}

interface GuideQuestionsOld {
  data: {
    id: number;
    status: string;
    date_created: string;
    date_updated: string;
    question: string;
    answer: string;
    type: number;
  }[];
}

interface PivotTable {
  data: {
    id: number;
    FAQ_Types_id: number | null;
    FAQ_id: number;
    sort: number | null;
  }[];
}

interface ImageMetadata {
  data: {
    type: string;
  };
}

async function uploadImage(imageUrl: string) {
  const filesService = new FilesService();

  const [fetchedImage, fetchedImageMetadata] = await Promise.all([
    fetch(`https://admin.topwr.solvro.pl/assets/${imageUrl}`),
    fetch(`https://admin.topwr.solvro.pl/files/${imageUrl}`),
  ]);

  if (!fetchedImage.ok) {
    throw new Error(
      `Failed to fetch the image. HTTP status: ${fetchedImage.status}`,
    );
  }

  if (!fetchedImageMetadata.ok) {
    throw new Error(
      `Failed to fetch the image metadata. HTTP status: ${fetchedImageMetadata.status}`,
    );
  }

  const imageMetadata = (await fetchedImageMetadata.json()) as ImageMetadata;
  const extension = imageMetadata.data.type.split("/")[1];

  const stream = Readable.fromWeb(fetchedImage.body as ReadableStream);

  try {
    return await filesService.uploadStream(stream, extension);
  } catch (error) {
    throw new Error(`Failed to upload image. ${error}`);
  }
}

export default class FaqScript {
  static async run() {
    await faqScript();
  }
}

async function faqScript() {
  logger.info("Fetching data...");
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
  const [articlesResult, questionsResult, pivotTableResult] = await Promise.all(
    [
      articlesResponse.json() as Promise<GuideArticlesOld>,
      questionsResponse.json() as Promise<GuideQuestionsOld>,
      pivotTableResponse.json() as Promise<PivotTable>,
    ],
  );

  for (const article of articlesResult.data) {
    let createdAt: DateTime = DateTime.now();
    let updatedAt = DateTime.fromMillis(0);

    for (const pivot of pivotTableResult.data.filter(
      (p) => p.FAQ_Types_id === article.id,
    )) {
      const question = questionsResult.data.find((q) => q.id === pivot.FAQ_id);

      if (question === undefined) {
        logger.warn(
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

    const imagePath = await uploadImage(article.cover);

    await GuideArticle.create({
      id: article.id,
      title: article.name,
      shortDesc: article.short_description,
      description: article.description ?? "",
      imagePath,
      createdAt,
      updatedAt,
    });
  }

  for (const pivot of pivotTableResult.data.filter(
    (p) => p.FAQ_Types_id !== null,
  )) {
    const question = questionsResult.data.find((q) => q.id === pivot.FAQ_id);

    if (question === undefined) {
      logger.warn(
        `Pivot references missing question (ID=${pivot.FAQ_id}) for article ID=${pivot.FAQ_Types_id}. ` +
          `This may be a data inconsistency in the source. Skipping this question...`,
      );
      continue;
    }

    await GuideQuestion.create({
      title: question.question,
      answer: question.answer,
      articleId: pivot.FAQ_Types_id ?? undefined,
    });
  }

  for (const question of questionsResult.data) {
    if (!pivotTableResult.data.some((p) => p.FAQ_id === question.id)) {
      logger.warn(
        `Question (ID=${question.id}) is not referenced by any article. This may be a data inconsistency in the source. Skipping this question...`,
      );
    }
  }

  logger.info("FAQ data successfully added to the database!");
}
