#!/bin/bash

# ============================================
# BizTrackr V2 - Email + License System Setup
# ============================================

echo "🚀 BizTrackr Email + License System Setup"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: Must run from /backend directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pip install resend pymongo firebase-admin

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
fi

# Prompt for Resend API key
echo ""
echo "🔑 Resend API Configuration"
echo "----------------------------"
echo "Get your API key from: https://resend.com/api-keys"
echo ""
read -p "Enter your RESEND_API_KEY (or press Enter to skip): " resend_key

if [ ! -z "$resend_key" ]; then
    # Add or update RESEND_API_KEY in .env
    if grep -q "RESEND_API_KEY" .env; then
        sed -i "s/RESEND_API_KEY=.*/RESEND_API_KEY=$resend_key/" .env
    else
        echo "RESEND_API_KEY=$resend_key" >> .env
    fi
    echo "✅ RESEND_API_KEY configured"
else
    echo "⚠️  Skipped. You can add it manually to .env later."
fi

# Create database migration
echo ""
echo "🗄️  Database Migration"
echo "----------------------"
read -p "Create migration for licenses table? (y/n): " create_migration

if [ "$create_migration" = "y" ]; then
    echo "Creating migration..."
    alembic revision --autogenerate -m "Add licenses table with payment tracking"
    echo "✅ Migration created"
    
    read -p "Apply migration now? (y/n): " apply_migration
    if [ "$apply_migration" = "y" ]; then
        alembic upgrade head
        echo "✅ Migration applied"
    fi
fi

# Summary
echo ""
echo "✨ Setup Complete!"
echo "=================="
echo ""
echo "📋 Next Steps:"
echo "  1. Verify your domain in Resend: https://resend.com/domains"
echo "  2. Update sender email in app/services/email_service.py if needed"
echo "  3. Configure payment webhooks (Instamojo/PayPal)"
echo "  4. Test email sending with /api/v1/license/trigger-event-email"
echo "  5. Test license generation with webhook endpoints"
echo ""
echo "📚 Full Documentation: docs/EMAIL_LICENSE_SYSTEM.md"
echo ""
echo "🚀 Start server: uvicorn app.main:app --reload"
echo ""
