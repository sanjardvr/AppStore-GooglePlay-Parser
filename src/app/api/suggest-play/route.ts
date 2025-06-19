import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "Параметр q обязателен" }, { status: 400 });
  }

  const suggestRes = await fetch(
    `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`
  );

  if (!suggestRes.ok) {
    return NextResponse.json({ error: "Ошибка подсказок" }, { status: 500 });
  }

  const suggestJson = await suggestRes.json();
  // Структура: [запрос, [подсказки...], ...]
  const suggestions: string[] = suggestJson[1] || [];
  return NextResponse.json({ suggestions });
}
