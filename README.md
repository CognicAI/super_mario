# Super Mario Quiz Quest 🎮

An interactive quiz game inspired by Super Mario, built with React, TypeScript, and Vite. Answer questions by jumping into the correct blocks!

## Features

- 🎯 AI-generated questions using Google Gemini API
- 🕹️ Classic Mario-style platformer mechanics
- 🎨 Pixel-art graphics and retro aesthetics
- 🔊 Sound effects for jumps, hits, and answers
- 💪 Lives system with enemy encounters
- 🏰 Victory castle when you complete all questions
- 🎮 Offline mode for testing without API

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Create a `.env.local` file
   - Add your Gemini API key:
     ```
     VITE_API_KEY=your_gemini_api_key_here
     ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000 in your browser

## Deploy to Netlify

### Option 1: Deploy via Netlify CLI

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Deploy:
   ```bash
   netlify deploy --prod
   ```

### Option 2: Deploy via Netlify Dashboard

1. Push your code to GitHub
2. Go to [Netlify](https://app.netlify.com/)
3. Click "Add new site" → "Import an existing project"
4. Connect to your GitHub repository
5. Configure build settings (already set in `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Add environment variable:
   - Key: `VITE_API_KEY`
   - Value: Your Gemini API key
7. Click "Deploy site"

### Option 3: One-Click Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

**Note:** You'll need to add the `VITE_API_KEY` environment variable in Netlify's dashboard after deployment.

## Game Controls

- **Arrow Keys** or **WASD**: Move and jump
- **Space**: Jump
- Jump into the correct answer block to proceed!

## Tech Stack

- React 19
- TypeScript
- Vite
- Google Gemini AI
- Canvas API
- Web Audio API

## License

MIT
