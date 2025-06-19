// app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
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

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const $ = cheerio.load(response.data);
    const title = $("h1").first().text().trim();
    const subtitle = $("h2").first().text().trim();
    const description = $("section.section__description").text().trim();

    const combinedText = `${title} ${subtitle} ${description}`.toLowerCase();
    const textWords = new Set(combinedText.match(/\b\w+\b/g) || []);

    const results = KEY_PHRASES.map((phrase) => {
      const words = phrase.toLowerCase().split(" ");
      const match = words.filter((w) => textWords.has(w));
      const percent = Math.round((match.length / words.length) * 100);
      return match.length > 0
        ? { phrase, match: match.length, total: words.length, percent }
        : null;
    }).filter(Boolean);

    results.sort((a, b) => b!.percent - a!.percent);

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Failed to analyze the URL." }, { status: 500 });
  }
}
