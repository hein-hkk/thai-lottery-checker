import { createApp } from "./app.js";
import { getApiEnv } from "./config/env.js";

const env = getApiEnv();
const app = createApp();

app.listen(env.API_PORT, () => {
  console.log(`API server listening on http://localhost:${env.API_PORT}`);
});

