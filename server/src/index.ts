import dotenv from 'dotenv';

import app from './app';

dotenv.config();

const port = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`API listening on :${port}`);
  });
}

export default app;
