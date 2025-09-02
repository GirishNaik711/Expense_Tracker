import sqlite3
import logging
import json
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from pathlib import Path
import os

logger = logging.getLogger(__name__)

class DatabaseService:
    def __init__(self, db_path: str = "expenseai.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the database with required tables"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Create categories table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS categories (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL UNIQUE,
                        color TEXT,
                        icon TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Create transactions table with monthly partitioning
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS transactions (
                        id TEXT PRIMARY KEY,
                        amount REAL NOT NULL,
                        category_id TEXT NOT NULL,
                        category_name TEXT NOT NULL,
                        notes TEXT,
                        date TEXT NOT NULL,
                        year_month TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (category_id) REFERENCES categories (id)
                    )
                """)
                
                # Create indexes for better performance
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_transactions_year_month 
                    ON transactions (year_month)
                """)
                
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_transactions_date 
                    ON transactions (date)
                """)
                
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_transactions_category 
                    ON transactions (category_id)
                """)
                
                conn.commit()
                logger.info("Database initialized successfully")
                
        except Exception as e:
            logger.error(f"Failed to initialize database: {str(e)}")
            raise
    
    def _get_connection(self):
        """Get a database connection"""
        return sqlite3.connect(self.db_path)
    
    def _extract_year_month(self, date_str: str) -> str:
        """Extract year-month from date string (YYYY-MM format)"""
        try:
            if isinstance(date_str, str):
                # Parse the date and extract year-month
                parsed_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                return parsed_date.strftime("%Y-%m")
            elif isinstance(date_str, date):
                return date_str.strftime("%Y-%m")
            else:
                # Default to current month
                return datetime.now().strftime("%Y-%m")
        except Exception as e:
            logger.warning(f"Could not parse date {date_str}, using current month: {str(e)}")
            return datetime.now().strftime("%Y-%m")
    
    # Category operations
    async def create_category(self, category_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new category"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    INSERT INTO categories (id, name, color, icon)
                    VALUES (?, ?, ?, ?)
                """, (
                    category_data['id'],
                    category_data['name'],
                    category_data.get('color'),
                    category_data.get('icon')
                ))
                
                conn.commit()
                
                # Return the created category
                return await self.get_category_by_id(category_data['id'])
                
        except sqlite3.IntegrityError as e:
            if "UNIQUE constraint failed" in str(e):
                raise Exception(f"Category '{category_data['name']}' already exists")
            raise Exception(f"Database constraint error: {str(e)}")
        except Exception as e:
            logger.error(f"Failed to create category: {str(e)}")
            raise Exception(f"Failed to create category: {str(e)}")
    
    async def get_all_categories(self) -> List[Dict[str, Any]]:
        """Get all categories"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT id, name, color, icon, created_at
                    FROM categories
                    ORDER BY name
                """)
                
                rows = cursor.fetchall()
                return [
                    {
                        'id': row[0],
                        'name': row[1],
                        'color': row[2],
                        'icon': row[3],
                        'created_at': row[4]
                    }
                    for row in rows
                ]
                
        except Exception as e:
            logger.error(f"Failed to get categories: {str(e)}")
            raise Exception(f"Failed to get categories: {str(e)}")
    
    async def get_category_by_id(self, category_id: str) -> Optional[Dict[str, Any]]:
        """Get category by ID"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT id, name, color, icon, created_at
                    FROM categories
                    WHERE id = ?
                """, (category_id,))
                
                row = cursor.fetchone()
                if row:
                    return {
                        'id': row[0],
                        'name': row[1],
                        'color': row[2],
                        'icon': row[3],
                        'created_at': row[4]
                    }
                return None
                
        except Exception as e:
            logger.error(f"Failed to get category: {str(e)}")
            raise Exception(f"Failed to get category: {str(e)}")
    
    async def update_category(self, category_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update a category"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                # Build dynamic update query
                set_clauses = []
                values = []
                
                for key, value in updates.items():
                    if key in ['name', 'color', 'icon']:
                        set_clauses.append(f"{key} = ?")
                        values.append(value)
                
                if not set_clauses:
                    raise Exception("No valid fields to update")
                
                values.append(category_id)
                
                cursor.execute(f"""
                    UPDATE categories 
                    SET {', '.join(set_clauses)}
                    WHERE id = ?
                """, values)
                
                if cursor.rowcount == 0:
                    raise Exception(f"Category with ID {category_id} not found")
                
                conn.commit()
                
                # Return the updated category
                return await self.get_category_by_id(category_id)
                
        except Exception as e:
            logger.error(f"Failed to update category: {str(e)}")
            raise Exception(f"Failed to update category: {str(e)}")
    
    async def delete_category(self, category_id: str) -> bool:
        """Delete a category (only if no transactions reference it)"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                # Check if category is used in transactions
                cursor.execute("""
                    SELECT COUNT(*) FROM transactions WHERE category_id = ?
                """, (category_id,))
                
                if cursor.fetchone()[0] > 0:
                    raise Exception("Cannot delete category that has associated transactions")
                
                # Delete the category
                cursor.execute("DELETE FROM categories WHERE id = ?", (category_id,))
                
                if cursor.rowcount == 0:
                    raise Exception(f"Category with ID {category_id} not found")
                
                conn.commit()
                return True
                
        except Exception as e:
            logger.error(f"Failed to delete category: {str(e)}")
            raise Exception(f"Failed to delete category: {str(e)}")
    
    # Transaction operations
    async def create_transaction(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new transaction"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                # Extract year-month from date
                year_month = self._extract_year_month(transaction_data['date'])
                
                cursor.execute("""
                    INSERT INTO transactions (
                        id, amount, category_id, category_name, notes, date, year_month
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    transaction_data['id'],
                    transaction_data['amount'],
                    transaction_data['categoryId'],
                    transaction_data['categoryName'],
                    transaction_data.get('notes'),
                    transaction_data['date'],
                    year_month
                ))
                
                conn.commit()
                
                # Return the created transaction
                return await self.get_transaction_by_id(transaction_data['id'])
                
        except Exception as e:
            logger.error(f"Failed to create transaction: {str(e)}")
            raise Exception(f"Failed to create transaction: {str(e)}")
    
    async def get_transactions_by_month(self, year_month: str) -> List[Dict[str, Any]]:
        """Get all transactions for a specific month (YYYY-MM format)"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT id, amount, category_id, category_name, notes, date, year_month, created_at
                    FROM transactions
                    WHERE year_month = ?
                    ORDER BY date DESC, created_at DESC
                """, (year_month,))
                
                rows = cursor.fetchall()
                return [
                    {
                        'id': row[0],
                        'amount': row[1],
                        'categoryId': row[2],
                        'categoryName': row[3],
                        'notes': row[4],
                        'date': row[5],
                        'year_month': row[6],
                        'created_at': row[7]
                    }
                    for row in rows
                ]
                
        except Exception as e:
            logger.error(f"Failed to get transactions for month {year_month}: {str(e)}")
            raise Exception(f"Failed to get transactions: {str(e)}")
    
    async def get_all_transactions(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get all transactions with optional limit"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                query = """
                    SELECT id, amount, category_id, category_name, notes, date, year_month, created_at
                    FROM transactions
                    ORDER BY date DESC, created_at DESC
                """
                
                if limit:
                    query += f" LIMIT {limit}"
                
                cursor.execute(query)
                
                rows = cursor.fetchall()
                return [
                    {
                        'id': row[0],
                        'amount': row[1],
                        'categoryId': row[2],
                        'categoryName': row[3],
                        'notes': row[4],
                        'date': row[5],
                        'year_month': row[6],
                        'created_at': row[7]
                    }
                    for row in rows
                ]
                
        except Exception as e:
            logger.error(f"Failed to get all transactions: {str(e)}")
            raise Exception(f"Failed to get transactions: {str(e)}")
    
    async def get_transaction_by_id(self, transaction_id: str) -> Optional[Dict[str, Any]]:
        """Get transaction by ID"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT id, amount, category_id, category_name, notes, date, year_month, created_at
                    FROM transactions
                    WHERE id = ?
                """, (transaction_id,))
                
                row = cursor.fetchone()
                if row:
                    return {
                        'id': row[0],
                        'amount': row[1],
                        'categoryId': row[2],
                        'categoryName': row[3],
                        'notes': row[4],
                        'date': row[5],
                        'year_month': row[6],
                        'created_at': row[7]
                    }
                return None
                
        except Exception as e:
            logger.error(f"Failed to get transaction: {str(e)}")
            raise Exception(f"Failed to get transaction: {str(e)}")
    
    async def update_transaction(self, transaction_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update a transaction"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                # Build dynamic update query
                set_clauses = []
                values = []
                
                for key, value in updates.items():
                    if key in ['amount', 'category_id', 'category_name', 'notes', 'date']:
                        set_clauses.append(f"{key} = ?")
                        values.append(value)
                
                if not set_clauses:
                    raise Exception("No valid fields to update")
                
                # Add updated_at timestamp
                set_clauses.append("updated_at = CURRENT_TIMESTAMP")
                
                # If date is being updated, recalculate year_month
                if 'date' in updates:
                    year_month = self._extract_year_month(updates['date'])
                    set_clauses.append("year_month = ?")
                    values.append(year_month)
                
                values.append(transaction_id)
                
                cursor.execute(f"""
                    UPDATE transactions 
                    SET {', '.join(set_clauses)}
                    WHERE id = ?
                """, values)
                
                if cursor.rowcount == 0:
                    raise Exception(f"Transaction with ID {transaction_id} not found")
                
                conn.commit()
                
                # Return the updated transaction
                return await self.get_transaction_by_id(transaction_id)
                
        except Exception as e:
            logger.error(f"Failed to update transaction: {str(e)}")
            raise Exception(f"Failed to update transaction: {str(e)}")
    
    async def delete_transaction(self, transaction_id: str) -> bool:
        """Delete a transaction"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
                
                if cursor.rowcount == 0:
                    raise Exception(f"Transaction with ID {transaction_id} not found")
                
                conn.commit()
                return True
                
        except Exception as e:
            logger.error(f"Failed to delete transaction: {str(e)}")
            raise Exception(f"Failed to delete transaction: {str(e)}")
    
    # Analytics and reporting
    async def get_monthly_summary(self, year_month: str) -> Dict[str, Any]:
        """Get spending summary for a specific month"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                # Get total spending
                cursor.execute("""
                    SELECT SUM(amount), COUNT(*) FROM transactions WHERE year_month = ?
                """, (year_month,))
                
                total_row = cursor.fetchone()
                total_amount = total_row[0] or 0
                transaction_count = total_row[1] or 0
                
                # Get spending by category
                cursor.execute("""
                    SELECT category_name, SUM(amount), COUNT(*)
                    FROM transactions 
                    WHERE year_month = ?
                    GROUP BY category_name
                    ORDER BY SUM(amount) DESC
                """, (year_month,))
                
                category_breakdown = [
                    {
                        'category': row[0],
                        'amount': row[1],
                        'count': row[2]
                    }
                    for row in cursor.fetchall()
                ]
                
                # Get largest transaction
                cursor.execute("""
                    SELECT amount, category_name, notes, date
                    FROM transactions 
                    WHERE year_month = ?
                    ORDER BY amount DESC
                    LIMIT 1
                """, (year_month,))
                
                largest_transaction = cursor.fetchone()
                
                return {
                    'year_month': year_month,
                    'total_amount': total_amount,
                    'transaction_count': transaction_count,
                    'category_breakdown': category_breakdown,
                    'largest_transaction': {
                        'amount': largest_transaction[0] if largest_transaction else 0,
                        'category': largest_transaction[1] if largest_transaction else None,
                        'notes': largest_transaction[2] if largest_transaction else None,
                        'date': largest_transaction[3] if largest_transaction else None
                    } if largest_transaction else None
                }
                
        except Exception as e:
            logger.error(f"Failed to get monthly summary for {year_month}: {str(e)}")
            raise Exception(f"Failed to get monthly summary: {str(e)}")
    
    async def get_available_months(self) -> List[str]:
        """Get list of all months that have transaction data"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT DISTINCT year_month 
                    FROM transactions 
                    ORDER BY year_month DESC
                """)
                
                return [row[0] for row in cursor.fetchall()]
                
        except Exception as e:
            logger.error(f"Failed to get available months: {str(e)}")
            raise Exception(f"Failed to get available months: {str(e)}")
    
    # Data export/import for backup
    async def export_data(self) -> Dict[str, Any]:
        """Export all data for backup purposes"""
        try:
            categories = await self.get_all_categories()
            transactions = await self.get_all_transactions()
            
            return {
                'export_date': datetime.now().isoformat(),
                'categories': categories,
                'transactions': transactions
            }
            
        except Exception as e:
            logger.error(f"Failed to export data: {str(e)}")
            raise Exception(f"Failed to export data: {str(e)}")
    
    async def import_data(self, data: Dict[str, Any]) -> Dict[str, int]:
        """Import data from backup"""
        try:
            imported_categories = 0
            imported_transactions = 0
            
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                # Import categories
                if 'categories' in data:
                    for category in data['categories']:
                        try:
                            cursor.execute("""
                                INSERT OR REPLACE INTO categories (id, name, color, icon, created_at)
                                VALUES (?, ?, ?, ?, ?)
                            """, (
                                category['id'],
                                category['name'],
                                category.get('color'),
                                category.get('icon'),
                                category.get('created_at', datetime.now().isoformat())
                            ))
                            imported_categories += 1
                        except Exception as e:
                            logger.warning(f"Failed to import category {category.get('name', 'Unknown')}: {str(e)}")
                
                # Import transactions
                if 'transactions' in data:
                    for transaction in data['transactions']:
                        try:
                            year_month = self._extract_year_month(transaction['date'])
                            cursor.execute("""
                                INSERT OR REPLACE INTO transactions (
                                    id, amount, category_id, category_name, notes, date, year_month, created_at
                                )
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                            """, (
                                transaction['id'],
                                transaction['amount'],
                                transaction['categoryId'],
                                transaction['categoryName'],
                                transaction.get('notes'),
                                transaction['date'],
                                year_month,
                                transaction.get('created_at', datetime.now().isoformat())
                            ))
                            imported_transactions += 1
                        except Exception as e:
                            logger.warning(f"Failed to import transaction {transaction.get('id', 'Unknown')}: {str(e)}")
                
                conn.commit()
                
            return {
                'categories_imported': imported_categories,
                'transactions_imported': imported_transactions
            }
            
        except Exception as e:
            logger.error(f"Failed to import data: {str(e)}")
            raise Exception(f"Failed to import data: {str(e)}")
