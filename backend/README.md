# ExpenseAI Python Backend

A FastAPI-based Python backend for the ExpenseAI application, providing AI-powered expense tracking and analysis capabilities.

## Features

- **Audio Transcription**: Convert voice recordings to text using OpenAI Whisper
- **Expense Parsing**: Extract expense details (amount, category, date) from text using AI
- **Spending Analysis**: Answer questions about spending patterns using AI analysis
- **Voice Expense Processing**: Complete pipeline from voice to parsed expense data
- **RESTful API**: Clean, documented API endpoints
- **CORS Support**: Compatible with Next.js frontend
- **Error Handling**: Comprehensive error handling and logging

## Architecture

```
backend/
├── main.py                 # FastAPI application and routes
├── run.py                  # Startup script
├── requirements.txt        # Python dependencies
├── env.example            # Environment variables template
├── services/              # Business logic services
│   ├── __init__.py
│   ├── ai_service.py      # Base AI service (OpenAI + Google AI)
│   ├── transcription_service.py    # Audio transcription
│   ├── expense_parser_service.py   # Expense parsing from text
│   └── spending_analysis_service.py # Spending analysis
└── README.md              # This file
```

## API Endpoints

### Health Check
- `GET /` - Root endpoint
- `GET /health` - Health check

### AI Services
- `POST /api/transcribe` - Transcribe audio to text
- `POST /api/parse-expense` - Parse expense from text
- `POST /api/analyze-spending` - Analyze spending patterns
- `POST /api/process-voice-expense` - Complete voice-to-expense pipeline

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy the example environment file and configure your API keys:

```bash
cp env.example .env
```

Edit `.env` and add your API keys:
```env
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
```

### 3. Run the Backend

```bash
# Using the startup script
python run.py

# Or directly with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- **Interactive API Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

## Integration with Frontend

The backend is designed to work seamlessly with your Next.js frontend. Update your frontend API calls to point to the Python backend:

### Example: Voice Expense Processing

```typescript
// Frontend code
const response = await fetch('http://localhost:8000/api/process-voice-expense', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    audio_data_uri: audioDataUri
  })
});

const result = await response.json();
```

### Example: Spending Analysis

```typescript
// Frontend code
const response = await fetch('http://localhost:8000/api/analyze-spending', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    question: "What's my total spending this month?",
    year_month: "2025-08",
    transactions: monthTxns,
    categories: minimalCategories
  })
});

const result = await response.json();
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for Whisper transcription | Yes |
| `GOOGLE_API_KEY` | Google AI API key for Gemini models | Yes |
| `HOST` | Server host (default: 0.0.0.0) | No |
| `PORT` | Server port (default: 8000) | No |
| `DEBUG` | Enable debug mode (default: false) | No |

## Development

### Running in Development Mode

```bash
# Set debug mode
export DEBUG=true

# Run with auto-reload
python run.py
```

### Testing Endpoints

You can test the endpoints using curl or the interactive API docs:

```bash
# Health check
curl http://localhost:8000/health

# Test transcription (requires audio data)
curl -X POST http://localhost:8000/api/transcribe \
  -H "Content-Type: application/json" \
  -d '{"audio_data_uri": "data:audio/webm;base64,..."}'
```

## Error Handling

The backend includes comprehensive error handling:
- Input validation using Pydantic models
- Graceful handling of AI service failures
- Detailed error messages and logging
- Fallback mechanisms for AI service failures

## Logging

The backend uses Python's logging module with configurable levels:
- INFO: General application flow
- WARNING: Non-critical issues
- ERROR: Errors that need attention
- DEBUG: Detailed debugging information (when DEBUG=true)

## Performance

- Async/await for all I/O operations
- Efficient audio processing with temporary files
- Connection pooling for HTTP requests
- Optimized AI prompt generation

## Security

- CORS configuration for frontend integration
- Environment variable-based configuration
- Input validation and sanitization
- No sensitive data logging

## Troubleshooting

### Common Issues

1. **API Key Errors**: Ensure your API keys are correctly set in `.env`
2. **CORS Errors**: Check that your frontend URL is in the allowed origins
3. **Audio Processing**: Ensure audio data is properly base64 encoded
4. **AI Service Failures**: Check API quotas and service availability

### Debug Mode

Enable debug mode for detailed logging:
```bash
export DEBUG=true
python run.py
```

## Migration from TypeScript Backend

This Python backend is a direct replacement for the TypeScript AI flows. The API endpoints maintain the same interface, so your frontend code should work with minimal changes.

Key differences:
- Uses FastAPI instead of Next.js API routes
- Python services instead of TypeScript flows
- Same AI models (OpenAI Whisper + Google Gemini)
- Identical request/response formats
