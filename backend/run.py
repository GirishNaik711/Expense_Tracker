#!/usr/bin/env python3
"""
Startup script for ExpenseAI Python Backend
"""

import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Get configuration from environment variables
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    
    print(f"Starting ExpenseAI Backend...")
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"Debug: {debug}")
    print(f"OpenAI API Key: {'Set' if os.getenv('OPENAI_API_KEY') else 'Not Set'}")
    print(f"Google API Key: {'Set' if os.getenv('GOOGLE_API_KEY') else 'Not Set'}")
    
    # Start the server
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )
