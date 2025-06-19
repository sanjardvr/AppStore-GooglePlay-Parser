// app/page.tsx
"use client";
import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [url, setUrl] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) return;

    setError("");
    setResults([]);
    setLoading(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (res.ok) {
        setResults(data.results);
        console.log("✅ Keyword Results:", data.results); // Log here
      } else {
        setError(data.error || "⚠️ Что-то пошло не так.");
      }
    } catch (err) {
      setError("❌ Не удалось подключиться к серверу.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1>Binky Parser</h1>
      <div className={styles.wrapper}>
        <div>Вставьте ссылку на приложение (AppStore)</div>
        <div>
          <input
            className={styles.Input}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://apps.apple.com/..."
          />
        </div>
        <div className={styles.startButton} onClick={handleAnalyze}>
          {loading ? "Обработка..." : "Начать"}
        </div>

        {!error && results.length > 0 && (
          <div className={styles.Results}>
            <strong>Результат:</strong>
            <ul>
              {results.map(({ phrase, match, total, percent }) => (
                <li key={phrase}>
                  ✅ <strong>{phrase}</strong> — {match}/{total} слов совпало (
                  {percent}%)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
