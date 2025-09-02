# ExpenseAI Database System Guide

## 🗄️ Overview

ExpenseAI now includes a comprehensive SQLite-based database system that provides persistent data storage for all your expense tracking needs. The system automatically organizes data by month and integrates seamlessly with the AI spending analysis features.

## 🏗️ Architecture

### Database Schema

#### Categories Table
- `id`: Unique identifier (UUID)
- `name`: Category name (unique)
- `color`: Hex color code for UI
- `icon`: Emoji or icon identifier
- `created_at`: Timestamp

#### Transactions Table
- `id`: Unique identifier (UUID)
- `amount`: Transaction amount
- `category_id`: Reference to category
- `category_name`: Denormalized category name for performance
- `notes`: Optional transaction notes
- `date`: Transaction date (ISO format)
- `year_month`: Auto-calculated month (YYYY-MM format)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### Key Features

1. **Monthly Data Organization**: All transactions are automatically organized by month (YYYY-MM format)
2. **Automatic Indexing**: Optimized queries for monthly data retrieval
3. **Data Integrity**: Foreign key constraints and validation
4. **Backup & Restore**: Export/import functionality for data migration

## 🚀 Getting Started

### 1. Database Initialization

The database is automatically initialized when the `DatabaseService` is first instantiated:

```python
from services.database_service import DatabaseService

# Database will be created automatically
db = DatabaseService("expenseai.db")
```

### 2. Basic Operations

#### Categories

```python
# Create a category
category = await db.create_category({
    'id': 'food-001',
    'name': 'Food & Dining',
    'color': '#FF6B6B',
    'icon': '🍕'
})

# Get all categories
categories = await db.get_all_categories()

# Update a category
updated = await db.update_category('food-001', {
    'color': '#FF8E8E'
})

# Delete a category (only if no transactions reference it)
success = await db.delete_category('food-001')
```

#### Transactions

```python
# Create a transaction
transaction = await db.create_transaction({
    'id': 'txn-001',
    'amount': 25.50,
    'categoryId': 'food-001',
    'categoryName': 'Food & Dining',
    'notes': 'Lunch at restaurant',
    'date': '2024-01-15T12:00:00Z'
})

# Get transactions for a specific month
transactions = await db.get_transactions_by_month('2024-01')

# Get all transactions with optional limit
all_transactions = await db.get_all_transactions(limit=100)

# Update a transaction
updated = await db.update_transaction('txn-001', {
    'amount': 30.00,
    'notes': 'Updated lunch expense'
})

# Delete a transaction
success = await db.delete_transaction('txn-001')
```

### 3. Analytics & Reporting

```python
# Get monthly spending summary
summary = await db.get_monthly_summary('2024-01')
print(f"Total spending: ₹{summary['total_amount']}")
print(f"Transaction count: {summary['transaction_count']}")
print(f"Categories: {len(summary['category_breakdown'])}")

# Get available months
months = await db.get_available_months()
print(f"Available months: {months}")

# Export all data for backup
exported_data = await db.export_data()

# Import data from backup
import_result = await db.import_data(exported_data)
```

## 🔌 API Endpoints

### Categories
- `POST /api/categories` - Create category
- `GET /api/categories` - Get all categories
- `GET /api/categories/{id}` - Get category by ID
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

### Transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions` - Get transactions (with optional month filter)
- `GET /api/transactions/{id}` - Get transaction by ID
- `PUT /api/transactions/{id}` - Update transaction
- `DELETE /api/transactions/{id}` - Delete transaction

### Analytics
- `POST /api/analyze-spending-db` - AI spending analysis using database data
- `GET /api/monthly-summary/{year_month}` - Monthly spending summary
- `GET /api/available-months` - List of months with data

### Data Management
- `GET /api/export-data` - Export all data
- `POST /api/import-data` - Import data from backup

## 🧪 Testing

Run the database test script to verify functionality:

```bash
cd backend
python test_database.py
```

This will test all database operations and clean up after itself.

## 🚀 Frontend Integration

The frontend now includes comprehensive database functions in `src/lib/actions-python.ts`:

```typescript
import { 
    createCategory, 
    getCategories, 
    createTransaction, 
    getTransactions,
    analyzeSpendingFromDB,
    getMonthlySummary 
} from '@/lib/actions-python';

// Example usage
const categories = await getCategories();
const transactions = await getTransactions('2024-01');
const analysis = await analyzeSpendingFromDB('What did I spend most on this month?');
```

## 🗄️ Deployment Considerations

### Free Tier Services (Render, Railway, etc.)

- **SQLite**: Perfect for free deployments - no external database required
- **File-based**: Database file is stored in the service's file system
- **Automatic**: No setup or configuration needed

### Production Considerations

For production deployments, consider:
- **Database Backups**: Regular exports using `/api/export-data`
- **Data Migration**: Use import/export for data migration between environments
- **Monitoring**: Check database file size and performance

### Environment Variables

Ensure these are set in your deployment:
- `OPENAI_API_KEY`: For AI features
- `GOOGLE_API_KEY`: For Gemini AI features

## 📊 Data Flow

1. **Voice Input** → Transcription → AI Parsing → Database Storage
2. **Manual Entry** → Direct Database Storage
3. **AI Analysis** → Database Query → AI Processing → Response
4. **Monthly Reports** → Database Aggregation → Summary Data

## 🔒 Data Security

- **Local Storage**: Data is stored locally in SQLite file
- **No External Dependencies**: No external database services required
- **Backup Control**: Full control over data export/import
- **Privacy**: Your data stays on your deployment

## 🚨 Troubleshooting

### Common Issues

1. **Database Locked**: Ensure only one instance is writing to the database
2. **File Permissions**: Check write permissions in deployment environment
3. **Memory Issues**: Large datasets may require optimization for free tier limits

### Performance Tips

1. **Indexes**: Already optimized for monthly queries
2. **Batch Operations**: Use import/export for bulk data operations
3. **Regular Cleanup**: Archive old data if needed

## 🔮 Future Enhancements

- **Data Archiving**: Move old months to separate tables
- **Advanced Analytics**: More sophisticated spending insights
- **Data Visualization**: Enhanced reporting capabilities
- **Multi-user Support**: User isolation and permissions

---

This database system provides a solid foundation for persistent expense tracking while maintaining the simplicity needed for free deployment services. All data is automatically organized by month and fully integrated with the AI analysis features.
