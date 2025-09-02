#!/usr/bin/env python3
"""
Startup script for ExpenseAI Application
Runs both Python backend and Next.js frontend
"""

import subprocess
import sys
import os
import time
import signal
import threading
from pathlib import Path

def run_command(command, cwd=None, name="Process"):
    """Run a command and handle its output"""
    print(f"Starting {name}...")
    print(f"Command: {command}")
    print(f"Working directory: {cwd or os.getcwd()}")
    print("-" * 50)
    
    try:
        process = subprocess.Popen(
            command,
            shell=True,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        
        # Print output in real-time
        for line in process.stdout:
            print(f"[{name}] {line.rstrip()}")
        
        return process
    except Exception as e:
        print(f"Error starting {name}: {e}")
        return None

def check_backend_health(url="http://localhost:8000/health", max_retries=30):
    """Check if the backend is healthy"""
    import requests
    
    for i in range(max_retries):
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print("✅ Backend is healthy!")
                return True
        except:
            pass
        
        print(f"⏳ Waiting for backend to start... ({i+1}/{max_retries})")
        time.sleep(2)
    
    print("❌ Backend failed to start")
    return False

def main():
    # Get the project root directory
    project_root = Path(__file__).parent
    backend_dir = project_root / "backend"
    frontend_dir = project_root
    
    print("🚀 Starting ExpenseAI Application")
    print(f"Project root: {project_root}")
    print(f"Backend directory: {backend_dir}")
    print(f"Frontend directory: {frontend_dir}")
    print("=" * 60)
    
    # Check if backend directory exists
    if not backend_dir.exists():
        print("❌ Backend directory not found!")
        print("Please ensure the backend/ directory exists with the Python backend files.")
        sys.exit(1)
    
    # Check if .env file exists in backend
    backend_env = backend_dir / ".env"
    if not backend_env.exists():
        print("⚠️  Backend .env file not found!")
        print("Please copy backend/env.example to backend/.env and configure your API keys.")
        print("You can still start the app, but AI features may not work.")
    
    # Start backend
    backend_process = run_command(
        "python run.py",
        cwd=backend_dir,
        name="Python Backend"
    )
    
    if not backend_process:
        print("❌ Failed to start backend")
        sys.exit(1)
    
    # Wait for backend to be healthy
    print("\n🔍 Checking backend health...")
    if not check_backend_health():
        print("❌ Backend health check failed")
        backend_process.terminate()
        sys.exit(1)
    
    # Start frontend
    print("\n🌐 Starting frontend...")
    frontend_process = run_command(
        "npm run dev",
        cwd=frontend_dir,
        name="Next.js Frontend"
    )
    
    if not frontend_process:
        print("❌ Failed to start frontend")
        backend_process.terminate()
        sys.exit(1)
    
    print("\n🎉 Application started successfully!")
    print("📱 Frontend: http://localhost:9002")
    print("🔧 Backend: http://localhost:8000")
    print("📚 Backend API Docs: http://localhost:8000/docs")
    print("\nPress Ctrl+C to stop all services")
    
    # Handle graceful shutdown
    def signal_handler(signum, frame):
        print("\n🛑 Shutting down services...")
        if backend_process:
            backend_process.terminate()
        if frontend_process:
            frontend_process.terminate()
        print("✅ Services stopped")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Wait for processes to complete
    try:
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        signal_handler(signal.SIGINT, None)

if __name__ == "__main__":
    main()
