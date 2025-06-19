"use client";
import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [appStoreUrl, setAppStoreUrl] = useState("");
  const [playStoreUrl, setPlayStoreUrl] = useState("");

  const [appStoreResults, setAppStoreResults] = useState<any[]>([]);
  const [playStoreResults, setPlayStoreResults] = useState<any[]>([]);

  const [errorApp, setErrorApp] = useState("");
  const [errorPlay, setErrorPlay] = useState("");

  const [loadingApp, setLoadingApp] = useState(false);
  const [loadingPlay, setLoadingPlay] = useState(false);

  const handleAppStoreAnalyze = async () => {
    if (!appStoreUrl.trim()) return;

    setErrorApp("");
    setAppStoreResults([]);
    setLoadingApp(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: appStoreUrl }),
      });

      const data = await res.json();
      if (res.ok) {
        setAppStoreResults(data.results);
      } else {
        setErrorApp(data.error || "⚠️ Что-то пошло не так.");
      }
    } catch (err) {
      setErrorApp("❌ Не удалось подключиться к серверу.");
    } finally {
      setLoadingApp(false);
    }
  };

  const handlePlayStoreAnalyze = async () => {
    if (!playStoreUrl.trim()) return;

    setErrorPlay("");
    setPlayStoreResults([]);
    setLoadingPlay(true);

    try {
      const res = await fetch("/api/analyze-play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: playStoreUrl }),
      });

      const data = await res.json();
      if (res.ok) {
        setPlayStoreResults(data.results);
      } else {
        setErrorPlay(data.error || "⚠️ Что-то пошло не так.");
      }
    } catch (err) {
      setErrorPlay("❌ Не удалось подключиться к серверу.");
    } finally {
      setLoadingPlay(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1>Binky Parser</h1>
      <div className={styles.columns}>
        {/* App Store Column */}
        <div className={styles.wrapper}>
          <div>App Store ссылка</div>
          <input
            className={styles.Input}
            type="text"
            value={appStoreUrl}
            onChange={(e) => setAppStoreUrl(e.target.value)}
            placeholder="https://apps.apple.com/..."
          />
          <div className={styles.startButton} onClick={handleAppStoreAnalyze}>
            {loadingApp ? "Обработка..." : "Начать"}
          </div>

          {!errorApp && appStoreResults.length > 0 && (
            <div className={styles.Results}>
              <strong>Результат (App Store):</strong>
              <ul>
                {appStoreResults.map(({ phrase, match, total, percent }) => (
                  <li key={phrase}>
                    ✅ <strong>{phrase}</strong> — {match}/{total} слов совпало ({percent}%)
                  </li>
                ))}
              </ul>
            </div>
          )}
          {errorApp && <div style={{ color: "red" }}>{errorApp}</div>}
        </div>

        {/* Play Store Column */}
        <div className={styles.wrapper}>
          <div>Play Market ссылка</div>
          <input
            className={styles.Input}
            type="text"
            value={playStoreUrl}
            onChange={(e) => setPlayStoreUrl(e.target.value)}
            placeholder="https://play.google.com/store/apps/details?id=..."
          />
          <div className={styles.startButton} onClick={handlePlayStoreAnalyze}>
            {loadingPlay ? "Обработка..." : "Начать"}
          </div>

          {!errorPlay && playStoreResults.length > 0 && (
            <div className={styles.Results}>
              <strong>Результат (Play Store):</strong>
              <ul>
                {playStoreResults.map(({ phrase, match, total, percent }) => (
                  <li key={phrase}>
                    ✅ <strong>{phrase}</strong> — {match}/{total} слов совпало ({percent}%)
                  </li>
                ))}
              </ul>
            </div>
          )}
          {errorPlay && <div style={{ color: "red" }}>{errorPlay}</div>}
        </div>
      </div>
    </div>
  );
}
