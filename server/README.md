# Server (Express API)

Express + TypeScript server (to be wrapped by Netlify serverless) providing auth/sessions/aggregates.

## Scripts

- `npm run dev`
- `npm run build`
- `npm start`
- `npm test`

## Health Check

`GET /api/health` -> `{ status: 'ok', ts }`

## Notes

- Keep per-frame data out of API; only aggregates + session meta stored.
