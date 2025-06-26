import { NextRequest, NextResponse } from "next/server";
import * as appstore from "app-store-scraper";
import axios from "axios";
import * as cheerio from "cheerio";

const LANGUAGE_MAP: Record<string, string> = {
  us: "en",
  gb: "en",
  de: "de",
  fr: "fr",
  jp: "ja",
  ru: "ru",
  ca: "en",
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const keywords: string[] = body.keywords;
  const country: string = body.country || "us";
  const lang = LANGUAGE_MAP[country] || "en";

  if (!keywords || !Array.isArray(keywords)) {
    return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
  }

  const results = [];

  for (const keyword of keywords) {
    try {
      const searchResults = await appstore.search({
        term: keyword,
        num: 20,
        country,
        lang, // Use the mapped language
      });

      const apps = [];
      for (const result of searchResults.slice(0, 10)) {
        try {
          // Construct web URL with proper country code
          const appId = result.id || result.url.match(/id(\d+)/)?.[1];
          const webUrl = `https://apps.apple.com/${country}/app/id${appId}`;
          
          const appResponse = await axios.get(webUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
              "Accept-Language": `${lang},en;q=0.9`,
            },
          });
          const $ = cheerio.load(appResponse.data);

          const title = $("h1").first().text().trim();
          const developer = $("h2 + span").text().trim();
          const description = $("section.section--description div.we-clamp").first().text().trim();

          apps.push({
            title,
            developer,
            description,
            url: webUrl,
            country,
            language: lang,
          });
        } catch (e) {
          console.error(`Error parsing app ${result.id}:`, e);
          apps.push({
            title: result.title,
            developer: result.developer || "N/A",
            description: result.description || "N/A",
            url: result.url,
            country,
            language: lang,
          });
        }
      }

      const kidsWords = ["kids", "child", "toddler", "baby", "preschool", "learning"];
      const kidsApps = apps.filter(app =>
        kidsWords.some(word =>
          (app.title + app.description).toLowerCase().includes(word)
        )
      );

      results.push({
        keyword,
        total: apps.length,
        kids: kidsApps.length,
        relevance: ((kidsApps.length / (apps.length || 1)) * 100).toFixed(1),
        apps,
        country,
        language: lang,
      });
    } catch (e) {
      console.error(`Error for keyword "${keyword}":`, e);
      results.push({
        keyword,
        total: 0,
        kids: 0,
        relevance: "0.0",
        apps: [],
        error: "Error parsing App Store",
        country,
        language: lang,
      });
    }
  }

  return NextResponse.json({ results });
}