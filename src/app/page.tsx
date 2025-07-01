// app/keyword-analysis/page.tsx
"use client";

import { useState } from "react";
import styles from "./page.module.css";

const countries = [
  { code: "gb", name: "🇬🇧 United Kingdom" },
  { code: "us", name: "🇺🇸 United States" },
  { code: "au", name: "🇦🇺 Australia" },
  { code: "ca", name: "🇨🇦 Canada" },
  { code: "sa", name: "🇸🇦 Saudi Arabia" },
  { code: "ae", name: "🇦🇪 UAE" },
  { code: "vn", name: "🇻🇳 Vietnam" },
  { code: "id", name: "🇮🇩 Indonesia" },
  { code: "es", name: "🇪🇸 Spain" },
  { code: "it", name: "🇮🇹 Italy" },
  { code: "cn", name: "🇨🇳 China" },
  { code: "kr", name: "🇰🇷 South Korea" },
  { code: "de", name: "🇩🇪 Germany" },
  { code: "pl", name: "🇵🇱 Poland" },
  { code: "pt", name: "🇵🇹 Portugal" },
  { code: "br", name: "🇧🇷 Brazil" },
  { code: "ru", name: "🇷🇺 Russia" },
  { code: "tr", name: "🇹🇷 Turkey" },
  { code: "fr", name: "🇫🇷 France" },
  { code: "in", name: "🇮🇳 India" },
  { code: "se", name: "🇸🇪 Sweden" },
  { code: "ua", name: "🇺🇦 Ukraine" },
  { code: "cz", name: "🇨🇿 Czechia" },
  { code: "hr", name: "🇭🇷 Croatia" },
  { code: "ro", name: "🇷🇴 Romania" },
  { code: "my", name: "🇲🇾 Malaysia" },
  { code: "il", name: "🇮🇱 Israel" },
  { code: "gr", name: "🇬🇷 Greece" },
  { code: "nl", name: "🇳🇱 Netherlands" },
  { code: "dk", name: "🇩🇰 Denmark" },
  { code: "fi", name: "🇫🇮 Finland" },
  { code: "th", name: "🇹🇭 Thailand" },
  { code: "mx", name: "🇲🇽 Mexico" },
];


export default function KeywordAnalysisPage() {
  const [keywords, setKeywords] = useState("child game\ntoddler app\nbaby learning");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [store, setStore] = useState<"play" | "appstore">("play");
  const [country, setCountry] = useState("us");

  const handleAnalyze = async () => {
    setIsLoading(true);
    const api = store === "play" ? "/api/analyze" : "/api/analyze-appstore";
    const res = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        keywords: keywords.split("\n").map(k => k.trim()).filter(Boolean),
        country 
      }),
    });
    const data = await res.json();
    setResults(data.results);
    setIsLoading(false);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Binky Parser</h1>

      <div className={styles.toggleWrapper}>
        <button
          className={`${styles.toggleButton} ${store === "play" ? styles.active : ""}`}
          onClick={() => setStore("play")}
        >
          Play Market
        </button>
        <button
          className={`${styles.toggleButton} ${store === "appstore" ? styles.active : ""}`}
          onClick={() => setStore("appstore")}
        >
          App Store
        </button>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className={styles.dropdown}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.card}>
        <p className={styles.description}>
          Введите ключевые слова (по одному на строку), чтобы узнать, какие из них чаще приводят к детским приложениям:
        </p>
        <textarea
          className={styles.textarea}
          rows={8}
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder={`Например:\nchild game\ntoddler games\nbaby learning`}
        />
        <button
          className={styles.button}
          onClick={handleAnalyze}
          disabled={isLoading}
        >
          {isLoading ? "Анализируем..." : "Анализировать"}
        </button>
      </div>

      {results.length > 0 && (
        <div className={styles.results}>
          <h2 className={styles.resultsHeading}>Результаты ({country.toUpperCase()})</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ключевое слово</th>
                <th>Всего приложений</th>
                <th>Детских приложений</th>
                <th>Релевантность</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td>{r.keyword}</td>
                  <td>{r.total}</td>
                  <td>{r.kids}</td>
                  <td>{r.relevance}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.appListWrapper}>
            {results.map((r, i) => (
              <div key={i} className={styles.appGroup}>
                <h3>{r.keyword} (Top {r.apps?.length || 0})</h3>
                {r.apps?.length > 0 ? (
                  <table className={styles.detailedTable}>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Subtitle</th>
                        <th>Developer</th>
                        <th>Description</th>
                        <th>URL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.apps.map((app: any, index: number) => (
                        <tr key={index}>
                          <td>{app.title}</td>
                          <td>{app.subtitle || "N/A"}</td>
                          <td>{app.developer || "N/A"}</td>
                          <td>{app.description || "N/A"}</td>
                          <td>
                            <a href={app.url} target="_blank" rel="noopener noreferrer">
                              View
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>Нет приложений для отображения.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}