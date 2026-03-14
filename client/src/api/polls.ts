const API_BASE_URL = "http://localhost:3001/api/polls";

export interface PollSummary {
  id: string;
  title: string;
  question: string;
  optionCount: number;
  totalVotes: number;
  createdAt: string;
}

export interface PollOption {
  id: string;
  text: string;
}

export interface PollDetails {
  id: string;
  title: string;
  question: string;
  createdAt: string;
  options: PollOption[];
}

export interface PollResultOption extends PollOption {
  votes: number;
  percentage: number;
}

export interface PollResults {
  id: string;
  title: string;
  question: string;
  totalVotes: number;
  options: PollResultOption[];
}

interface ApiError {
  message: string;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(errorData?.message ?? "Сталася помилка API");
  }

  return (await response.json()) as T;
}

export async function getPolls(): Promise<PollSummary[]> {
  const response = await fetch(API_BASE_URL);
  return parseResponse<PollSummary[]>(response);
}

export async function createPoll(payload: {
  title: string;
  question: string;
  options: string[];
}): Promise<PollDetails> {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return parseResponse<PollDetails>(response);
}

export async function getPoll(pollId: string): Promise<PollDetails> {
  const response = await fetch(`${API_BASE_URL}/${pollId}`);
  return parseResponse<PollDetails>(response);
}

export async function voteForOption(pollId: string, optionId: string): Promise<PollResults> {
  const response = await fetch(`${API_BASE_URL}/${pollId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ optionId })
  });

  const data = await parseResponse<{ message: string; results: PollResults }>(response);
  return data.results;
}

export async function getPollResults(pollId: string): Promise<PollResults> {
  const response = await fetch(`${API_BASE_URL}/${pollId}/results`);
  return parseResponse<PollResults>(response);
}
