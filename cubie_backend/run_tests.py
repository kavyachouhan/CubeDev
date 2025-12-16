#!/usr/bin/env python3
"""
Cubie AI Tools Test Runner

Quick launcher for different test modes.
"""

import sys
import subprocess
import os


def print_banner():
    print("\n" + "="*70)
    print("        CUBIE AI TOOLS TEST SUITE")
    print("="*70 + "\n")


def print_menu():
    print("Select test mode:")
    print("  1. Quick Test (smoke test, ~30 seconds)")
    print("  2. Full Test (all tools, ~2-3 minutes)")
    print("  3. CubeDev Agent Only")
    print("  4. WCA Agent Only")
    print("  5. Web Search Agent Only")
    print("  6. Exit")
    print()


def check_env():
    """Check if required environment variables are set."""
    required = ["GEMINI_API_KEY", "CONVEX_URL"]
    optional = ["TAVILY_API_KEY", "TEST_USER_ID"]
    
    print("Checking environment variables...")
    all_set = True
    
    for var in required:
        if os.getenv(var):
            print(f"  ✅ {var}")
        else:
            print(f"  ❌ {var} - REQUIRED")
            all_set = False
    
    for var in optional:
        if os.getenv(var):
            print(f"  ✅ {var}")
        else:
            print(f"  ⚠️  {var} - Optional")
    
    print()
    return all_set


def run_command(cmd):
    """Run a command and return exit code."""
    try:
        result = subprocess.run(cmd, shell=True)
        return result.returncode
    except KeyboardInterrupt:
        return 130
    except Exception as e:
        return 1


def main():
    print_banner()
    
    # Check environment
    if not check_env():
        print("❌ Missing required environment variables!")
        print("Please set them in your .env file.\n")
        return 1
    
    while True:
        print_menu()
        choice = input("Enter choice (1-6): ").strip()
        
        if choice == "1":
            print("\n🚀 Running quick smoke test...\n")
            return run_command("uv run test_quick.py")
        
        elif choice == "2":
            print("\n🚀 Running full test suite...\n")
            return run_command("uv run test_all_tools.py")
        
        elif choice == "3":
            print("\n🚀 Testing CubeDev Agent tools...\n")
            print("(Creating filtered test...)")
            # Could create a filtered version
            print("⚠️  Not implemented yet. Run full test instead.")
            input("Press Enter to continue...")
            continue
        
        elif choice == "4":
            print("\n🚀 Testing WCA Agent tools...\n")
            print("(Creating filtered test...)")
            print("⚠️  Not implemented yet. Run full test instead.")
            input("Press Enter to continue...")
            continue
        
        elif choice == "5":
            print("\n🚀 Testing Web Search Agent tools...\n")
            print("(Creating filtered test...)")
            print("⚠️  Not implemented yet. Run full test instead.")
            input("Press Enter to continue...")
            continue
        
        elif choice == "6":
            print("\n👋 Goodbye!\n")
            return 0
        
        else:
            print("\n❌ Invalid choice. Please enter 1-6.\n")


if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!\n")
        sys.exit(0)
