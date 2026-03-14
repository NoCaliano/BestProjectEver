import { useEffect, useState } from "react";
import { getHelloMessage } from "./api/hello";

function App() {
  const [message, setMessage] = useState("Завантаження...");
  const [error, setError] = useState("");

  useEffect(() => {
    getHelloMessage()
      .then((msg) => setMessage(msg))
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>React + TypeScript + Express</h1>

      {error ? (
        <p style={{ color: "red" }}>Помилка: {error}</p>
      ) : (
        <p>Відповідь сервера: {message}</p>
      )}
    </div>
  );
}

export default App;