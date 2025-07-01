import { NextRequest, NextResponse } from "next/server";
import * as appstore from "app-store-scraper";
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
              "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept-Language": `${lang},en;q=0.9`,
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            },
            maxRedirects: 5,
            validateStatus: (status) => status < 400,
          });

          const $ = cheerio.load(appResponse.data);
          
          // Try multiple selectors for title
          const title = $("h1.product-header__title").first().text().trim() || 
                       $("h1").first().text().trim() || 
                       result.title;

          // Try multiple selectors for developer
          const developer = $("h2.product-header__identity a").first().text().trim() || 
                           $("a[href*='/developer/']").first().text().trim() ||
                           $("h2 + span").text().trim() ||
                           result.developer;

          // Try multiple selectors for description
          const description = $("div.product-header__list div.we-truncate").first().text().trim() ||
                             $("section.section--description div.we-clamp").first().text().trim() ||
                             $("div[data-test-id='product-description']").first().text().trim() ||
                             result.description;
          
          // Try multiple selectors for subtitle
          const subtitle = $("h2.product-header__subtitle.app-header__subtitle").text().trim() ||
                          $("h2.product-header__subtitle").text().trim() ||
                          $("div.product-header__list div.we-truncate").first().text().trim() ||
                          $("p.product-header__list").first().text().trim() ||
                          "";

          apps.push({
            title: title || "N/A",
            subtitle: subtitle || "N/A", 
            developer: developer || "N/A",
            description: description || "N/A",
            url: webUrl,
            country,
            language: lang,
          });
        } catch (e) {
          console.error(`Error parsing app ${result.id}:`, e);
          
          // If web scraping fails, use the data from app-store-scraper directly
          try {
            const detailedApp = await appstore.app({ 
              id: result.id, 
              country, 
              lang 
            });
            
            apps.push({
              title: detailedApp.title || result.title || "N/A",
              subtitle: detailedApp.subtitle || result.subtitle || "N/A",
              developer: detailedApp.developer || result.developer || "N/A", 
              description: detailedApp.description || result.description || "N/A",
              url: detailedApp.url || result.url || `https://apps.apple.com/${country}/app/id${result.id}`,
              country,
              language: lang,
            });
          } catch (fallbackError) {
            console.error(`Fallback also failed for app ${result.id}:`, fallbackError);
            apps.push({
              title: result.title || "N/A",
              subtitle: result.subtitle || "N/A",
              developer: result.developer || "N/A",
              description: result.description || "N/A",
              url: result.url || `https://apps.apple.com/${country}/app/id${result.id}`,
              country,
              language: lang,
            });
          }
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
        error: "Error parsing App Store",
        country,
        language: lang,
      });
    }
  }

  return NextResponse.json({ results });
}