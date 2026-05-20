<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your app

This repository is a React + Vite front-end served by a generic Express server.

## Run locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Create a `.env` file in the project root and add your Gemini API key:
   ```env
   GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
   PORT=3000
   ```
3. Start development mode:
   `npm run dev`

## Build and run in production

1. Build the frontend and bundle the server:
   `npm run build`
2. Start the production server:
   `npm run start`

The app will listen on `http://localhost:3000` by default, or the port set in `PORT`.
