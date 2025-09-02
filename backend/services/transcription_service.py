import base64
import logging
import tempfile
import os
from typing import Dict, Any
import httpx
from pydantic import BaseModel

from .ai_service import AIService

logger = logging.getLogger(__name__)

class TranscriptionResult(BaseModel):
    text: str

class TranscriptionService:
    def __init__(self):
        self.ai_service = AIService()
    
    async def transcribe_audio(self, audio_data_uri: str) -> TranscriptionResult:
        """
        Transcribe audio from a data URI using OpenAI Whisper API
        
        Args:
            audio_data_uri: Base64 encoded audio data URI
            
        Returns:
            TranscriptionResult with transcribed text
        """
        try:
            logger.info("Starting audio transcription...")
            
            # Extract base64 data from URI
            if ',' not in audio_data_uri:
                raise Exception("Invalid audio data URI format")
            
            # Split the data URI to get the base64 part
            header, base64_data = audio_data_uri.split(',', 1)
            
            # Decode base64 data
            audio_data = base64.b64decode(base64_data)
            
            # Create temporary file for the audio
            with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_file:
                temp_file.write(audio_data)
                temp_file_path = temp_file.name
            
            try:
                # Use OpenAI Whisper API
                result = await self._transcribe_with_openai(temp_file_path)
                logger.info(f"Transcription completed: {result.text[:50]}...")
                return result
                
            finally:
                # Clean up temporary file
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                    
        except Exception as e:
            logger.error(f"Transcription error: {str(e)}")
            raise Exception(f"Transcription failed: {str(e)}")
    
    async def _transcribe_with_openai(self, audio_file_path: str) -> TranscriptionResult:
        """
        Transcribe audio using OpenAI Whisper API
        
        Args:
            audio_file_path: Path to the audio file
            
        Returns:
            TranscriptionResult with transcribed text
        """
        if not self.ai_service.openai_client:
            raise Exception("OpenAI client not initialized")
        
        try:
            with open(audio_file_path, 'rb') as audio_file:
                response = self.ai_service.openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="json"
                )
                
                return TranscriptionResult(text=response.text)
                
        except Exception as e:
            logger.error(f"OpenAI transcription error: {str(e)}")
            raise Exception(f"OpenAI transcription failed: {str(e)}")
    
    async def _transcribe_with_http(self, audio_file_path: str) -> TranscriptionResult:
        """
        Alternative method using direct HTTP requests to OpenAI API
        """
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            raise Exception("OPENAI_API_KEY not found")
        
        try:
            with open(audio_file_path, 'rb') as audio_file:
                files = {'file': ('audio.webm', audio_file, 'audio/webm')}
                data = {'model': 'whisper-1'}
                headers = {'Authorization': f'Bearer {openai_api_key}'}
                
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        'https://api.openai.com/v1/audio/transcriptions',
                        files=files,
                        data=data,
                        headers=headers
                    )
                    
                    if response.status_code != 200:
                        error_data = response.json()
                        raise Exception(f"OpenAI API error: {response.status_code} - {error_data}")
                    
                    result = response.json()
                    return TranscriptionResult(text=result['text'])
                    
        except Exception as e:
            logger.error(f"HTTP transcription error: {str(e)}")
            raise Exception(f"HTTP transcription failed: {str(e)}")
