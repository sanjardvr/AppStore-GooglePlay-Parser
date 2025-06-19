// app/api/analyze-play/route.ts
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

function analyzeKeywords(text: string, phrases: string[]) {
  const textWords = new Set(text.toLowerCase().match(/\b\w+\b/g));
  const results: {
    phrase: string;
    match: number;
    total: number;
    percent: number;
    matchedWords: string[];
  }[] = [];

  for (const phrase of phrases) {
    const phraseWords = phrase.toLowerCase().split(/\s+/);
    const matchedWords = phraseWords.filter((word) => textWords.has(word));
    const percent = Math.round((matchedWords.length / phraseWords.length) * 100);

    if (matchedWords.length > 0) {
      results.push({
        phrase,
        match: matchedWords.length,
        total: phraseWords.length,
        percent,
        matchedWords,
      });
    }
  }

  return results.sort((a, b) => b.percent - a.percent);
}

export async function POST(req: Request) {
  try {
    const { url, phrases } = await req.json();

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
    const results = analyzeKeywords(fullText, phrases);

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Play Store parsing failed:", err);
    return NextResponse.json({ error: "Failed to parse Play Store page." }, { status: 500 });
  }
}