# Algorithm Trainer - Quick Start Guide

## 🚀 Getting Started

### Step 1: Database is Already Configured

The Convex schema has been updated with all necessary tables. No manual database setup required!

### Step 2: Seed PLL Algorithms

You need to seed the database with PLL algorithms. You can do this in two ways:

#### Option A: Via Convex Dashboard (Recommended)

1. Open your Convex dashboard: https://dashboard.convex.dev
2. Navigate to your project
3. Go to "Functions" tab
4. Find `seedAlgorithms:seedPLLAlgorithms`
5. Click "Run" (no arguments needed)
6. Wait for success message: "Successfully seeded PLL algorithms, count: 21"

#### Option B: Via Code

Add this to any component temporarily:

```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// In your component
const seedPLL = useMutation(api.seedAlgorithms.seedPLLAlgorithms);

// Call it once
useEffect(() => {
  seedPLL();
}, []);
```

### Step 3: Access Algorithm Trainer

1. Navigate to: http://localhost:3000/cube-lab/algorithm-trainer
2. Sign in with your WCA account
3. You should see the PLL algorithm set!

### Step 4: Start Learning

1. Click on "PLL" algorithm set
2. Choose a case (e.g., "T-Perm")
3. Watch the 3D visualization
4. Click "Start Learning This Case"
5. Come back tomorrow for your first review!

## ✅ Verification Checklist

After seeding, verify everything works:

- [ ] Dashboard shows "Algorithm Trainer" in sidebar
- [ ] Main page displays PLL set card
- [ ] PLL set shows "21 Cases"
- [ ] Clicking PLL opens set detail page
- [ ] All 21 cases are listed
- [ ] Clicking a case shows 3D cube
- [ ] Alternative algorithms are visible
- [ ] "Start Learning" button appears

## 🎯 Testing the SRS System

1. **Start Learning:**
   - Pick any case and click "Start Learning This Case"
   - Check dashboard - you should see:
     - Total Learning: 1
     - Due Today: 0 (review is scheduled for tomorrow)

2. **Simulate Next Day:**
   - Manually adjust `nextReviewDate` in Convex dashboard to past date
   - Refresh dashboard
   - You should see "Due Today: 1"

3. **Practice Session:**
   - Click "Start Practice"
   - Complete the flash card review
   - Rate the difficulty
   - Check that next review is scheduled

## 🐛 Troubleshooting

### "No algorithm sets available"

- Run the seed mutation again
- Check Convex dashboard → Data → algorithmSets table
- Verify `isPublished` is true

### "Sign in to track progress"

- Make sure you're signed in with WCA account
- Check that user has `convexId` in localStorage

### 3D Cube not loading

- Check browser console for errors
- Ensure cubing.js is installed: `npm list cubing`
- Verify internet connection (cubing.js loads WASM files)

### Reviews not showing

- Verify you've started learning at least one case
- Check `userAlgorithmProgress` table in Convex
- Ensure `nextReviewDate` is in the past

## 📊 Database Overview

After seeding, you'll have:

- **1 Algorithm Set** (PLL)
- **21 Algorithm Cases** (All PLL cases)
- **~50 Algorithms** (Multiple variations per case)
- **0 User Progress** (Created when users start learning)

## 🎨 Customization Tips

### Add Your Own Algorithm:

1. Go to Convex dashboard
2. Navigate to `algorithms` table
3. Click "Add Row"
4. Fill in:
   - `caseId`: Select existing case
   - `notation`: Your algorithm
   - `moveCount`: Count the moves
   - `popularity`: 0-100
   - `isDefault`: false

### Create Custom Set:

1. Currently requires code modification
2. Add to `convex/seedAlgorithms.ts`
3. Follow PLL structure
4. Run new seed mutation

## 💡 Pro Tips

1. **Learn Gradually:** Start with 2-3 cases, master them, then add more
2. **Daily Practice:** Reviews compound - do them daily for best results
3. **Explore Alternatives:** Try different algorithms to find what works for you
4. **Track Progress:** Use the dashboard to monitor your improvement
5. **Mobile Friendly:** Practice on your phone while cubing!

## 🎉 What's Next?

Once PLL is seeded and working:

- Learn all 21 PLL cases
- Achieve 95%+ accuracy
- Master recognition under 1 second
- Unlock OLL (coming soon!)

---

Need help? Check the main README or ask in the CubeDev community!
