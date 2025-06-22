import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const keywords: string[] = body.keywords;

  if (!keywords || !Array.isArray(keywords)) {
    return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 });
  }

  const results = [];

  for (const keyword of keywords) {
    try {
      const url = `https://play.google.com/store/search?q=${encodeURIComponent(keyword)}&c=apps`;
      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      const $ = cheerio.load(response.data);
      const apps: { title: string; url: string }[] = [];

      $("a[href^='/store/apps/details']").each((_, el) => {
        const link = $(el).attr("href");
        const title = $(el).text().trim();

        // Если текста нет, пробуем извлечь title через вложенные div'ы
        const fallback = $(el).find("div").first().text().trim();

        const finalTitle = title || fallback;

        if (link && finalTitle && !apps.find((a) => a.url === link)) {
          apps.push({ title: finalTitle, url: `https://play.google.com${link}` });
        }
      });

      const kidsWords = ["kids", "child", "toddler", "baby", "preschool", "learning"];
      const kidsApps = apps.filter((app) =>
        kidsWords.some((word) => app.title.toLowerCase().includes(word))
      );

      results.push({
        keyword,
        total: apps.length,
        kids: kidsApps.length,
        relevance: ((kidsApps.length / (apps.length || 1)) * 100).toFixed(1),
        apps: apps.slice(0, 10),
      });
    } catch (e) {
      results.push({
        keyword,
        total: 0,
        kids: 0,
        relevance: "0.0",
        apps: [],
        error: "Ошибка при парсинге или блокировка Google",
      });
    }
  }

  return NextResponse.json({ results });
}
