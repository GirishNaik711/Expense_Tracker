# Project Setup Guide

## Environment Variables

This project requires both Google AI (Gemini) and OpenAI API keys to function. Follow these steps:

### 1. Get API Keys

**Google AI (Gemini) API Key:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

**OpenAI API Key:**
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Sign in with your OpenAI account
3. Click "Create new secret key"
4. Copy the generated API key

### 2. Create Environment File

Create a `.env` file in the root directory with the following content:

```env
# Google AI (Gemini) API Key
GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI API Key (for audio transcription)
OPENAI_API_KEY=your_openai_api_key_here
```

Replace the placeholder values with your actual API keys.

### 3. Start Development

After setting up the environment variables, you can start the project:

```bash
# Install dependencies (if not already done)
npm install

# Start the Next.js development server
npm run dev

# Or start the AI development server
npm run genkit:dev
```

## Available Scripts

- `npm run dev` - Start Next.js development server on port 9002
- `npm run genkit:dev` - Start Genkit AI development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

- `src/app/` - Next.js app router pages
- `src/components/` - React components
- `src/ai/` - AI flows and Genkit configuration
- `src/lib/` - Utility functions
- `src/hooks/` - Custom React hooks

