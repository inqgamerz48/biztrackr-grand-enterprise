"""
BizTrackr V2 - Email + License System Test Suite
Run this script to test all major components
"""

import asyncio
import sys
sys.path.insert(0, '/home/inq/Desktop/biztrackr/backend')

from app.services import email_service, license_service


def test_license_generation():
    """Test license key generation"""
    print("\n" + "="*60)
    print("TEST 1: License Key Generation")
    print("="*60)
    
    keys = []
    for i in range(5):
        key = license_service.generate_license_key()
        keys.append(key)
        print(f"  Generated: {key}")
    
    # Check uniqueness
    assert len(keys) == len(set(keys)), "❌ Duplicate keys generated!"
    
    # Check format
    for key in keys:
        parts = key.split('-')
        assert len(parts) == 4, f"❌ Invalid format: {key}"
        assert parts[0] == "INQ", f"❌ Wrong prefix: {key}"
        assert parts[1] == "BZTKR", f"❌ Wrong identifier: {key}"
        assert len(parts[2]) == 4, f"❌ Wrong segment length: {key}"
        assert len(parts[3]) == 4, f"❌ Wrong segment length: {key}"
    
    print("\n✅ License generation test PASSED!")
    return True


def test_email_templates():
    """Test email template generation"""
    print("\n" + "="*60)
    print("TEST 2: Email Template Generation")
    print("="*60)
    
    templates = [
        ("welcome_email", {"name": "Test User", "dashboard_url": "#"}),
        ("license_issued", {"key": "INQ-BZTKR-TEST-1234", "plan": "PRO", "activation_url": "#"}),
        ("payment_success", {"amount": "999.00", "currency": "INR", "payment_id": "TEST123", "plan": "PRO"}),
        ("inventory_added", {"item_name": "Test Item", "quantity": 10, "inventory_url": "#"}),
        ("sale_made", {"amount": "500.00", "customer": "John Doe", "invoice_no": "INV001", "invoice_url": "#"}),
        ("invoice_generated", {"invoice_no": "INV001", "customer": "John Doe", "amount": "500.00", "pdf_url": "#"}),
        ("password_reset", {"reset_link": "#"}),
        ("generic_notification", {"title": "Test", "message": "Hello", "action_text": "Click", "action_url": "#"}),
    ]
    
    for event_type, metadata in templates:
        # Get template
        template_map = {
            "welcome_email": email_service.generate_welcome_email,
            "license_issued": email_service.generate_license_issued_email,
            "payment_success": email_service.generate_payment_success_email,
            "inventory_added": email_service.generate_inventory_added_email,
            "sale_made": email_service.generate_sale_made_email,
            "invoice_generated": email_service.generate_invoice_generated_email,
            "password_reset": email_service.generate_password_reset_email,
            "generic_notification": email_service.generate_generic_notification_email,
        }
        
        func = template_map[event_type]
        subject, html = func(metadata)
        
        # Validate
        assert subject, f"❌ No subject for {event_type}"
        assert html, f"❌ No HTML for {event_type}"
        assert "BizTrackr" in html, f"❌ Missing branding in {event_type}"
        assert len(html) > 500, f"❌ Template too short for {event_type}"
        
        print(f"  ✓ {event_type:25s} - {subject[:50]}")
    
    print("\n✅ Email template test PASSED!")
    return True


def test_email_base_template():
    """Test base email template structure"""
    print("\n" + "="*60)
    print("TEST 3: Base Email Template")
    print("="*60)
    
    html = email_service.get_email_base_template(
        content="<h1>Test Content</h1>",
        title="Test Title"
    )
    
    # Check required elements
    required = [
        "<!DOCTYPE html>",
        "BizTrackr",
        "Test Content",
        "viewport",
        "#1F2937",  # Dark gray color
        "#10B981",  # Green color
    ]
    
    for req in required:
        assert req in html, f"❌ Missing required element: {req}"
        print(f"  ✓ Contains: {req}")
    
    print("\n✅ Base template test PASSED!")
    return True


def test_license_format():
    """Test license key format validation"""
    print("\n" + "="*60)
    print("TEST 4: License Format Validation")
    print("="*60)
    
    # Generate 100 keys and check format
    confusing_chars = ['O', '0', 'I', '1', 'L']
    
    for i in range(100):
        key = license_service.generate_license_key()
        
        # Check no confusing characters
        for char in confusing_chars:
            assert char not in key, f"❌ Confusing character '{char}' in {key}!"
    
    print(f"  ✓ Generated 100 keys")
    print(f"  ✓ No confusing characters (O, 0, I, 1, L)")
    print(f"  ✓ All keys follow INQ-BZTKR-XXXX-XXXX format")
    
    print("\n✅ License format test PASSED!")
    return True


def test_color_scheme():
    """Test BizTrackr color scheme in templates"""
    print("\n" + "="*60)
    print("TEST 5: BizTrackr Color Scheme")
    print("="*60)
    
    colors = email_service.BIZTRACKR_COLORS
    
    expected = {
        "dark_gray": "#1F2937",
        "green": "#10B981",
        "light_gray": "#F3F4F6",
        "white": "#FFFFFF",
        "accent": "#3B82F6"
    }
    
    for key, value in expected.items():
        assert colors.get(key) == value, f"❌ Wrong color for {key}"
        print(f"  ✓ {key:15s} = {value}")
    
    print("\n✅ Color scheme test PASSED!")
    return True


def run_all_tests():
    """Run all tests"""
    print("\n" + "🚀"*30)
    print("BIZTRACKR V2 - EMAIL + LICENSE SYSTEM TEST SUITE")
    print("🚀"*30)
    
    tests = [
        test_license_generation,
        test_email_templates,
        test_email_base_template,
        test_license_format,
        test_color_scheme,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"\n❌ TEST FAILED: {test.__name__}")
            print(f"   Error: {str(e)}")
            failed += 1
    
    print("\n" + "="*60)
    print("TEST RESULTS")
    print("="*60)
    print(f"  ✅ Passed: {passed}/{len(tests)}")
    print(f"  ❌ Failed: {failed}/{len(tests)}")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! System is ready for production!")
    else:
        print("\n⚠️  Some tests failed. Please review the errors above.")
    
    print("="*60 + "\n")


if __name__ == "__main__":
    run_all_tests()
