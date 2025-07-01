import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

const LANGUAGE_MAP: Record<string, string> = {
  us: "en", gb: "en", au: "en", ca: "en", sa: "ar", ae: "ar", vn: "vi", id: "id",
  es: "es", it: "it", cn: "zh", kr: "ko", de: "de", pl: "pl", pt: "pt", br: "pt",
  ru: "ru", tr: "tr", fr: "fr", in: "hi", se: "sv", ua: "uk", cz: "cs", hr: "hr",
  ro: "ro", my: "ms", il: "he", gr: "el", nl: "nl", dk: "da", fi: "fi", th: "th",
  mx: "es"
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
      const url = `https://play.google.com/store/search?q=${encodeURIComponent(keyword)}&c=apps&gl=${country}&hl=${lang}`;
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": `${lang},en;q=0.9`,
        },
      });

      const $ = cheerio.load(response.data);
      const appLinks: string[] = [];

      $("a[href^='/store/apps/details']").each((_, el) => {
        const link = $(el).attr("href");
        if (link && !appLinks.includes(link)) {
          appLinks.push(link);
        }
      });

      const apps = [];

      for (const link of appLinks.slice(0, 10)) {
        try {
          const appUrl = `https://play.google.com${link}&hl=${lang}`;
          const appResponse = await axios.get(appUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
              "Accept-Language": `${lang},en;q=0.9`,
            },
          });

          const $$ = cheerio.load(appResponse.data);
          const title = $$("h1").first().text().trim();
          const developer = $$("a[href^='/store/apps/dev']").first().text().trim();
          const description = $$("div[itemprop='description'] > span").first().text().trim();
          
          // Parse subtitle from Play Store
          // Look for subtitle in multiple possible locations
          let subtitle = "";
          
          // Try different selectors for subtitle/tagline
          const subtitleSelectors = [
            "div[data-g-id='description'] p:first", // Short description paragraph
            "div[data-g-id='description'] span:first", // Short description span
            "div[jsname='sngebd'] span", // App tagline
            "div[jsname='sngebd'] p", // App tagline paragraph
            "c-wiz[jsrenderer='RBsfwb'] div[jsname='sngebd']", // Another subtitle location
            "div[jsname='sngebd']", // Generic subtitle container
          ];

          for (const selector of subtitleSelectors) {
            const possibleSubtitle = $$(selector).first().text().trim();
            if (possibleSubtitle && possibleSubtitle.length > 0 && possibleSubtitle.length < 200) {
              subtitle = possibleSubtitle;
              break;
            }
          }

          // If no subtitle found through selectors, try to extract from meta tags
          if (!subtitle) {
            subtitle = $$("meta[name='description']").attr("content")?.trim()?.substring(0, 100) || "";
          }

          apps.push({
            title,
            subtitle: subtitle || "N/A",
            developer,
            description,
            url: appUrl,
            country,
            language: lang,
          });
        } catch (e) {
          console.error(`Error parsing app ${link}:`, e);
          continue;
        }
      }

      const kidsWords = ["kids", "child", "toddler", "baby", "preschool", "learning"];
      const kidsApps = apps.filter(app =>
        kidsWords.some(word =>
          (app.title + app.subtitle + app.description).toLowerCase().includes(word)
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
        error: "Error parsing or Google block",
        country,
        language: lang,
      });
    }
  }

  return NextResponse.json({ results });
}