// app/api/analyze-play/route.ts
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const KEY_PHRASES = [
  "pre k preschool learning games",
  "toddler games for 4 year olds",
  "toddler games for 2 year olds",
  "baby games for 1yr 2yr 3yr old",
  "preschool learning",
  "educational games for children age 4 6",
  "toddler",
  "kids learning games",
  "abc learning for kids",
  "shapes and colors for toddlers",
  "learning numbers",
  "phonics for kids",
  "early education games",
  "kindergarten learning",
  "fun learning games",
  "puzzle games for toddlers",
  "games for babies",
  "games for toddlers",
  "math games for kids",
  "preschool abc",
  "reading games for kids",
  "colors and shapes",
  "preschool puzzle",
  "learning games for toddlers",
  "kids educational games"
];

function analyzeKeywords(text: string, phrases: string[]) {
  const textWords = new Set(text.toLowerCase().match(/\b\w+\b/g));
  const results: { phrase: string; match: number; total: number; percent: number }[] = [];

  for (const phrase of phrases) {
    const phraseWords = phrase.toLowerCase().split(" ");
    const match = phraseWords.filter((word) => textWords.has(word)).length;
    const percent = Math.round((match / phraseWords.length) * 100);

    if (match > 0) {
      results.push({ phrase, match, total: phraseWords.length, percent });
    }
  }

  return results.sort((a, b) => b.percent - a.percent);
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || !url.includes("play.google.com")) {
      return NextResponse.json({ error: "Invalid Play Store URL" }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `HTTP Error: ${res.status}` }, { status: res.status });
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const title = $('h1 span').first().text().trim();
    const description = $('div[jsname="sngebd"]').first().text().trim();

    const fullText = `${title} ${description}`;
    const results = analyzeKeywords(fullText, KEY_PHRASES);

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Play Store parsing failed:", err);
    return NextResponse.json({ error: "Failed to parse Play Store page." }, { status: 500 });
  }
}
