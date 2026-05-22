# AI Implementation Prompt — Phase 1 MVP

## Project Working Title

**Fiviko**  
Alternative names: **BuyWise**, **AffordIQ**, **SpendSense**, **CanIBuy**

---

## Copy-Paste Prompt for an Advanced AI / Coding Agent

You are an expert full-stack product architect, UI/UX designer, and senior software engineer.  
I want you to design and implement **Phase 1 MVP** of a gamified financial tracking and purchase decision PWA.

The application is called **Fiviko** for now.

The goal is to build a beautiful, playful, mobile-first PWA that helps users:

1. Track their income, assets, liabilities, mandatory expenses, and daily expenses.
2. Create short-term and long-term purchase goals.
3. Decide whether they can buy something now, should wait, reduce the budget, or avoid the purchase.
4. Automatically split available monthly savings across goals.
5. Show how one purchase affects other goals.
6. Make financial planning fun through streaks, badges, levels, and interactive UI.

The app should not feel like a boring finance spreadsheet.  
It should feel like a **gamified financial coach + purchase decision assistant + goal planner**.

---

# 1. Tech Stack Requirements

Use the following stack strictly.

## Frontend

- **React**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Framer Motion** for smooth animations
- **Recharts** or similar lightweight charting library for charts/progress visuals
- **React Router**
- **PWA support**
  - Web app manifest
  - Service worker
  - Installable app behavior
  - Offline-friendly expense entry

## Backend

- **Node.js**
- **Express.js**
- **TypeScript**
- REST API architecture
- JWT/session-based authentication
- Input validation using Zod or similar
- Centralized error handling
- Clean modular folder structure

## Database

- **PostgreSQL**
- **Prisma ORM**
- Prisma migrations
- Seed data for demo badges, categories, and sample user data

## Development Quality

- Use clean code.
- Use modular architecture.
- Use meaningful comments only where useful.
- Keep financial calculations explainable.
- Keep UI components reusable.
- The MVP should be easy to extend in Phase 2.

---

# 2. Product Summary

Build a **gamified PWA for global users** that helps people decide:

> “Can I buy this, should I buy this, and when is the right time?”

The app should combine:

- Financial safety
- Net worth
- Liquid money
- Monthly income
- Mandatory expenses
- EMIs and liabilities
- Current month spending
- Purchase goal price
- Happiness impact
- Productivity impact
- Income impact
- Urgency
- Necessity
- Dream/luxury level
- Time-saving value
- Maintenance burden
- Impact on other goals

The result should be a clear decision:

- **Buy Now**
- **Wait**
- **Reduce Budget**
- **Not Recommended**
- **Hard Warning: Do Not Buy Now**

---

# 3. Target Platform

The app must be a **Progressive Web App**.

## PWA Requirements

- Mobile-first design
- Desktop responsive layout
- Installable on supported browsers/devices
- Fast startup
- App-like navigation
- Offline-friendly expense entry
- Sync pending offline entries when online
- Clear offline state indicator

---

# 4. Target Users

The MVP should work for global users.

Primary user types:

- Students
- Young professionals
- Freelancers
- Salaried employees
- Small business owners
- People planning expensive purchases
- People trying to control impulse spending
- People managing multiple savings goals

---

# 5. Currency Requirements

The app must support multi-currency.

## Phase 1 Currency Scope

- User selects a **base currency** during onboarding.
- User can enter assets, liabilities, income, expenses, and goals in different currencies.
- App stores original currency and amount.
- App also stores/calculates converted base currency amount.
- For MVP, allow manual exchange-rate configuration or use a simple exchange-rate provider abstraction.
- The system should be designed so a real exchange-rate API can be integrated later.
- All dashboards should show base currency totals clearly.

---

# 6. Design Direction

The UI should be inspired by playful, colorful, gamified mobile interfaces.

The design should feel:

- Beautiful
- Friendly
- Playful
- Premium
- Interactive
- Soft
- Gamified
- Easy to use
- Motivating instead of stressful

Avoid the feeling of a traditional finance spreadsheet.

## Visual Style

Use:

- Soft gradient backgrounds
- Rounded cards
- Big friendly typography
- Playful illustrations or simple mascot placeholders
- Progress rings
- Streak indicators
- Badges
- Goal cards
- Floating action button
- Clear icons
- Smooth micro-interactions
- Celebration animations when goals/badges are achieved

## Design System

### Colors

Use a friendly finance-gamification palette.

Suggested palette:

- Primary: `#6C63FF`
- Primary dark: `#4038C9`
- Secondary: `#00C2A8`
- Accent yellow: `#FFD166`
- Accent orange: `#FF8A3D`
- Success: `#22C55E`
- Warning: `#F59E0B`
- Danger: `#EF4444`
- Background: `#F7F8FC`
- Surface: `#FFFFFF`
- Text primary: `#1F2937`
- Text secondary: `#6B7280`
- Muted border: `#E5E7EB`

### Typography

- Use a clean modern sans-serif font.
- Headings should be bold and friendly.
- Body text should be simple and readable.
- Avoid dense finance jargon.

### Components

Create reusable components:

- AppShell
- BottomNavigation
- TopGreetingCard
- FinancialHealthCard
- AddExpenseButton
- GoalCard
- GoalProgressRing
- PurchaseScoreCard
- BadgeCard
- StreakCard
- SliderQuestion
- CurrencyAmountInput
- CategoryPicker
- StatCard
- WarningBanner
- RecommendationBadge
- WhatIfSimulatorCard
- EmptyState
- LoadingSkeleton

---

# 7. Main Navigation

The Phase 1 app should have these main sections:

1. **Dashboard**
2. **Expenses**
3. **Goals**
4. **Badges**
5. **Profile / Settings**

Use a mobile-friendly bottom navigation.

---

# 8. Phase 1 MVP Scope

Implement the following features.

---

## 8.1 User Authentication

### Requirements

- Register user
- Login user
- Logout user
- Secure password hashing
- JWT/session handling
- Protected API routes
- Protected frontend routes

### User Fields

- id
- name
- email
- passwordHash
- baseCurrency
- financialPersonality
- createdAt
- updatedAt

---

## 8.2 Gamified Onboarding

The onboarding should not feel like a long boring form.

### Steps

1. Welcome screen
2. Select base currency
3. Enter monthly income
4. Enter mandatory expenses
5. Enter assets
6. Enter liabilities and EMIs
7. Choose financial personality
8. Create first purchase goal
9. Show first financial health score
10. Unlock onboarding badge

### Financial Personality Options

- Careful Saver
- Balanced Planner
- Dream Builder
- Aggressive Achiever

### UX Requirements

Use:

- Step progress
- Cards
- Sliders
- Icons
- Micro animations
- Friendly helper text
- Completion badge

---

## 8.3 Financial Profile

The user should be able to manually enter and update their financial profile.

### Asset Types

- Bank balance
- Cash
- Gold
- Stocks
- Mutual funds
- Crypto
- Property
- Vehicle
- Business asset
- Other

### Liability Types

- Personal loan
- Education loan
- Credit card debt
- Vehicle loan
- Home loan
- Borrowed money
- Other liability

### Income Types

- Salary
- Freelance
- Business
- Passive income
- Other

### Mandatory Expense Types

- Rent
- Insurance
- Food
- Groceries
- Travel
- Education
- Subscriptions
- Utilities
- Loan/EMI
- Other

### Calculated Values

Calculate and show:

- Total assets
- Total liabilities
- Net worth
- Liquid net worth
- Monthly income
- Monthly mandatory expenses
- Monthly debt payments
- Monthly surplus
- Emergency fund health
- Debt-to-income ratio
- Current month spending
- Safe remaining spend

---

## 8.4 Daily Expense Tracker

This is one of the most important features.

Daily expense entry must be extremely visible and easy.

### UX Requirement

The dashboard must have a big expressive **+ Add Expense** button.

Possible design:

- Floating bottom-center button
- Large glowing quick-action card
- Sticky quick-add button
- Quick modal with amount first

The user should be able to add an expense in less than 10 seconds.

### Expense Fields

- Amount
- Currency
- Category
- Date
- Payment method
- Optional note
- Recurring or one-time
- Need or want
- Optional linked goal impact

### Expense Tracking

Show:

- Current month spending
- Spending by category
- Budget vs actual
- Daily average spending
- Remaining safe spend
- Goal impact caused by spending
- Overspending warnings

### Offline Requirement

Expense entry should work offline.

When offline:

- Save expense locally.
- Mark it as pending sync.
- Sync it to backend when online.

---

## 8.5 Purchase Goal Management

Users can create purchase goals.

Each goal must be exactly one type:

- Short-term goal
- Long-term goal

A goal cannot be both.

### Goal Fields

- Goal name
- Goal type
- Category
- Target amount
- Currency
- Current saved amount
- Optional target date
- Priority
- Expected maintenance cost
- Expected resale value
- Is replacing existing item?
- Notes

### Goal Categories

- House
- Car
- Bike
- Laptop
- Phone
- Education/course
- Business equipment
- Travel
- Health
- Family
- Hobby
- Luxury
- Emergency fund
- Other

---

## 8.6 Goal Value Questions

When creating a purchase goal, ask interactive 1–100 questions.

Use sliders, emojis, labels, and short helper text.

### Required 1–100 Scores

- **Income Impact Score**  
  How much can this purchase increase your income?

- **Productivity Score**  
  How much will this improve your productivity?

- **Happiness Score**  
  How happy will this make you?

- **Necessity Score**  
  How necessary is this in your current life?

- **Urgency Score**  
  How soon do you genuinely need it?

- **Dream/Luxury Score**  
  Is this more of a dream/luxury purchase?

- **Time-Saving Score**  
  How much time will this save?

- **Frequency of Use Score**  
  How often will you use it?

- **Career/Education Growth Score**  
  Will this help your career, education, or skills?

- **Health/Wellbeing Score**  
  Will this improve health, comfort, or wellbeing?

- **Family/Social Impact Score**  
  Will this positively affect family or important relationships?

- **Regret Risk Score**  
  How likely are you to regret this purchase?

- **Maintenance Burden Score**  
  How much future maintenance/running cost will it create?

---

## 8.7 Purchase Decision Engine

This is the core feature.

For each goal, calculate:

- Purchase Readiness Score
- Financial Safety Score
- Personal Value Score
- Future Benefit Score
- Risk Score
- Goal Conflict Score
- Recommended action
- Recommended purchase month/year
- Required monthly saving
- Safe budget range
- Impact on other goals
- Human-readable explanation

### Recommendation Types

1. **Buy Now**
2. **Wait**
3. **Reduce Budget**
4. **Not Recommended**
5. **Hard Warning: Do Not Buy Now**

### Decision Output Example

For a work laptop:

> Score: 86/100  
> Recommendation: Buy Now  
> Reason: This purchase has high productivity and income impact, and it does not break your emergency safety or delay important goals.

For an expensive luxury watch:

> Score: 31/100  
> Recommendation: Hard Warning  
> Reason: This purchase has low necessity, high luxury score, and will delay 3 active goals while reducing your emergency safety.

---

# 9. Scoring Logic

The scoring should be transparent and explainable.

Use an initial weighted model.  
Keep all weights configurable in code so they can be improved later.

## Main Formula

```text
Purchase Readiness Score =
Financial Safety Score
+ Personal Value Score
+ Future Benefit Score
- Risk Penalty
- Goal Conflict Penalty
```

Normalize final score to 0–100.

---

## 9.1 Financial Safety Score

Use:

- Net worth ratio
- Liquid affordability
- Monthly surplus
- Emergency fund health
- Debt-to-income ratio
- Current month spending health

Example:

```text
Financial Safety Score =
Net Worth Strength
+ Liquid Money Strength
+ Monthly Surplus Strength
+ Emergency Fund Strength
- Debt Pressure
- Overspending Penalty
```

---

## 9.2 Personal Value Score

Use:

- Happiness
- Necessity
- Urgency
- Frequency of use
- Health/wellbeing
- Family/social impact

---

## 9.3 Future Benefit Score

Use:

- Income impact
- Productivity impact
- Time saving
- Career/education growth
- Skill growth

---

## 9.4 Risk Penalty

Use:

- Low emergency fund
- High EMI burden
- Low liquidity
- High dream/luxury score
- High maintenance burden
- High regret risk
- Negative monthly surplus
- Current month overspending

---

## 9.5 Goal Conflict Penalty

Calculate how buying this item affects:

- Other goal timelines
- Monthly savings split
- Emergency fund
- Available surplus
- Current budget safety

Example output:

> Buying this phone now will delay your laptop goal by 2 months and reduce your house goal progress by 6%.

---

# 10. Category Ratio Philosophy

The app should use category-based affordability multipliers.

These are internal app rules for the MVP.  
Users should not customize these in Phase 1.

| Category | Suggested Net Worth Multiplier |
|---|---:|
| House | 3x |
| Car | 5x |
| Bike | 4x |
| Laptop for work | 2x |
| Phone | 3x |
| Education/course | 1.5x |
| Business equipment | 1.5x |
| Travel | 4x |
| Hobby item | 5x |
| Luxury item | 8x |
| Pure dream/luxury item | 10x |

Important: These are not universal financial laws.  
Show them as app-defined decision rules, not guaranteed financial advice.

---

# 11. Auto Savings Split

The app should automatically split monthly available savings across goals.

## Monthly Savings Pool

```text
Monthly Savings Pool =
Monthly Income
- Mandatory Expenses
- EMIs
- Minimum Emergency Fund Contribution
- Current Month Overspending Adjustment
```

If the result is negative, do not allocate money to non-essential goals.

## Goal Weight Formula

```text
Goal Weight =
Priority
+ Necessity
+ Urgency
+ Productivity
+ Income Impact
+ Time Saving
+ Happiness
+ Career/Education Growth
- Luxury Penalty
- Maintenance Burden
- Goal Risk
```

## Allocation Rules

- Emergency fund gets priority when emergency safety is low.
- Mandatory obligations are protected first.
- High-income-impact goals get more allocation.
- High-productivity goals get more allocation.
- High-necessity goals get more allocation.
- Pure luxury/dream goals get lower allocation unless financial health is strong.
- If user is overspending, allocations are reduced and warnings are shown.
- Each goal should show recommended monthly saving and estimated completion date.

---

# 12. Goal Priority System

Automatically rank goals based on:

- User priority
- Financial safety
- Necessity
- Income impact
- Productivity impact
- Urgency
- Happiness
- Target date
- Current progress
- Impact on other goals

Example ranking:

1. Work Laptop — high productivity and income impact
2. Emergency Fund — high safety importance
3. Course — career growth
4. Trip — happiness, lower urgency
5. Luxury Watch — dream item, low necessity

---

# 13. Dashboard Requirements

The dashboard should be the main motivational control center.

## Required Dashboard Cards

- Greeting card
- Financial Health Score
- Net Worth Snapshot
- Current Month Spending
- Remaining Safe Spend
- Big **+ Add Expense** button
- Savings Streak
- Expense Logging Streak
- Active Goals
- Buy Now Items
- Wait Items
- Warning Items
- Daily Challenge
- Badge Progress
- Goal Progress Overview

## Dashboard Behavior

- Dashboard should update after adding expenses.
- Dashboard should show goal impact when spending increases.
- Dashboard should highlight urgent warnings.
- Dashboard should celebrate positive actions.

---

# 14. Gamification Requirements

Gamification should be motivational in Phase 1.

No real-world rewards in Phase 1.

## Phase 1 Gamification Features

- Saving streaks
- Expense logging streaks
- Badges
- Levels
- Daily saving challenges
- Monthly quests
- Goal progress animations
- Celebration animations
- Motivational messages

## Example Streaks

- Saved a target amount daily for 7 days
- Logged expenses 5 days in a row
- Stayed under budget for 1 week
- No impulse spending for 3 days

## Example Badges

- First Goal Created
- First Expense Logged
- 7-Day Saver
- Budget Defender
- Smart Buyer
- Debt Fighter
- Emergency Fund Starter
- Goal Achiever
- Productivity Investor
- Dream Planner
- Onboarding Completed

## Levels

Suggested level names:

1. Beginner Saver
2. Careful Planner
3. Budget Defender
4. Smart Buyer
5. Wealth Builder
6. Goal Master

---

# 15. What-If Simulator

Implement a basic Phase 1 simulator.

For each goal, user can tap:

> What if I buy this now?

The app should simulate:

- Remaining liquid money
- Emergency fund impact
- New monthly surplus
- Delay to other goals
- Goal conflict percentage
- Updated purchase recommendation

Example:

> If you buy this car now, your emergency safety will drop below the recommended level and your house goal will be delayed by 9 months.

---

# 16. Reports

Implement basic monthly reports.

## Required Reports

- Monthly spending by category
- Budget vs actual
- Goal progress
- Savings allocation
- Net worth snapshot
- Expense trend
- Warning summary

Reports should be visual and simple.

---

# 17. Hard Warning Rules

Show a hard warning when:

- Monthly surplus is negative
- Emergency fund is below safe minimum
- Debt-to-income ratio is too high
- Purchase delays important goals significantly
- User is already over monthly budget
- Purchase is high-cost and low-necessity
- Purchase has high luxury score and low income/productivity impact
- Purchase reduces liquidity below safe threshold
- User cannot cover mandatory expenses after purchase

---

# 18. Non-Functional Requirements

## Performance

- Dashboard should load within 2 seconds on normal networks.
- Add Expense modal should open instantly.
- Scoring calculation should complete in under 1 second.
- API responses should be optimized.

## Usability

- Mobile-first UI.
- Core actions should require very few taps.
- Add expense should be possible in under 10 seconds.
- Every score should have a simple explanation.
- Avoid complex finance jargon.

## Security

- Hash passwords securely.
- Use HTTPS in production.
- Validate all API inputs.
- Use secure auth tokens.
- Protect all user-specific routes.
- Do not expose private financial data.

## Privacy

- User financial data must not be sold.
- User should be able to delete account and data.
- User should be able to export their data in future.
- Include a clear disclaimer.

## Accessibility

- Keyboard accessible forms.
- Labels for inputs.
- Good color contrast.
- Do not rely only on color for warnings.
- Respect reduced-motion preference.

## Reliability

- Offline expenses should not be lost.
- Pending sync should be clear to the user.
- Sync conflicts should be safely handled.
- Financial calculations should be reproducible.

---

# 19. Database Schema Requirements

Design Prisma models for at least the following entities.

## Required Models

- User
- Asset
- Liability
- Income
- MandatoryExpense
- Expense
- Goal
- GoalScoreInput
- GoalRecommendation
- Badge
- UserBadge
- Streak
- Challenge
- UserChallenge
- CurrencyRate

## Suggested Prisma Model Fields

### User

- id
- name
- email
- passwordHash
- baseCurrency
- financialPersonality
- createdAt
- updatedAt

### Asset

- id
- userId
- type
- name
- amount
- currency
- baseCurrencyAmount
- liquidityType
- createdAt
- updatedAt

### Liability

- id
- userId
- type
- name
- outstandingAmount
- monthlyPayment
- currency
- baseCurrencyOutstandingAmount
- baseCurrencyMonthlyPayment
- interestRate
- createdAt
- updatedAt

### Income

- id
- userId
- type
- amount
- currency
- baseCurrencyAmount
- frequency
- createdAt
- updatedAt

### MandatoryExpense

- id
- userId
- category
- amount
- currency
- baseCurrencyAmount
- frequency
- createdAt
- updatedAt

### Expense

- id
- userId
- amount
- currency
- baseCurrencyAmount
- category
- note
- date
- paymentMethod
- isRecurring
- needOrWant
- syncStatus
- createdAt
- updatedAt

### Goal

- id
- userId
- name
- type
- category
- targetAmount
- currency
- baseCurrencyTargetAmount
- currentSavedAmount
- baseCurrencyCurrentSavedAmount
- targetDate
- priority
- expectedMaintenanceCost
- expectedResaleValue
- isReplacingExistingItem
- status
- createdAt
- updatedAt

### GoalScoreInput

- id
- goalId
- incomeImpact
- productivity
- happiness
- necessity
- urgency
- dreamLuxury
- timeSaving
- frequencyOfUse
- careerGrowth
- healthWellbeing
- familySocialImpact
- regretRisk
- maintenanceBurden
- createdAt
- updatedAt

### GoalRecommendation

- id
- goalId
- purchaseReadinessScore
- financialSafetyScore
- personalValueScore
- futureBenefitScore
- riskScore
- goalConflictScore
- recommendation
- safeBudgetMin
- safeBudgetMax
- recommendedPurchaseDate
- monthlySavingRequired
- explanation
- createdAt
- updatedAt

### Badge

- id
- name
- description
- icon
- unlockCondition
- createdAt

### UserBadge

- id
- userId
- badgeId
- unlockedAt

### Streak

- id
- userId
- type
- currentCount
- longestCount
- lastUpdatedAt

### Challenge

- id
- title
- description
- type
- targetValue
- rewardBadgeId
- createdAt

### UserChallenge

- id
- userId
- challengeId
- progress
- status
- startedAt
- completedAt

### CurrencyRate

- id
- fromCurrency
- toCurrency
- rate
- source
- updatedAt

---

# 20. API Requirements

Create REST APIs.

## Auth APIs

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Financial Profile APIs

- `GET /api/profile/summary`
- `POST /api/assets`
- `GET /api/assets`
- `PUT /api/assets/:id`
- `DELETE /api/assets/:id`
- `POST /api/liabilities`
- `GET /api/liabilities`
- `PUT /api/liabilities/:id`
- `DELETE /api/liabilities/:id`
- `POST /api/incomes`
- `GET /api/incomes`
- `POST /api/mandatory-expenses`
- `GET /api/mandatory-expenses`

## Expense APIs

- `POST /api/expenses`
- `GET /api/expenses`
- `GET /api/expenses/monthly-summary`
- `PUT /api/expenses/:id`
- `DELETE /api/expenses/:id`
- `POST /api/expenses/sync-offline`

## Goal APIs

- `POST /api/goals`
- `GET /api/goals`
- `GET /api/goals/:id`
- `PUT /api/goals/:id`
- `DELETE /api/goals/:id`
- `POST /api/goals/:id/score-inputs`
- `GET /api/goals/:id/recommendation`
- `POST /api/goals/:id/recalculate`
- `POST /api/goals/:id/what-if`

## Gamification APIs

- `GET /api/badges`
- `GET /api/user-badges`
- `GET /api/streaks`
- `GET /api/challenges`
- `POST /api/challenges/:id/progress`

## Currency APIs

- `GET /api/currencies/rates`
- `POST /api/currencies/manual-rate`

---

# 21. Frontend Screens

Implement these screens.

## Public Screens

1. Landing page
2. Register
3. Login

## Protected Screens

1. Onboarding
2. Dashboard
3. Add Expense modal/screen
4. Expenses list
5. Expense analytics
6. Goals list
7. Add Goal flow
8. Goal detail
9. Purchase recommendation
10. What-if simulator
11. Financial profile
12. Badges
13. Monthly report
14. Settings
15. About / Research Basis page

---

# 22. About / Research Basis Page

Create an About page explaining that the app is inspired by research in financial well-being, mental accounting, budgeting, goal progress, saving behavior, and gamification.

Do not claim to provide licensed financial advice.

Include these research references:

1. **CFPB Financial Well-Being Framework**  
   Use this to explain financial safety, goal progress, emergency readiness, and freedom to enjoy life.  
   URL: https://www.consumerfinance.gov/consumer-tools/educator-tools/financial-well-being-resources/explore-findings/

2. **Richard Thaler — Mental Accounting Matters**  
   Use this to justify goal buckets, budget categories, and separate saving targets.  
   URL: https://onlinelibrary.wiley.com/doi/abs/10.1002/%28SICI%291099-0771%28199909%2912%3A3%3C183%3A%3AAID-BDM318%3E3.0.CO%3B2-F

3. **Consumer.gov — Making a Budget**  
   Use this to support monthly budgeting and saving for goals or emergencies.  
   URL: https://consumer.gov/your-money/making-budget

4. **CFPB — Debt-to-Income Ratio**  
   Use this for debt pressure and purchase risk logic.  
   URL: https://www.consumerfinance.gov/ask-cfpb/what-is-a-debt-to-income-ratio-en-1791/

5. **Vanguard — Emergency Fund Guidance**  
   Use this to support emergency fund protection before large purchases.  
   URL: https://investor.vanguard.com/investor-resources-education/emergency-fund

6. **Whillans et al. — Buying Time Promotes Happiness**  
   Use this to support time-saving value and happiness scoring.  
   URL: https://www.pnas.org/doi/10.1073/pnas.1706541114

7. **Hashim et al. — Gamification Can Help Consumers Reach Their Saving Goals**  
   Use this to support saving streaks, badges, and gamified goal progress.  
   URL: https://cepr.org/system/files/2022-08/Hashim%20-%20Gamification_Can_Help_Consumers_Reach_Their_Saving_Goals.pdf

8. **Kivetz, Urminsky, and Zheng — Goal-Gradient Effect / Illusionary Goal Progress**  
   Use this to support progress bars, milestone motivation, and near-completion motivation.  
   URL: https://home.uchicago.edu/ourminsky/Goal-Gradient_Illusionary_Goal_Progress.pdf

9. **Thaler and Benartzi — Save More Tomorrow**  
   Use this to support automatic saving recommendations and future-oriented saving commitments.  
   URL: https://www.anderson.ucla.edu/documents/areas/fac/accounting/smartjpe226.pdf

10. **web.dev — PWA Web App Manifest**  
   Use this to support PWA installability and app-like behavior.  
   URL: https://web.dev/learn/pwa/web-app-manifest

---

# 23. Disclaimer Requirement

Add this disclaimer in the app footer, About page, and settings/legal page:

> Fiviko is a financial planning and decision-support tool. It provides educational insights based on user-entered data and app-defined scoring models. It does not provide licensed financial, investment, tax, or legal advice. Users should verify important financial decisions independently or consult a qualified professional.

---

# 24. Phase 2 Scope — Do Not Build Now

Mention these as future scope only.

- Push notifications
- Overspending alerts
- Goal reminders
- Streak reminders
- Friend leaderboards
- Social saving challenges
- Reward unlocks
- Avatar upgrades
- Shared family/couple planning
- Bank sync
- AI financial coaching
- Voice expense entry
- Receipt scanning
- Advanced investment integrations

---

# 25. Acceptance Criteria

The Phase 1 MVP is complete only when all of the following are true:

1. User can register, login, and logout.
2. User can complete gamified onboarding.
3. User can select a base currency.
4. User can manually add income, assets, liabilities, EMIs, and mandatory expenses.
5. User can add a daily expense in under 10 seconds.
6. Expense entry works offline and syncs later.
7. User can view current month spending.
8. User can view category-wise spending.
9. User can view budget vs actual spending.
10. User can create a short-term or long-term purchase goal.
11. User can answer all 1–100 scoring questions for a goal.
12. App calculates purchase readiness score.
13. App shows Buy Now / Wait / Reduce Budget / Not Recommended / Hard Warning.
14. App explains every recommendation in simple human language.
15. App automatically splits monthly savings across active goals.
16. App shows how one purchase affects other goals.
17. App has gamification through streaks, badges, levels, and challenges.
18. App has a dashboard that feels playful and interactive.
19. App has an About page with research references.
20. App includes a clear financial disclaimer.
21. App is installable as a PWA.
22. App is mobile-first and responsive.
23. Backend uses Express.js.
24. Frontend uses React.
25. Database uses PostgreSQL.
26. ORM uses Prisma.

---

# 26. Expected Output From You

Please produce:

1. Full architecture plan
2. Folder structure
3. Database schema using Prisma
4. API route design
5. Frontend component structure
6. UI design system
7. Scoring engine implementation
8. Auto savings split implementation
9. What-if simulator logic
10. PWA setup
11. Offline expense sync approach
12. Seed data for badges/challenges/categories
13. MVP implementation roadmap
14. Working code where possible

Do not skip business logic.  
Do not make the app look boring.  
Prioritize usability, fun, and clarity.

The end result should be a strong Phase 1 MVP that a real user would enjoy using every day.
