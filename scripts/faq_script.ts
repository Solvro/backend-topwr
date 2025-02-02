import { DateTime } from "luxon";
import fs from "node:fs";
import path from "node:path";

import logger from "@adonisjs/core/services/logger";
import { MultipartFile } from "@adonisjs/core/types/bodyparser";

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

async function uploadImage(imageUrl: string) {
  const filesService = new FilesService();
  const tempFilePath = path.resolve(
    import.meta.dirname,
    "..",
    "..",
    "assets",
    "temp_image.png",
  );

  try {
    const fetchedImage = await fetch(imageUrl);
    if (!fetchedImage.ok) {
      logger.error(
        `Failed to download image. HTTP status: ${fetchedImage.status}`,
      );
      return "";
    }

    const arrayBuffer = await fetchedImage.arrayBuffer();
    fs.writeFileSync(tempFilePath, Buffer.from(arrayBuffer));

    const fileStats = fs.statSync(tempFilePath);

    const file = {
      size: fileStats.size,
      extname: path.extname(tempFilePath),
      tmpPath: tempFilePath,
      moveToDisk: async (key: string) => {
        const destination = path.resolve(
          import.meta.dirname,
          "..",
          "..",
          "storage",
          key,
        );
        fs.copyFileSync(tempFilePath, destination);
      },
    };

    const result = await filesService.uploadFile(file as MultipartFile);

    if (result instanceof Error) {
      logger.error("File upload failed:", result);
      return "";
    }

    return result;
  } catch (error) {
    logger.error("Error processing image:", error);
    return "";
  } finally {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}

export async function faqScript() {
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

  logger.info("Fetching data...");
  const articlesResult = (await articlesResponse.json()) as GuideArticlesOld;
  const questionsResult = (await questionsResponse.json()) as GuideQuestionsOld;
  const pivotTableResult = (await pivotTableResponse.json()) as PivotTable;

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

      if (DateTime.fromISO(question.date_created) < createdAt) {
        createdAt = DateTime.fromISO(question.date_created);
      }

      if (DateTime.fromISO(question.date_updated) > updatedAt) {
        updatedAt = DateTime.fromISO(question.date_updated);
      }
    }

    const imagePath = await uploadImage(
      `https://admin.topwr.solvro.pl/items/assets${article.cover}`,
    );

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
      articleId: pivot.FAQ_Types_id ?? 0,
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
