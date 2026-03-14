import express from "express";
import cors from "cors";
import helloRoutes from "./routes/hello";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("API server is running");
});

app.use("/api/hello", helloRoutes);

export default app;