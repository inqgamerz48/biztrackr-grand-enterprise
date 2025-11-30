import stripe
import os
from dotenv import load_dotenv

load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

class StripeService:
    @staticmethod
    def create_customer(email: str, name: str):
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name
            )
            return customer
        except Exception as e:
            print(f"Error creating Stripe customer: {e}")
            return None

    @staticmethod
    def create_checkout_session(customer_id: str, price_id: str, success_url: str, cancel_url: str):
        try:
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=success_url,
                cancel_url=cancel_url,
            )
            return session
        except Exception as e:
            print(f"Error creating checkout session: {e}")
            return None

    @staticmethod
    def create_portal_session(customer_id: str, return_url: str):
        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url,
            )
            return session
        except Exception as e:
            print(f"Error creating portal session: {e}")
            return None

    @staticmethod
    def get_subscription(subscription_id: str):
        try:
            return stripe.Subscription.retrieve(subscription_id)
        except Exception as e:
            print(f"Error retrieving subscription: {e}")
            return None
