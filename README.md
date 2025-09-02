# ExpenseAI - AI-Powered Expense Tracker

A modern expense tracking application with AI-powered voice input and intelligent spending analysis.

## 🚀 Quick Start

### Option 1: Python Backend (Recommended)
```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt

# Configure API keys
cp env.example .env
# Edit .env with your OpenAI and Google API keys

# Start both backend and frontend
python ../start-app.py
```



## 📚 Documentation

- [Python Backend Guide](./README-PYTHON-BACKEND.md) - Complete guide for the Python backend
- [Backend Documentation](./backend/README.md) - Python backend details

## 🎯 Features

- **Voice Input**: Record expenses with your voice
- **AI Transcription**: Convert speech to text using OpenAI Whisper
- **Smart Parsing**: Extract expense details using AI
- **Spending Analysis**: Ask AI questions about your spending
- **Category Management**: Organize expenses by categories
- **Dashboard**: Visual spending insights and reports
- **Mobile-Friendly**: Responsive design for all devices

## 🔧 Backend

This project uses a Python backend:

### 🐍 Python Backend
- FastAPI-based REST API
- Better AI integration
- Enhanced error handling
- Comprehensive logging
- Auto-generated API docs

## 🌐 Access

- **Frontend**: http://localhost:9002
- **Python Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (Python backend only)
