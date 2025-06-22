import { NextRequest, NextResponse } from "next/server";
import * as appstore from "app-store-scraper";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const keywords: string[] = body.keywords;

  if (!keywords || !Array.isArray(keywords)) {
    return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 });
  }

  const results = [];

  for (const keyword of keywords) {
    try {
      const apps = await appstore.search({
        term: keyword,
        num: 20,
        country: "us",
        lang: "en",
      });

      const kidsWords = ["kids", "child", "toddler", "baby", "preschool", "learning"];
      const kidsApps = apps.filter((app: { title: any; description: any; }) =>
        kidsWords.some((word) =>
          (app.title + app.description).toLowerCase().includes(word)
        )
      );

      results.push({
        keyword,
        total: apps.length,
        kids: kidsApps.length,
        relevance: ((kidsApps.length / (apps.length || 1)) * 100).toFixed(1),
        apps: apps.slice(0, 10).map((app: { title: any; url: any; }) => ({
          title: app.title,
          url: app.url,
        })),
      });
    } catch (e) {
      results.push({
        keyword,
        total: 0,
        kids: 0,
        relevance: "0.0",
        apps: [],
        error: "Ошибка при парсинге App Store",
      });
    }
  }

  return NextResponse.json({ results });
}
