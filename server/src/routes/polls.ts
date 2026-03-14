import { randomUUID } from "crypto";
import { Router } from "express";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  title: string;
  question: string;
  options: PollOption[];
  createdAt: string;
}

interface CreatePollBody {
  title?: string;
  question?: string;
  options?: string[];
}

interface VoteBody {
  optionId?: string;
}

const polls = new Map<string, Poll>();

const router = Router();

const normalizeText = (value: string) => value.trim();

const toPollSummary = (poll: Poll) => ({
  id: poll.id,
  title: poll.title,
  question: poll.question,
  optionCount: poll.options.length,
  totalVotes: poll.options.reduce((sum, option) => sum + option.votes, 0),
  createdAt: poll.createdAt
});

const toPollDetails = (poll: Poll) => ({
  id: poll.id,
  title: poll.title,
  question: poll.question,
  createdAt: poll.createdAt,
  options: poll.options.map(({ id, text }) => ({ id, text }))
});

const toPollResults = (poll: Poll) => {
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

  return {
    id: poll.id,
    title: poll.title,
    question: poll.question,
    totalVotes,
    options: poll.options.map((option) => ({
      id: option.id,
      text: option.text,
      votes: option.votes,
      percentage: totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100)
    }))
  };
};

router.get("/", (_req, res) => {
  const allPolls = Array.from(polls.values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toPollSummary);

  res.json(allPolls);
});

router.post("/", (req, res) => {
  const body = req.body as CreatePollBody;

  if (!body.title || !body.question || !Array.isArray(body.options)) {
    return res.status(400).json({ message: "Невірний формат тіла запиту" });
  }

  const title = normalizeText(body.title);
  const question = normalizeText(body.question);
  const cleanedOptions = body.options.map(normalizeText).filter(Boolean);

  if (!title || !question) {
    return res.status(400).json({ message: "Заголовок та запитання є обов'язковими" });
  }

  if (cleanedOptions.length < 2) {
    return res.status(400).json({ message: "Потрібно щонайменше 2 варіанти відповіді" });
  }

  const uniqueOptions = Array.from(new Set(cleanedOptions));

  if (uniqueOptions.length !== cleanedOptions.length) {
    return res.status(400).json({ message: "Варіанти відповідей мають бути унікальними" });
  }

  const pollId = randomUUID();
  const createdAt = new Date().toISOString();

  const poll: Poll = {
    id: pollId,
    title,
    question,
    createdAt,
    options: uniqueOptions.map((text) => ({
      id: randomUUID(),
      text,
      votes: 0
    }))
  };

  polls.set(pollId, poll);

  return res.status(201).json(toPollDetails(poll));
});

router.get("/:pollId", (req, res) => {
  const poll = polls.get(req.params.pollId);

  if (!poll) {
    return res.status(404).json({ message: "Опитування не знайдено" });
  }

  return res.json(toPollDetails(poll));
});

router.post("/:pollId/vote", (req, res) => {
  const poll = polls.get(req.params.pollId);

  if (!poll) {
    return res.status(404).json({ message: "Опитування не знайдено" });
  }

  const body = req.body as VoteBody;
  const optionId = body.optionId?.trim();

  if (!optionId) {
    return res.status(400).json({ message: "Потрібно передати optionId" });
  }

  const option = poll.options.find((item) => item.id === optionId);

  if (!option) {
    return res.status(404).json({ message: "Варіант відповіді не знайдено" });
  }

  option.votes += 1;

  return res.json({ message: "Голос зараховано", results: toPollResults(poll) });
});

router.get("/:pollId/results", (req, res) => {
  const poll = polls.get(req.params.pollId);

  if (!poll) {
    return res.status(404).json({ message: "Опитування не знайдено" });
  }

  return res.json(toPollResults(poll));
});

export default router;
