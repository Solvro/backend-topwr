import { DateTime } from "luxon";

import GuideArticle from "#models/guide_article";
import GuideQuestion from "#models/guide_question";

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
    FAQ_Types_id: number;
    FAQ_id: number;
    sort: number;
  }[];
}

export async function faqScript() {
  let articlesResponse;
  let questionsResponse;
  let pivotTableResponse;

  try {
    articlesResponse = await fetch(
      "https://admin.topwr.solvro.pl/items/FAQ_Types",
    );
    questionsResponse = await fetch("https://admin.topwr.solvro.pl/items/FAQ");

    pivotTableResponse = await fetch(
      "https://admin.topwr.solvro.pl/items/FAQ_Types_FAQ",
    );

    if (
      !articlesResponse.ok ||
      !questionsResponse.ok ||
      !pivotTableResponse.ok
    ) {
      console.error("Error fetching data");
    }
  } catch {
    console.error("Error fetching data");
    return;
  }

  console.log("Fetching data...");

  const articlesResult = (await articlesResponse.json()) as GuideArticlesOld;
  const questionsResult = (await questionsResponse.json()) as GuideQuestionsOld;
  const pivotTableResult = (await pivotTableResponse.json()) as PivotTable;

  for (const article of articlesResult.data) {
    let createdAt = DateTime.fromMillis(0);
    let updatedAt = DateTime.fromMillis(0);

    for (const pivot of pivotTableResult.data.filter(
      (p) => p.FAQ_Types_id === article.id,
    )) {
      const question = questionsResult.data.find((q) => q.id === pivot.FAQ_id);

      if (question === undefined) {
        console.error("Question not found");
        return;
      }

      if (DateTime.fromISO(question.date_created) > createdAt) {
        createdAt = DateTime.fromISO(question.date_created);
      }

      if (DateTime.fromISO(question.date_updated) > updatedAt) {
        updatedAt = DateTime.fromISO(question.date_updated);
      }
    }

    await GuideArticle.create({
      id: article.id,
      title: article.name,
      shortDesc: article.short_description,
      description: article.description ?? "",
      imagePath: article.cover,
      createdAt,
      updatedAt,
    });
  }

  for (const pivot of pivotTableResult.data.filter(
    (p) => p.FAQ_Types_id !== null,
  )) {
    const question = questionsResult.data.find((q) => q.id === pivot.FAQ_id);

    if (question === undefined) {
      console.error("Question not found");
      return;
    }

    await GuideQuestion.create({
      title: question.question,
      answer: question.answer,
      articleId: pivot.FAQ_Types_id,
    });
  }

  console.info("FAQ data successfully added to the database!");
}
