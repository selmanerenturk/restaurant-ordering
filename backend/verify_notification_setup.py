#!/usr/bin/env python
"""Verify notification system setup."""

import sys
from app.db.session import SessionLocal
from app.models.notification import NotificationPreference, Notification

def main():
    print("\n" + "="*60)
    print("NOTIFICATION SYSTEM VERIFICATION")
    print("="*60 + "\n")
    
    db = SessionLocal()
    
    try:
        # Check 1: Can we access notification_preferences table?
        print("1. Checking notification_preferences table...")
        prefs = db.query(NotificationPreference).first()
        if prefs:
            print("   ✅ Table exists and accessible")
            print(f"   ✅ Admin Email: {prefs.admin_email}")
            print(f"   ✅ Email Enabled: {prefs.enable_email}")
            print(f"   ✅ Notify on New Order: {prefs.notify_on_new_order}")
        else:
            print("   ❌ No preferences found (empty table)")
            return False
        
        # Check 2: Can we access notifications table?
        print("\n2. Checking notifications table...")
        count = db.query(Notification).count()
        print(f"   ✅ Table exists and accessible")
        print(f"   ℹ️  Total notifications: {count}")
        
        # Check 3: Verify all required columns exist
        print("\n3. Verifying notification_preferences columns...")
        required_columns = [
            'id', 'admin_email', 'admin_phone', 'enable_email',
            'enable_sms', 'enable_whatsapp', 'enable_voice',
            'notify_on_new_order', 'notify_on_status_change',
            'enable_quiet_hours', 'quiet_hours_start', 'quiet_hours_end'
        ]
        
        pref_dict = prefs.__dict__
        found_columns = [col for col in required_columns if col in pref_dict]
        missing_columns = [col for col in required_columns if col not in pref_dict]
        
        if not missing_columns:
            print(f"   ✅ All {len(required_columns)} required columns present")
        else:
            print(f"   ❌ Missing columns: {missing_columns}")
            return False
        
        # Check 4: Verify notification channels
        print("\n4. Checking notification channels...")
        print(f"   Email: {prefs.enable_email}")
        print(f"   SMS: {prefs.enable_sms}")
        print(f"   WhatsApp: {prefs.enable_whatsapp}")
        print(f"   Voice: {prefs.enable_voice}")
        print("   ✅ Channel settings readable")
        
        # Check 5: Verify quiet hours
        print("\n5. Checking quiet hours...")
        print(f"   Enabled: {prefs.enable_quiet_hours}")
        print(f"   Start: {prefs.quiet_hours_start}")
        print(f"   End: {prefs.quiet_hours_end}")
        print("   ✅ Quiet hours configured")
        
        print("\n" + "="*60)
        print("✅ ALL CHECKS PASSED")
        print("="*60)
        print("\nYour notification system is ready!")
        print("You can now:")
        print("  1. Create orders without errors")
        print("  2. Configure notification preferences via API")
        print("  3. Receive notifications (once email is configured)")
        print("\nNext: Restart backend server and test order creation")
        print("="*60 + "\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("\nTables may not exist. Run:")
        print("  python create_notification_tables.py")
        return False
        
    finally:
        db.close()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

