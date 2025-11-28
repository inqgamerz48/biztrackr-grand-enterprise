# DEVLOG: NEW UPDATES AND FIXES 1

This document summarizes the recent major updates to the BizTrackr application, highlighting the challenges we encountered and the solutions we implemented to overcome them.

## 1. Real Google Authentication
**The Goal:** Replace the "mock" (fake) login button with a real, working "Sign in with Google" feature.

*   **Challenge 1: The "Invalid Token" Error (400 Bad Request)**
    *   **Issue:** After logging in with Google, the system rejected the user. This happened because the frontend was sending one type of key (Access Token), but the backend was expecting a different type (ID Token). It's like trying to open a door with a car key.
    *   **Solution:** We updated the backend verification process to recognize and accept the "Access Token" key, allowing it to correctly ask Google "Who is this user?" and get the correct answer.

*   **Challenge 2: The "Orphan User" Problem**
    *   **Issue:** When a new user signed up with Google, they were successfully created but didn't belong to any "Organization" (Tenant). They would log in and see a completely empty dashboard because they were technically homeless in the system.
    *   **Solution:** We added a smart rule: If a *new* user signs up via Google, the system automatically builds a new "Organization" for them (e.g., "John's Organization") and makes them the Admin. Now, everyone has a home immediately upon signup.

## 2. Team Management
**The Goal:** Allow Admins to see and manage their Managers and Cashiers.

*   **Challenge: "Where is it?"**
    *   **Issue:** The feature to view and manage users actually already existed, but it was hidden behind a sidebar link named "Users". This was generic and didn't clearly tell the Admin "Click here to manage your team".
    *   **Solution:** We simply renamed the sidebar link from **"Users"** to **"Team"**. This small change made the feature immediately obvious and accessible without writing complex new code.

## 3. Free Plan Limits
**The Goal:** Enforce strict limits for users on the Free Plan (Max 1 Manager, Max 1 Cashier).

*   **Challenge: Preventing Over-Hiring**
    *   **Issue:** The system previously only checked the *total* number of users, not the specific *roles*. A Free plan user could technically add 5 Managers if they wanted, which wasn't intended.
    *   **Solution:** We added specific checks before adding a new team member. The system now counts how many Managers and Cashiers you already have. If a Free Plan user tries to add a 2nd Manager, the system politely stops them and suggests upgrading.

## 4. System Stability (The "500 Error")
**The Goal:** Fix a critical crash that was happening on the live site.

*   **Challenge: Missing Database Fields**
    *   **Issue:** We added new features in the code (for Social Login), but the live database didn't get the memo. It was missing the new columns to store that data, causing the system to crash (Error 500) whenever it tried to save a user.
    *   **Solution:** We created a "self-healing" script. Now, when the server starts up, it automatically checks the database. If those columns are missing, it adds them right then and there. This ensures the code and the database are always in sync.
