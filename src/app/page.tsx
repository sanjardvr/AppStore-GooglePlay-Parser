"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [urlAppStore, setUrlAppStore] = useState("");
  const [urlPlayStore, setUrlPlayStore] = useState("");
  const [phrasesInput, setPhrasesInput] = useState(
    "pre k preschool learning games, toddler games for 4 year olds, toddler, abc learning for kids"
  );

  const [resultsAppStore, setResultsAppStore] = useState<any[]>([]);
  const [resultsPlayStore, setResultsPlayStore] = useState<any[]>([]);
  const [errorAppStore, setErrorAppStore] = useState("");
  const [errorPlayStore, setErrorPlayStore] = useState("");
  const [loadingApp, setLoadingApp] = useState(false);
  const [loadingPlay, setLoadingPlay] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const parsePhrases = () =>
    phrasesInput
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

  const analyze = async (
    url: string,
    api: string,
    setResults: (r: any[]) => void,
    setError: (e: string) => void,
    setLoading: (b: boolean) => void
  ) => {
    if (!url.trim()) return;
    setError("");
    setResults([]);
    setLoading(true);
    try {
      const res = await fetch(`/api/${api}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, phrases: parsePhrases() }),
      });
      const data = await res.json();
      if (res.ok) {
        setResults(data.results);
      } else {
        setError(data.error || "⚠️ Что-то пошло не так.");
      }
    } catch {
      setError("❌ Не удалось подключиться к серверу.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchTerm.trim().length < 2) return setSuggestions([]);
      const res = await fetch(`/api/suggest-play?q=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Binky Parser</h1>

      <div className={styles.wrapper}>
        <div className={styles.columns}>
          {/* App Store */}
          <div className={styles.column}>
            <h2>App Store</h2>
            <input
              className={styles.Input}
              type="text"
              placeholder="App Store URL"
              value={urlAppStore}
              onChange={(e) => setUrlAppStore(e.target.value)}
            />
            <div
              className={styles.startButton}
              onClick={() =>
                analyze(urlAppStore, "analyze", setResultsAppStore, setErrorAppStore, setLoadingApp)
              }
            >
              {loadingApp ? "Обработка..." : "Начать"}
            </div>
            <div className={styles.Results}>
              <strong>Результат:</strong>
              {errorAppStore && <div className={styles.error}>{errorAppStore}</div>}
              {!errorAppStore && resultsAppStore.length > 0 && (
                <ul>
                  {resultsAppStore.map(({ phrase, match, total, percent, matchedWords }) => (
                    <li key={phrase}>
                      ✅ <strong>{phrase}</strong> — {match}/{total} слов совпало ({percent}%)<br />
                      {matchedWords?.length > 0 && (
                        <span>🔍 Совпадения: {matchedWords.join(", ")}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {!errorAppStore && !resultsAppStore.length && !loadingApp && (
                <div>❌ Ни одного ключевого слова не найдено.</div>
              )}
            </div>
          </div>

          {/* Play Market */}
          <div className={styles.column}>
            <h2>Play Market</h2>
            <input
              className={styles.Input}
              type="text"
              placeholder="Play Store URL"
              value={urlPlayStore}
              onChange={(e) => setUrlPlayStore(e.target.value)}
            />
            <div
              className={styles.startButton}
              onClick={() =>
                analyze(urlPlayStore, "analyze-play", setResultsPlayStore, setErrorPlayStore, setLoadingPlay)
              }
            >
              {loadingPlay ? "Обработка..." : "Начать"}
            </div>
            <div className={styles.Results}>
              <strong>Результат:</strong>
              {errorPlayStore && <div className={styles.error}>{errorPlayStore}</div>}
              {!errorPlayStore && resultsPlayStore.length > 0 && (
                <ul>
                  {resultsPlayStore.map(({ phrase, match, total, percent, matchedWords }) => (
                    <li key={phrase}>
                      ✅ <strong>{phrase}</strong> — {match}/{total} слов совпало ({percent}%)<br />
                      {matchedWords?.length > 0 && (
                        <span>🔍 Совпадения: {matchedWords.join(", ")}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {!errorPlayStore && !resultsPlayStore.length && !loadingPlay && (
                <div>❌ Ни одного ключевого слова не найдено.</div>
              )}
            </div>
          </div>
        </div>

        {/* Custom Phrase Input */}
        <div className={styles.phraseBox}>
          <h2>Введите ключевые фразы через запятую:</h2>
          <textarea
            className={styles.Input}
            style={{ height: "150px" }}
            value={phrasesInput}
            onChange={(e) => setPhrasesInput(e.target.value)}
            placeholder="toddler games, kids learning, abc for children"
          />
        </div>

        {/* Suggestions
        <div className={styles.suggestBox}>
          <h2>Популярные запросы в Play Market:</h2>
          <input
            className={styles.Input}
            type="text"
            placeholder="Поиск..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {suggestions.length > 0 && (
            <ul className={styles.suggestionList}>
              {suggestions.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          )}
        </div> */}
      </div>
    </div>
  );
}
