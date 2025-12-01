import sys
import os
import requests
import json

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

def test_flow():
    base_url = "http://localhost:8000/api/v1"
    
    # 1. We need a token. Since we can't easily login without a running server and DB with users,
    # we might need to mock the dependency or run this as a unit test.
    # However, running a full integration test against a running server is better.
    
    # Let's assume the server is NOT running and we want to test the functions directly?
    # Or we can try to run the server in the background.
    
    # Simpler approach: Unit test the service and DB interaction directly.
    
    from app.services.razorpay_service import RazorpayService
    from app.models.transaction import Transaction
    from app.core.database import SessionLocal
    
    print("Testing Razorpay Service...")
    service = RazorpayService()
    
    # Mock keys if not present (so it doesn't fail if user hasn't set them yet)
    if not service.client:
        print("Razorpay keys not found. Mocking client for test.")
        # We can't really test the API call without keys, but we can test the QR generation logic
        # if we mock the order_id.
        
        order_id = "order_mock_123"
        amount = 999
        qr = service.generate_qr_code(order_id, amount)
        print(f"QR Code generated (len={len(qr)})")
        assert qr.startswith("data:image/png;base64,")
        print("QR Generation: PASS")
        return

    # If keys exist, try to create an order
    try:
        order = service.create_order(100, "INR", "receipt_test_1")
        if order:
            print(f"Order Created: {order['id']}")
            
            # Test QR Generation
            qr = service.generate_qr_code(order['id'], 100)
            print(f"QR Code generated (len={len(qr)})")
            assert qr.startswith("data:image/png;base64,")
            
            # Test DB Interaction (Transaction)
            db = SessionLocal()
            try:
                # Create dummy transaction
                tx = Transaction(
                    user_id=1, # Assuming user 1 exists
                    order_id=order['id'],
                    amount=100,
                    status="PENDING",
                    plan="pro"
                )
                db.add(tx)
                db.commit()
                print("Transaction saved to DB: PASS")
                
                # Verify fetch
                saved_tx = db.query(Transaction).filter(Transaction.order_id == order['id']).first()
                assert saved_tx is not None
                assert saved_tx.status == "PENDING"
                print("Transaction fetch: PASS")
                
                # Cleanup
                db.delete(saved_tx)
                db.commit()
            except Exception as e:
                print(f"DB Test Failed: {e}")
            finally:
                db.close()
                
        else:
            print("Failed to create order (check keys?)")
            
    except Exception as e:
        print(f"Test Failed: {e}")

if __name__ == "__main__":
    test_flow()
