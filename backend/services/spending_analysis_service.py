import logging
import json
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from .ai_service import AIService
from .database_service import DatabaseService

logger = logging.getLogger(__name__)

class SpendingAnalysisResult(BaseModel):
    answer: str
    explanation: str
    sql: Optional[str] = None
    preview: Optional[str] = None

class SpendingAnalysisService:
    def __init__(self):
        self.ai_service = AIService()
        self.db_service = DatabaseService()
    
    async def answer_spending_question(
        self,
        question: str,
        year_month: Optional[str],
        transactions: List[Dict[str, Any]],
        categories: List[Dict[str, str]]
    ) -> SpendingAnalysisResult:
        """
        Answer questions about spending patterns using AI analysis
        
        Args:
            question: The user's question about spending
            year_month: Year-month filter (YYYY-MM format)
            transactions: List of transaction data
            categories: List of category data
            
        Returns:
            SpendingAnalysisResult with answer and explanation
        """
        try:
            logger.info(f"Analyzing spending for question: {question}")
            
            # Debug logging
            logger.info(f"Data received - Year-Month: {year_month}")
            logger.info(f"Transaction count: {len(transactions)}")
            logger.info(f"Category count: {len(categories)}")
            logger.info(f"Transactions: {json.dumps(transactions, indent=2)}")
            logger.info(f"Categories: {json.dumps(categories, indent=2)}")
            
            # Create the prompt for spending analysis
            prompt = self._create_spending_analysis_prompt(
                question, year_month, transactions, categories
            )
            
            # Generate response using Gemini (preferred) or OpenAI
            try:
                response = await self.ai_service.generate_with_gemini(prompt)
            except Exception as e:
                logger.warning(f"Gemini failed, trying OpenAI: {str(e)}")
                response = await self.ai_service.generate_with_openai(prompt)
            
            # Parse the response
            result = self._parse_spending_analysis_response(response)
            logger.info(f"Spending analysis completed successfully")
            return result
            
        except Exception as e:
            logger.error(f"Error in spending analysis: {str(e)}")
            raise Exception(f"Spending analysis failed: {str(e)}")
    
    async def answer_spending_question_from_db(
        self,
        question: str,
        year_month: Optional[str] = None
    ) -> SpendingAnalysisResult:
        """
        Answer questions about spending patterns using data from the database
        
        Args:
            question: The user's question about spending
            year_month: Year-month filter (YYYY-MM format), defaults to current month
            
        Returns:
            SpendingAnalysisResult with answer and explanation
        """
        try:
            logger.info(f"Analyzing spending from database for question: {question}")
            
            # If no year_month specified, use current month
            if not year_month:
                from datetime import datetime
                year_month = datetime.now().strftime("%Y-%m")
            
            # Get data from database
            transactions = await self.db_service.get_transactions_by_month(year_month)
            categories = await self.db_service.get_all_categories()
            
            logger.info(f"Retrieved {len(transactions)} transactions and {len(categories)} categories for {year_month}")
            
            # Use the existing analysis method
            return await self.answer_spending_question(question, year_month, transactions, categories)
            
        except Exception as e:
            logger.error(f"Error in database spending analysis: {str(e)}")
            raise Exception(f"Database spending analysis failed: {str(e)}")
    
    def _create_spending_analysis_prompt(
        self,
        question: str,
        year_month: Optional[str],
        transactions: List[Dict[str, Any]],
        categories: List[Dict[str, str]]
    ) -> str:
        """
        Create the prompt for spending analysis
        """
        system_prompt = """You are an AI assistant helping users understand their spending patterns.

CRITICAL: You must ONLY use the provided transaction data to answer questions. Do NOT make up, assume, or hallucinate any data that is not explicitly provided in the transactions array.
CRITICAL: Always use the rupee symbol (₹) when showing amounts.Always format currency in Indian Rupees with the symbol ₹ (e.g., ₹1,234.50).

Instructions:
1. ONLY analyze the transactions provided above
2. If no transactions exist for the month, clearly state "No transactions found for this month"
3. For category analysis, use the categoryName field from transactions (if available) or map categoryId to the categories list
4. Do NOT reference any categories that don't exist in the provided data
5. Provide exact amounts and counts from the actual transaction data
6. Respond in JSON format with the following structure:
   {
     "answer": "Direct answer to the question",
     "explanation": "Step-by-step explanation of how you arrived at the answer",
     "preview": "Brief summary of key figures (optional)"
   }

Remember: Base your answer ONLY on the provided transaction data. If the data shows different information than expected, report what the data actually shows."""

        # Format the data for the prompt
        data_section = f"""
Data provided:
- Year-Month (YYYY-MM): {year_month or 'Not specified'}
- Available Categories: {json.dumps(categories, indent=2)}
- Transactions for this month: {json.dumps(transactions, indent=2)}

Question: {question}
"""

        return f"{system_prompt}\n\n{data_section}"
    
    def _parse_spending_analysis_response(self, response: str) -> SpendingAnalysisResult:
        """
        Parse the AI response into SpendingAnalysisResult
        
        Args:
            response: Raw AI response
            
        Returns:
            Parsed SpendingAnalysisResult
        """
        try:
            # Try to parse as JSON first
            parsed_data = self.ai_service.parse_json_response(response)
            
            # Validate required fields
            if 'answer' not in parsed_data:
                raise Exception("Answer field not found in response")
            
            if 'explanation' not in parsed_data:
                raise Exception("Explanation field not found in response")
            
            return SpendingAnalysisResult(
                answer=str(parsed_data['answer']),
                explanation=str(parsed_data['explanation']),
                sql=parsed_data.get('sql'),
                preview=parsed_data.get('preview')
            )
            
        except Exception as e:
            logger.warning(f"Failed to parse JSON response: {str(e)}")
            logger.warning(f"Raw response: {response}")
            
            # Fallback: treat the entire response as the answer
            return SpendingAnalysisResult(
                answer=response.strip(),
                explanation="Response was not in expected JSON format",
                preview="Raw AI response"
            )
    
    def _analyze_transactions_manually(
        self,
        question: str,
        transactions: List[Dict[str, Any]],
        categories: List[Dict[str, str]]
    ) -> SpendingAnalysisResult:
        """
        Fallback manual analysis of transactions
        """
        if not transactions:
            return SpendingAnalysisResult(
                answer="No transactions found for this month",
                explanation="The provided transaction list is empty",
                preview="No data available"
            )
        
        # Create category mapping
        category_map = {cat['id']: cat['name'] for cat in categories}
        
        # Calculate basic statistics
        total_amount = sum(t.get('amount', 0) for t in transactions)
        transaction_count = len(transactions)
        
        # Group by category
        category_totals = {}
        for transaction in transactions:
            category_id = transaction.get('categoryId')
            category_name = transaction.get('categoryName') or category_map.get(category_id, 'Unknown')
            amount = transaction.get('amount', 0)
            
            if category_name not in category_totals:
                category_totals[category_name] = 0
            category_totals[category_name] += amount
        
        # Find top category
        top_category = max(category_totals.items(), key=lambda x: x[1]) if category_totals else None
        
        # Find largest transaction
        largest_transaction = max(transactions, key=lambda x: x.get('amount', 0)) if transactions else None
        
        # Generate answer based on question type
        question_lower = question.lower()
        
        if 'total' in question_lower and 'spend' in question_lower:
            answer = f"Your total spending this month is ₹{total_amount:,.2f}"
            explanation = f"Calculated by summing all {transaction_count} transactions"
            
        elif 'category' in question_lower and ('most' in question_lower or 'top' in question_lower):
            if top_category:
                answer = f"You spent the most on {top_category[0]} with ₹{top_category[1]:,.2f}"
                explanation = f"Analyzed spending across {len(category_totals)} categories"
            else:
                answer = "No category data available"
                explanation = "Could not determine spending by category"
                
        elif 'largest' in question_lower and 'transaction' in question_lower:
            if largest_transaction:
                category_name = largest_transaction.get('categoryName') or category_map.get(largest_transaction.get('categoryId'), 'Unknown')
                answer = f"Your largest transaction was ₹{largest_transaction.get('amount', 0):,.2f} for {category_name}"
                explanation = f"Found among {transaction_count} total transactions"
            else:
                answer = "No transaction data available"
                explanation = "Could not determine largest transaction"
                
        else:
            answer = f"You have {transaction_count} transactions totaling ₹{total_amount:,.2f}"
            explanation = "General spending summary"
        
        preview = f"Total: ₹{total_amount:,.2f}, Transactions: {transaction_count}, Top Category: {top_category[0] if top_category else 'N/A'}"
        
        return SpendingAnalysisResult(
            answer=answer,
            explanation=explanation,
            preview=preview
        )
