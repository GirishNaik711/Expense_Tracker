import os
import logging
from typing import Dict, Any, Optional
import google.generativeai as genai
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.openai_client = None
        self.gemini_model = None
        self._initialize_clients()
    
    def _initialize_clients(self):
        """Initialize AI clients based on available API keys"""
        try:
            # Initialize OpenAI client
            openai_api_key = os.getenv("OPENAI_API_KEY")
            if openai_api_key:
                self.openai_client = OpenAI(api_key=openai_api_key)
                logger.info("OpenAI client initialized successfully")
            else:
                logger.warning("OPENAI_API_KEY not found in environment variables")
            
            # Initialize Google AI client
            google_api_key = os.getenv("GOOGLE_API_KEY")
            if google_api_key:
                genai.configure(api_key=google_api_key)
                self.gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')
                logger.info("Google AI client initialized successfully")
            else:
                logger.warning("GOOGLE_API_KEY not found in environment variables")
                
        except Exception as e:
            logger.error(f"Error initializing AI clients: {str(e)}")
    
    async def generate_with_gemini(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate response using Google Gemini"""
        if not self.gemini_model:
            raise Exception("Google AI client not initialized")
        
        try:
            full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
            response = self.gemini_model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            logger.error(f"Error generating with Gemini: {str(e)}")
            raise
    
    async def generate_with_openai(self, prompt: str, system_prompt: Optional[str] = None, model: str = "gpt-4") -> str:
        """Generate response using OpenAI"""
        if not self.openai_client:
            raise Exception("OpenAI client not initialized")
        
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            response = self.openai_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.1
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error generating with OpenAI: {str(e)}")
            raise
    
    def parse_json_response(self, response: str) -> Dict[str, Any]:
        """Parse JSON response from AI model"""
        import json
        import re
        
        try:
            # Try to extract JSON from the response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                return json.loads(json_str)
            else:
                # If no JSON found, try to parse the entire response
                return json.loads(response)
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing JSON response: {str(e)}")
            logger.error(f"Response was: {response}")
            raise Exception(f"Failed to parse AI response as JSON: {str(e)}")
