import app from './src/app.js';
import { env } from './src/config/env.js';

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`TRIPLE-E backend running on port ${env.PORT}`);
});
