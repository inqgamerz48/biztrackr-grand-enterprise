import razorpay
import os
from dotenv import load_dotenv

load_dotenv()

class RazorpayService:
    def __init__(self):
        self.key_id = os.getenv("RAZORPAY_KEY_ID")
        self.key_secret = os.getenv("RAZORPAY_KEY_SECRET")
        if self.key_id and self.key_secret:
            self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
        else:
            self.client = None
            print("Razorpay keys not found in environment variables.")

    def create_order(self, amount: float, currency: str = "INR", receipt: str = None, notes: dict = None):
        if not self.client:
            return None
        
        try:
            data = {
                "amount": int(amount * 100),  # Amount in paise
                "currency": currency,
                "receipt": receipt,
                "notes": notes or {}
            }
            order = self.client.order.create(data=data)
            return order
        except Exception as e:
            print(f"Error creating Razorpay order: {e}")
            return None

    def verify_payment_signature(self, params_dict):
        if not self.client:
            return False
            
        try:
            self.client.utility.verify_payment_signature(params_dict)
            return True
        except Exception as e:
            print(f"Razorpay signature verification failed: {e}")
            return False

    def fetch_payment(self, payment_id):
        if not self.client:
            return None
        try:
            return self.client.payment.fetch(payment_id)
        except Exception as e:
            print(f"Error fetching payment: {e}")
            return None
