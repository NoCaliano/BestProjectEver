import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  createPoll,
  getPoll,
  getPollResults,
  getPolls,
  voteForOption
} from "./api/polls";
import type { PollDetails, PollResults, PollSummary } from "./api/polls";
import "./App.css";

type Route =
  | { name: "home" }
  | { name: "create" }
  | { name: "vote"; pollId: string }
  | { name: "results"; pollId: string };

function parseRoute(pathname: string): Route {
  const parts = pathname.split("/").filter(Boolean);

  if (parts.length === 0) return { name: "home" };
  if (parts[0] === "create") return { name: "create" };
  if (parts[0] === "poll" && parts[1] && parts[2] === "vote") {
    return { name: "vote", pollId: parts[1] };
  }
  if (parts[0] === "poll" && parts[1] && parts[2] === "results") {
    return { name: "results", pollId: parts[1] };
  }

  return { name: "home" };
}

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function LinkButton({ to, children }: { to: string; children: string }) {
  return (
    <button className="link-button" onClick={() => navigate(to)}>
      {children}
    </button>
  );
}

function HomePage() {
  const [polls, setPolls] = useState<PollSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPolls()
      .then((data) => setPolls(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <div className="page-header">
        <h1>Онлайн-опитування</h1>
        <LinkButton to="/create">Створити опитування</LinkButton>
      </div>

      {loading && <p>Завантаження опитувань...</p>}
      {error && <p className="error">Помилка: {error}</p>}
      {!loading && !error && polls.length === 0 && <p>Поки немає жодного опитування.</p>}

      <div className="poll-grid">
        {polls.map((poll) => (
          <article className="card" key={poll.id}>
            <h3>{poll.title}</h3>
            <p>{poll.question}</p>
            <p className="meta">
              Варіантів: {poll.optionCount} · Голосів: {poll.totalVotes}
            </p>
            <div className="card-actions">
              <LinkButton to={`/poll/${poll.id}/vote`}>Голосувати</LinkButton>
              <LinkButton to={`/poll/${poll.id}/results`}>Результати</LinkButton>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CreatePollPage() {
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return Boolean(title.trim() && question.trim() && options.filter((item) => item.trim()).length >= 2);
  }, [options, question, title]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      setError("");
      const created = await createPoll({
        title,
        question,
        options
      });
      navigate(`/poll/${created.id}/vote`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося створити опитування");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <div className="page-header">
        <h1>Створення опитування</h1>
        <LinkButton to="/">На головну</LinkButton>
      </div>

      <form className="card form" onSubmit={handleSubmit}>
        <label>
          Назва опитування
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Наприклад, Улюблена мова" />
        </label>

        <label>
          Запитання
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Яку мову програмування ви обираєте?"
          />
        </label>

        <div className="options-block">
          <p>Варіанти відповідей</p>
          {options.map((option, index) => (
            <input
              key={index}
              value={option}
              onChange={(e) => {
                const next = [...options];
                next[index] = e.target.value;
                setOptions(next);
              }}
              placeholder={`Варіант ${index + 1}`}
            />
          ))}

          <button type="button" onClick={() => setOptions((prev) => [...prev, ""])}>
            + Додати варіант
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={!canSubmit || submitting}>
          {submitting ? "Створення..." : "Створити"}
        </button>
      </form>
    </section>
  );
}

function VotePage({ pollId }: { pollId: string }) {
  const [poll, setPoll] = useState<PollDetails | null>(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendingVote, setSendingVote] = useState(false);

  useEffect(() => {
    getPoll(pollId)
      .then(setPoll)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [pollId]);

  const submitVote = async () => {
    if (!selectedOption) return;

    try {
      setSendingVote(true);
      await voteForOption(pollId, selectedOption);
      navigate(`/poll/${pollId}/results`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося надіслати голос");
    } finally {
      setSendingVote(false);
    }
  };

  return (
    <section>
      <div className="page-header">
        <h1>Голосування</h1>
        <LinkButton to="/">На головну</LinkButton>
      </div>

      {loading && <p>Завантаження запитання...</p>}
      {error && <p className="error">{error}</p>}
      {poll && (
        <div className="card">
          <h3>{poll.title}</h3>
          <p>{poll.question}</p>
          <div className="options-block">
            {poll.options.map((option) => (
              <label className="radio-option" key={option.id}>
                <input
                  type="radio"
                  name="poll-option"
                  value={option.id}
                  checked={selectedOption === option.id}
                  onChange={(e) => setSelectedOption(e.target.value)}
                />
                <span>{option.text}</span>
              </label>
            ))}
          </div>
          <div className="card-actions">
            <button onClick={submitVote} disabled={!selectedOption || sendingVote}>
              {sendingVote ? "Надсилання..." : "Голосувати"}
            </button>
            <LinkButton to={`/poll/${poll.id}/results`}>Переглянути результати</LinkButton>
          </div>
        </div>
      )}
    </section>
  );
}

function ResultsPage({ pollId }: { pollId: string }) {
  const [results, setResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPollResults(pollId)
      .then(setResults)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [pollId]);

  return (
    <section>
      <div className="page-header">
        <h1>Результати</h1>
        <div className="card-actions">
          <LinkButton to="/">На головну</LinkButton>
          <LinkButton to={`/poll/${pollId}/vote`}>Назад до голосування</LinkButton>
        </div>
      </div>

      {loading && <p>Завантаження результатів...</p>}
      {error && <p className="error">{error}</p>}

      {results && (
        <div className="card">
          <h3>{results.title}</h3>
          <p>{results.question}</p>
          <p className="meta">Всього голосів: {results.totalVotes}</p>

          <div className="result-list">
            {results.options.map((option) => (
              <div key={option.id}>
                <div className="result-row">
                  <span>{option.text}</span>
                  <strong>
                    {option.votes} ({option.percentage}%)
                  </strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${option.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <main className="container">
      {route.name === "home" && <HomePage />}
      {route.name === "create" && <CreatePollPage />}
      {route.name === "vote" && <VotePage pollId={route.pollId} />}
      {route.name === "results" && <ResultsPage pollId={route.pollId} />}
    </main>
  );
}

export default App;
