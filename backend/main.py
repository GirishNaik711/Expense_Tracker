from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import logging
from dotenv import load_dotenv

from services.ai_service import AIService
from services.transcription_service import TranscriptionService
from services.expense_parser_service import ExpenseParserService
from services.spending_analysis_service import SpendingAnalysisService
from services.database_service import DatabaseService

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="ExpenseAI Backend",
    description="Python backend for ExpenseAI application",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:9002", 
        "http://localhost:3000",
        "https://expenseai-frontend.onrender.com",  # Deployed frontend
        "https://*.onrender.com"  # Allow all Render subdomains
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ai_service = AIService()
transcription_service = TranscriptionService()
expense_parser_service = ExpenseParserService()
spending_analysis_service = SpendingAnalysisService()
db_service = DatabaseService()

# Pydantic models for request/response
class TranscriptionRequest(BaseModel):
    audio_data_uri: str

class TranscriptionResponse(BaseModel):
    text: str

class ExpenseParseRequest(BaseModel):
    text: str

class ExpenseParseResponse(BaseModel):
    amount: float
    category_name: str
    date: Optional[str] = None

class SpendingAnalysisRequest(BaseModel):
    question: str
    year_month: Optional[str] = None
    transactions: List[Dict[str, Any]]
    categories: List[Dict[str, str]]

class SpendingAnalysisResponse(BaseModel):
    answer: str
    explanation: str
    sql: Optional[str] = None
    preview: Optional[str] = None

class VoiceExpenseRequest(BaseModel):
    audio_data_uri: str

class VoiceExpenseResponse(BaseModel):
    transcription: Optional[str] = None
    parsed_expense: Optional[ExpenseParseResponse] = None
    error: Optional[str] = None

# Database models
class CategoryCreateRequest(BaseModel):
    id: str
    name: str
    color: Optional[str] = None
    icon: Optional[str] = None

class CategoryUpdateRequest(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None

class TransactionCreateRequest(BaseModel):
    id: str
    amount: float
    categoryId: str
    categoryName: str
    notes: Optional[str] = None
    date: str

class TransactionUpdateRequest(BaseModel):
    amount: Optional[float] = None
    categoryId: Optional[str] = None
    categoryName: Optional[str] = None
    notes: Optional[str] = None
    date: Optional[str] = None

class SpendingAnalysisDBRequest(BaseModel):
    question: str
    year_month: Optional[str] = None

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "ExpenseAI Backend is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "services": ["ai", "transcription", "expense_parser", "spending_analysis"]}

# Transcription endpoint
@app.post("/api/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(request: TranscriptionRequest):
    try:
        logger.info("Starting audio transcription...")
        result = await transcription_service.transcribe_audio(request.audio_data_uri)
        logger.info(f"Transcription completed: {result.text[:50]}...")
        return result
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

# Expense parsing endpoint
@app.post("/api/parse-expense", response_model=ExpenseParseResponse)
async def parse_expense_from_text(request: ExpenseParseRequest):
    try:
        logger.info(f"Parsing expense from text: {request.text}")
        result = await expense_parser_service.parse_expense_from_text(request.text)
        logger.info(f"Expense parsed: {result}")
        # Convert internal model to response model
        return ExpenseParseResponse(**result.model_dump())
    except Exception as e:
        logger.error(f"Expense parsing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Expense parsing failed: {str(e)}")

# Spending analysis endpoint
@app.post("/api/analyze-spending", response_model=SpendingAnalysisResponse)
async def analyze_spending(request: SpendingAnalysisRequest):
    try:
        logger.info(f"Analyzing spending for question: {request.question}")
        result = await spending_analysis_service.answer_spending_question(
            question=request.question,
            year_month=request.year_month,
            transactions=request.transactions,
            categories=request.categories
        )
        logger.info(f"Spending analysis completed")
        return result
    except Exception as e:
        logger.error(f"Spending analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Spending analysis failed: {str(e)}")

# Voice expense processing endpoint (combines transcription + parsing)
@app.post("/api/process-voice-expense", response_model=VoiceExpenseResponse)
async def process_voice_expense(request: VoiceExpenseRequest):
    try:
        logger.info("Starting voice expense processing...")
        
        # Step 1: Transcribe audio
        transcription_result = await transcription_service.transcribe_audio(request.audio_data_uri)
        logger.info(f"Transcription result: {transcription_result.text}")
        
        if not transcription_result.text:
            raise Exception("Transcription failed - no text returned.")
        
        # Check if transcription is meaningful
        if len(transcription_result.text.strip().split()) < 3:
            raise Exception("Transcription too short. Please speak clearly and include the amount, category, and optionally the date.")
        
        # Step 2: Parse expense from transcribed text
        logger.info(f"Parsing expense from text: {transcription_result.text}")
        parsed_expense = await expense_parser_service.parse_expense_from_text(transcription_result.text)
        logger.info(f"Parsed expense: {parsed_expense}")
        # Convert internal model to response model
        parsed_expense_response = ExpenseParseResponse(**parsed_expense.model_dump())
        
        return VoiceExpenseResponse(
            transcription=transcription_result.text,
            parsed_expense=parsed_expense_response
        )
        
    except Exception as e:
        logger.error(f"Error in process_voice_expense: {str(e)}")
        return VoiceExpenseResponse(
            error=f"Failed to process audio: {str(e)}"
        )

# Database endpoints
@app.post("/api/categories")
async def create_category(request: CategoryCreateRequest):
    try:
        logger.info(f"Creating category: {request.name}")
        result = await db_service.create_category(request.model_dump())
        logger.info(f"Category created successfully: {result}")
        return result
    except Exception as e:
        logger.error(f"Category creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Category creation failed: {str(e)}")

@app.get("/api/categories")
async def get_categories():
    try:
        logger.info("Fetching all categories")
        result = await db_service.get_all_categories()
        logger.info(f"Retrieved {len(result)} categories")
        return result
    except Exception as e:
        logger.error(f"Category fetch error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Category fetch failed: {str(e)}")

@app.get("/api/categories/{category_id}")
async def get_category(category_id: str):
    try:
        logger.info(f"Fetching category: {category_id}")
        result = await db_service.get_category_by_id(category_id)
        if not result:
            raise HTTPException(status_code=404, detail="Category not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Category fetch error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Category fetch failed: {str(e)}")

@app.put("/api/categories/{category_id}")
async def update_category(category_id: str, request: CategoryUpdateRequest):
    try:
        logger.info(f"Updating category: {category_id}")
        # Filter out None values
        updates = {k: v for k, v in request.model_dump().items() if v is not None}
        if not updates:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        result = await db_service.update_category(category_id, updates)
        logger.info(f"Category updated successfully: {result}")
        return result
    except Exception as e:
        logger.error(f"Category update error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Category update failed: {str(e)}")

@app.delete("/api/categories/{category_id}")
async def delete_category(category_id: str):
    try:
        logger.info(f"Deleting category: {category_id}")
        result = await db_service.delete_category(category_id)
        logger.info(f"Category deleted successfully")
        return {"message": "Category deleted successfully"}
    except Exception as e:
        logger.error(f"Category deletion error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Category deletion failed: {str(e)}")

@app.post("/api/transactions")
async def create_transaction(request: TransactionCreateRequest):
    try:
        logger.info(f"Creating transaction: {request.amount} for {request.categoryName}")
        result = await db_service.create_transaction(request.model_dump())
        logger.info(f"Transaction created successfully: {result}")
        return result
    except Exception as e:
        logger.error(f"Transaction creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transaction creation failed: {str(e)}")

@app.get("/api/transactions")
async def get_transactions(year_month: Optional[str] = None, limit: Optional[int] = None):
    try:
        if year_month:
            logger.info(f"Fetching transactions for month: {year_month}")
            result = await db_service.get_transactions_by_month(year_month)
        else:
            logger.info(f"Fetching all transactions with limit: {limit}")
            result = await db_service.get_all_transactions(limit)
        
        logger.info(f"Retrieved {len(result)} transactions")
        return result
    except Exception as e:
        logger.error(f"Transaction fetch error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transaction fetch failed: {str(e)}")

@app.get("/api/transactions/{transaction_id}")
async def get_transaction(transaction_id: str):
    try:
        logger.info(f"Fetching transaction: {transaction_id}")
        result = await db_service.get_transaction_by_id(transaction_id)
        if not result:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transaction fetch error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transaction fetch failed: {str(e)}")

@app.put("/api/transactions/{transaction_id}")
async def update_transaction(transaction_id: str, request: TransactionUpdateRequest):
    try:
        logger.info(f"Updating transaction: {transaction_id}")
        # Filter out None values
        updates = {k: v for k, v in request.model_dump().items() if v is not None}
        if not updates:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        result = await db_service.update_transaction(transaction_id, updates)
        logger.info(f"Transaction updated successfully: {result}")
        return result
    except Exception as e:
        logger.error(f"Transaction update error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transaction update failed: {str(e)}")

@app.delete("/api/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str):
    try:
        logger.info(f"Deleting transaction: {transaction_id}")
        result = await db_service.delete_transaction(transaction_id)
        logger.info(f"Transaction deleted successfully")
        return {"message": "Transaction deleted successfully"}
    except Exception as e:
        logger.error(f"Transaction deletion error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transaction deletion failed: {str(e)}")

@app.post("/api/analyze-spending-db", response_model=SpendingAnalysisResponse)
async def analyze_spending_from_db(request: SpendingAnalysisDBRequest):
    try:
        logger.info(f"Analyzing spending from database for question: {request.question}")
        result = await spending_analysis_service.answer_spending_question_from_db(
            question=request.question,
            year_month=request.year_month
        )
        logger.info(f"Database spending analysis completed")
        return result
    except Exception as e:
        logger.error(f"Database spending analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database spending analysis failed: {str(e)}")

@app.get("/api/monthly-summary/{year_month}")
async def get_monthly_summary(year_month: str):
    try:
        logger.info(f"Fetching monthly summary for: {year_month}")
        result = await db_service.get_monthly_summary(year_month)
        logger.info(f"Monthly summary retrieved successfully")
        return result
    except Exception as e:
        logger.error(f"Monthly summary error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Monthly summary failed: {str(e)}")

@app.get("/api/available-months")
async def get_available_months():
    try:
        logger.info("Fetching available months")
        result = await db_service.get_available_months()
        logger.info(f"Retrieved {len(result)} available months")
        return result
    except Exception as e:
        logger.error(f"Available months error: {str(e)}")
        raise Exception(f"Available months failed: {str(e)}")

@app.get("/api/export-data")
async def export_data():
    try:
        logger.info("Exporting all data")
        result = await db_service.export_data()
        logger.info("Data export completed successfully")
        return result
    except Exception as e:
        logger.error(f"Data export error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Data export failed: {str(e)}")

@app.post("/api/import-data")
async def import_data(data: Dict[str, Any]):
    try:
        logger.info("Importing data")
        result = await db_service.import_data(data)
        logger.info(f"Data import completed: {result}")
        return result
    except Exception as e:
        logger.error(f"Data import error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Data import failed: {str(e)}")

# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception handler: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
