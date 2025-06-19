// app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
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

export async function POST(req: NextRequest) {
  try {
    const { url, phrases } = await req.json();

    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const $ = cheerio.load(response.data);
    const title = $("h1").first().text().trim();
    const subtitle = $("h2").first().text().trim();
    const description = $("section.section__description").text().trim();

    const combinedText = `${title} ${subtitle} ${description}`.toLowerCase();

    const results = analyzeKeywords(combinedText, phrases);

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Failed to analyze the URL." }, { status: 500 });
  }
}
