import express from "express";
import cors from "cors";
import pollsRoutes from "./routes/polls";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Poll API server is running");
});

app.use("/api/polls", pollsRoutes);

export default app;
