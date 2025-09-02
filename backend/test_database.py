#!/usr/bin/env python3
"""
Test script for the database service
Run this to verify the database functionality works correctly
"""

import asyncio
import uuid
from datetime import datetime
from services.database_service import DatabaseService

async def test_database():
    """Test all database operations"""
    print("🧪 Testing Database Service...")
    
    # Initialize database
    db = DatabaseService("test_expenseai.db")
    
    try:
        # Test 1: Create categories
        print("\n📁 Test 1: Creating categories...")
        category1 = await db.create_category({
            'id': str(uuid.uuid4()),
            'name': 'Food & Dining',
            'color': '#FF6B6B',
            'icon': '🍕'
        })
        print(f"✅ Created category: {category1['name']}")
        
        category2 = await db.create_category({
            'id': str(uuid.uuid4()),
            'name': 'Transportation',
            'color': '#4ECDC4',
            'icon': '🚗'
        })
        print(f"✅ Created category: {category2['name']}")
        
        # Test 2: Get all categories
        print("\n📁 Test 2: Fetching all categories...")
        categories = await db.get_all_categories()
        print(f"✅ Retrieved {len(categories)} categories")
        for cat in categories:
            print(f"   - {cat['name']} ({cat['icon']})")
        
        # Test 3: Create transactions
        print("\n💰 Test 3: Creating transactions...")
        today = datetime.now().isoformat()
        
        transaction1 = await db.create_transaction({
            'id': str(uuid.uuid4()),
            'amount': 25.50,
            'categoryId': category1['id'],
            'categoryName': category1['name'],
            'notes': 'Lunch at restaurant',
            'date': today
        })
        print(f"✅ Created transaction: ₹{transaction1['amount']} for {transaction1['categoryName']}")
        
        transaction2 = await db.create_transaction({
            'id': str(uuid.uuid4()),
            'amount': 15.00,
            'categoryId': category2['id'],
            'categoryName': category2['name'],
            'notes': 'Uber ride',
            'date': today
        })
        print(f"✅ Created transaction: ₹{transaction2['amount']} for {transaction2['categoryName']}")
        
        # Test 4: Get transactions by month
        print("\n💰 Test 4: Fetching transactions by month...")
        current_month = datetime.now().strftime("%Y-%m")
        transactions = await db.get_transactions_by_month(current_month)
        print(f"✅ Retrieved {len(transactions)} transactions for {current_month}")
        for txn in transactions:
            print(f"   - ₹{txn['amount']} for {txn['categoryName']} ({txn['notes']})")
        
        # Test 5: Get monthly summary
        print("\n📊 Test 5: Getting monthly summary...")
        summary = await db.get_monthly_summary(current_month)
        print(f"✅ Monthly summary for {current_month}:")
        print(f"   Total amount: ₹{summary['total_amount']}")
        print(f"   Transaction count: {summary['transaction_count']}")
        print(f"   Categories: {len(summary['category_breakdown'])}")
        
        # Test 6: Get available months
        print("\n📅 Test 6: Getting available months...")
        months = await db.get_available_months()
        print(f"✅ Available months: {months}")
        
        # Test 7: Export data
        print("\n💾 Test 7: Exporting data...")
        exported_data = await db.export_data()
        print(f"✅ Exported {len(exported_data['categories'])} categories and {len(exported_data['transactions'])} transactions")
        
        # Test 8: Update transaction
        print("\n✏️ Test 8: Updating transaction...")
        updated_transaction = await db.update_transaction(
            transaction1['id'],
            {'amount': 30.00, 'notes': 'Updated lunch expense'}
        )
        print(f"✅ Updated transaction: ₹{updated_transaction['amount']} ({updated_transaction['notes']})")
        
        # Test 9: Update category
        print("\n✏️ Test 9: Updating category...")
        updated_category = await db.update_category(
            category1['id'],
            {'color': '#FF8E8E', 'icon': '🍽️'}
        )
        print(f"✅ Updated category: {updated_category['name']} with new color {updated_category['color']} and icon {updated_category['icon']}")
        
        print("\n🎉 All database tests passed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        raise
    
    finally:
        # Clean up test database
        import os
        if os.path.exists("test_expenseai.db"):
            os.remove("test_expenseai.db")
            print("\n🧹 Cleaned up test database")

if __name__ == "__main__":
    asyncio.run(test_database())
