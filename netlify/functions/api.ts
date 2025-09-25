import serverless from 'serverless-http';
import dotenv from 'dotenv';

import app from '../../server/src/app';

dotenv.config();

export const handler = serverless(app);
