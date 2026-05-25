import { createServer } from "node:http";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { createSocketServer } from "./realtime/socket-server.js";

async function bootstrap() {
  await connectDatabase();

  const app = createApp();
  const httpServer = createServer(app);

  const io = createSocketServer(httpServer);
  app.set("io", io);

  httpServer.listen(env.PORT, env.HOST, () => {
    console.log(`Worknoon chat backend running on http://${env.HOST}:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
