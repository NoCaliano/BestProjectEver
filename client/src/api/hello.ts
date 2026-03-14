export async function getHelloMessage(): Promise<string> {
  const response = await fetch("http://localhost:3001/api/hello");

  if (!response.ok) {
    throw new Error("Не вдалося отримати відповідь від сервера");
  }

  const data: { message: string } = await response.json();
  return data.message;
}