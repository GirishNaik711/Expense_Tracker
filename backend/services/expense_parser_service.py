import logging
from typing import Dict, Any, Optional
from pydantic import BaseModel

from .ai_service import AIService

logger = logging.getLogger(__name__)

class ExpenseParseResult(BaseModel):
    amount: float
    category_name: str
    date: Optional[str] = None

class ExpenseParserService:
    def __init__(self):
        self.ai_service = AIService()
    
    async def parse_expense_from_text(self, text: str) -> ExpenseParseResult:
        """
        Parse expense information from transcribed text using AI
        
        Args:
            text: The transcribed text from which to extract expense details
            
        Returns:
            ExpenseParseResult with amount, category, and optional date
        """
        try:
            logger.info(f"Parsing expense from text: {text}")
            
            # Create the prompt for expense parsing
            prompt = self._create_expense_parsing_prompt(text)
            
            # Generate response using Gemini (preferred) or OpenAI
            try:
                response = await self.ai_service.generate_with_gemini(prompt)
            except Exception as e:
                logger.warning(f"Gemini failed, trying OpenAI: {str(e)}")
                response = await self.ai_service.generate_with_openai(prompt)
            
            # Parse the JSON response
            parsed_data = self.ai_service.parse_json_response(response)
            
            # Validate and create result
            result = self._validate_and_create_result(parsed_data)
            logger.info(f"Expense parsed successfully: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Error parsing expense from text: {str(e)}")
            raise Exception(f"Failed to parse expense: {str(e)}")
    
    def _create_expense_parsing_prompt(self, text: str) -> str:
        """
        Create the prompt for expense parsing
        """
        system_prompt = """You are an AI assistant designed to extract expense information from text.

Given the following text, extract the expense amount, category name, and date (if available).
Respond in JSON format only.

Output format: { "amount": number, "categoryName": string, "date": string (ISO format YYYY-MM-DD, optional) }"""

        user_prompt = f"Text: {text}"
        
        return f"{system_prompt}\n\n{user_prompt}"
    
    def _validate_and_create_result(self, parsed_data: Dict[str, Any]) -> ExpenseParseResult:
        """
        Validate parsed data and create ExpenseParseResult
        
        Args:
            parsed_data: Dictionary containing parsed expense data
            
        Returns:
            Validated ExpenseParseResult
        """
        # Validate required fields
        if 'amount' not in parsed_data:
            raise Exception("Amount not found in parsed data")
        
        if 'categoryName' not in parsed_data:
            raise Exception("Category name not found in parsed data")
        
        # Validate amount is numeric
        try:
            amount = float(parsed_data['amount'])
            if amount <= 0:
                raise Exception("Amount must be positive")
        except (ValueError, TypeError):
            raise Exception("Invalid amount format")
        
        # Validate category name is string
        category_name = str(parsed_data['categoryName']).strip()
        if not category_name:
            raise Exception("Category name cannot be empty")
        
        # Validate date format if present
        date = None
        if 'date' in parsed_data and parsed_data['date']:
            date = str(parsed_data['date']).strip()
            # Basic date format validation (YYYY-MM-DD)
            if len(date) != 10 or date[4] != '-' or date[7] != '-':
                logger.warning(f"Invalid date format: {date}, ignoring date")
                date = None
        
        return ExpenseParseResult(
            amount=amount,
            category_name=category_name,
            date=date
        )
    
    def _extract_amount_from_text(self, text: str) -> float:
        """
        Fallback method to extract amount using regex patterns
        """
        import re
        
        # Common currency patterns
        patterns = [
            r'₹\s*(\d+(?:,\d{3})*(?:\.\d{2})?)',  # ₹1,234.56
            r'(\d+(?:,\d{3})*(?:\.\d{2})?)\s*rupees?',  # 1234.56 rupees
            r'(\d+(?:,\d{3})*(?:\.\d{2})?)\s*rs',  # 1234.56 rs
            r'(\d+(?:,\d{3})*(?:\.\d{2})?)',  # Just numbers
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(',', '')
                try:
                    return float(amount_str)
                except ValueError:
                    continue
        
        raise Exception("Could not extract amount from text")
    
    def _extract_category_from_text(self, text: str) -> str:
        """
        Fallback method to extract category using keyword matching
        """
        text_lower = text.lower()
        
        # Common expense categories and their keywords
        category_keywords = {
            'groceries': ['grocery', 'food', 'vegetables', 'fruits', 'milk', 'bread'],
            'transportation': ['transport', 'bus', 'train', 'metro', 'taxi', 'uber'],
            'fuel': ['petrol', 'diesel', 'gas', 'fuel'],
            'entertainment': ['movie', 'cinema', 'restaurant', 'dining', 'coffee'],
            'shopping': ['clothes', 'shoes', 'electronics', 'gadget'],
            'utilities': ['electricity', 'water', 'gas', 'internet', 'wifi'],
            'healthcare': ['medicine', 'doctor', 'hospital', 'pharmacy'],
            'education': ['books', 'course', 'tuition', 'college'],
        }
        
        for category, keywords in category_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                return category
        
        # If no category found, return a default
        return 'miscellaneous'
