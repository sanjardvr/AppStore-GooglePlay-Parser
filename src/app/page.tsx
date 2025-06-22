// app/keyword-analysis/page.tsx
"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function KeywordAnalysisPage() {
  const [keywords, setKeywords] = useState("child game\ntoddler app\nbaby learning");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [store, setStore] = useState<"play" | "appstore">("play");

  const handleAnalyze = async () => {
    setIsLoading(true);
    const api = store === "play" ? "/api/analyze" : "/api/analyze-appstore";
    const res = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: keywords.split("\n") }),
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
          <h2 className={styles.resultsHeading}>Результаты</h2>
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
                <h3>{r.keyword}</h3>
                {r.apps?.length > 0 ? (
                  <ul className={styles.appList}>
                    {r.apps.map((app: any, index: number) => (
                      <li key={index}>
                        🔗 <a href={app.url} target="_blank" rel="noopener noreferrer">
                          {app.title || app.url}
                        </a>
                      </li>
                    ))}
                  </ul>
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
