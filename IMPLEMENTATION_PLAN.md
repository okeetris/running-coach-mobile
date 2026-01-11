# Running Coach Mobile App - Implementation Plan

> Portfolio-grade React Native app for running biomechanics analysis
> **Primary Goal:** Mobile version of `/analyze-run` command
> Stack: Expo Dev Build + FastAPI + Skia + TanStack Query + Zustand

---

## Current Progress

**Phase 1: Infrastructure** - COMPLETE
**Phase 2: Data Layer** - IN PROGRESS

### Phase 1 Summary (Complete)
- [x] Monorepo structure created
- [x] docker-compose.yml with FIT files mount
- [x] Backend Dockerfile + requirements.txt
- [x] FastAPI main.py with health check endpoint
- [x] Expo app initialized with TypeScript
- [x] Dependencies installed (Skia, TanStack Query, Zustand, Paper)
- [x] API service files (apiConfig.ts, api.ts, types/index.ts)
- [x] **MILESTONE M1: App connected to backend!**

### Phase 2 Progress
- [x] Added `garminconnect` to backend
- [x] Created Garmin sync service (`services/garmin_sync.py`)
- [x] Created `/activities` and `/activities/sync` endpoints
- [x] Created `useActivities` and `useSyncActivities` hooks
- [x] Built activity list screen with FlashList
- [x] Added sync-on-open and pull-to-refresh
- [ ] **MILESTONE M2:** Test sync with real Garmin data

### To Test Phase 2
```bash
# Terminal 1: Rebuild backend (new dependencies)
cd /Users/tristanokeefe/running-coach-mobile
docker-compose down
docker-compose up --build

# Terminal 2: Reload app (code already hot-reloads)
# Or rebuild if needed:
cd /Users/tristanokeefe/running-coach-mobile/mobile
npx expo run:android
```

### Quick Commands
```bash
# Terminal 1: Start backend
cd /Users/tristanokeefe/running-coach-mobile
docker-compose up --build

# Terminal 2: Start mobile app (Android)
cd /Users/tristanokeefe/running-coach-mobile/mobile
npx expo run:android
```

---

## Scope: Analyze-Run Feature Set

The app replicates the `/analyze-run` slash command - **biomechanics-only analysis**.

### In Scope
- [x] Fetch FIT file + scheduled workout from Garmin
- [x] Workout compliance table (planned vs actual pace per segment)
- [x] Lap breakdown with intensity labels
- [x] Biomechanics summary with A/B/C/D grades
- [x] Time series charts (Cadence, GCT, HR, Vertical Ratio)
- [x] GCT Balance trend with ideal zone
- [x] Fatigue analysis (first half vs second half comparison)
- [x] Cadence-GCT correlation scatter
- [x] SSL trend (if HRM-600 data available)
- [x] Coaching insights (what went well, areas to address, focus cue)

### Explicitly Out of Scope
- Pace improvement recommendations
- Training zones
- VO2max estimates
- Race predictions
- GPS/route analysis
- Recovery/wellness dashboards (save for v2)

---

## Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Platform** | Android-first | Primary use device; iOS secondary |
| **Design System** | Material Design 3 | Native Android look; react-native-paper |
| Framework | Expo Dev Build | Skia requires native code; dev builds = bare RN capabilities + Expo DX |
| Charts | React Native Skia | 60fps with 1000s of data points; GPU-accelerated |
| UI Components | react-native-paper | Material Design 3 out of the box |
| Server State | TanStack Query | Caching, background sync, declarative loading/error states |
| Client State | Zustand | Lightweight, perfect for UI state (chart selection) |
| Lists | @shopify/flash-list | View recycling for smooth scrolling |
| Backend | FastAPI (Docker) | Reuses existing Python FIT parsing scripts |
| Testing | Jest + RNTL | Professional discipline for portfolio |

---

## Project Structure

```
running-coach-mobile/
├── .github/workflows/ci.yml
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   └── activities.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   └── fit_parser.py
│   │   └── models/
│   │       ├── __init__.py
│   │       └── activity.py
│   ├── tests/
│   │   └── test_activities.py
│   ├── Dockerfile
│   └── requirements.txt
├── mobile/
│   ├── app/                          # Expo Router (file-based)
│   │   ├── _layout.tsx               # Root layout + providers
│   │   ├── (tabs)/                   # Bottom tab navigator group
│   │   │   ├── _layout.tsx           # Tab bar configuration
│   │   │   ├── index.tsx             # Home screen (dashboard + widgets)
│   │   │   ├── activities.tsx        # Activity list
│   │   │   └── analyze.tsx           # Analyze new run screen
│   │   ├── activity/
│   │   │   └── [id]/
│   │   │       ├── _layout.tsx       # Top tab navigator for detail
│   │   │       ├── index.tsx         # Summary tab (grades, at-a-glance)
│   │   │       ├── charts.tsx        # Time series charts tab
│   │   │       ├── laps.tsx          # Lap breakdown + workout compliance
│   │   │       └── coaching.tsx      # AI coaching insights
│   │   └── settings.tsx              # Settings screen (modal)
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/
│   │   │   │   ├── TimeSeriesChart.tsx     # Cadence/GCT/HR/VR over time
│   │   │   │   ├── GCTBalanceChart.tsx     # Balance trend with ideal zone
│   │   │   │   ├── CadenceGCTScatter.tsx   # Correlation scatter plot
│   │   │   │   ├── SSLTrendChart.tsx       # Step Speed Loss (HRM-600)
│   │   │   │   ├── ChartTooltip.tsx        # Interactive scrub tooltip
│   │   │   │   └── MetricBadge.tsx         # Real-time value display
│   │   │   ├── activity/
│   │   │   │   ├── ActivityCard.tsx
│   │   │   │   ├── SummaryCard.tsx        # Key metrics with grades
│   │   │   │   ├── AtAGlance.tsx          # TL;DR of the session
│   │   │   │   ├── GradeIndicator.tsx     # A/B/C/D badge
│   │   │   │   ├── LapBreakdown.tsx       # Lap table with metrics
│   │   │   │   ├── WorkoutCompliance.tsx  # Planned vs actual table
│   │   │   │   ├── FatigueComparison.tsx  # First vs second half bars
│   │   │   │   └── CoachingCard.tsx       # What went well, areas, focus cue
│   │   │   ├── ui/
│   │   │   │   ├── LoadingState.tsx
│   │   │   │   └── ErrorState.tsx
│   │   │   ├── home/
│   │   │   │   ├── WelcomeHeader.tsx
│   │   │   │   ├── LatestAnalysisCard.tsx
│   │   │   │   └── AnalyzeCTA.tsx
│   │   │   └── widgets/
│   │   │       ├── GlucoseConverterWidget.tsx
│   │   │       ├── PaceCalculatorWidget.tsx
│   │   │       └── WidgetContainer.tsx       # Horizontal scroll wrapper
│   │   ├── hooks/
│   │   │   ├── useActivities.ts
│   │   │   ├── useActivityDetail.ts
│   │   │   └── useChartGesture.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── apiConfig.ts
│   │   ├── stores/
│   │   │   └── uiStore.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── utils/
│   │       ├── formatting.ts
│   │       └── grading.ts
│   ├── __tests__/
│   │   ├── hooks/useActivities.test.ts
│   │   └── utils/grading.test.ts
│   ├── app.json
│   ├── tsconfig.json
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## App Navigation Structure

**Bottom Tab Navigator** with 3 tabs:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    [Screen Content]                     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│    [Home]         [Activities]         [Analyze]        │
│      ●                 ○                   ○            │
└─────────────────────────────────────────────────────────┘
```

**Navigation Tree:**
```
App
├── BottomTabNavigator
│   ├── HomeStack
│   │   ├── HomeScreen (dashboard + widgets)
│   │   └── SettingsScreen (via header icon)
│   ├── ActivitiesStack
│   │   ├── ActivityListScreen
│   │   └── ActivityDetailScreen (tabs: Summary, Charts, Laps, Coaching)
│   └── AnalyzeStack
│       └── AnalyzeRunScreen (trigger new analysis)
```

---

## Home Screen Design

```
┌─────────────────────────────────────────┐
│ 9:41 AM                          [⚙️]   │  <-- Settings icon
├─────────────────────────────────────────┤
│                                         │
│  Good morning, Tristan        [Avatar]  │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │     ANALYZE NEW RUN        →   │    │  <-- Primary CTA
│  └─────────────────────────────────┘    │
│                                         │
│  LATEST ANALYSIS                        │
│  ┌─────────────────────────────────┐    │
│  │  Yesterday's Tempo Run          │    │
│  │  ┌─────┬─────┬─────┬─────┐     │    │
│  │  │ CAD │ GCT │ BAL │ V.R │     │    │
│  │  │ 178 │ 241 │50.2%│ 8.1%│     │    │
│  │  │  B  │  B  │  A  │  B  │     │    │
│  │  └─────┴─────┴─────┴─────┘     │    │
│  │  View Details →                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  YOUR TOOLS                             │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐  │
│  │ Glucose  │ │  Pace    │ │  More   │  │  <-- Horizontal scroll
│  │ Convert  │ │  Calc    │ │   ...   │  │
│  └──────────┘ └──────────┘ └─────────┘  │
│           ← swipe for more →            │
│                                         │
├─────────────────────────────────────────┤
│   [Home]      [Activities]   [Analyze]  │
│     ●              ○            ○       │
└─────────────────────────────────────────┘
```

### Widget Ideas (Personal Tools)
- **Glucose Converter** - mmol/L ↔ mg/dL
- **Pace Calculator** - Time/distance ↔ pace
- **Unit Converter** - km ↔ miles, kg ↔ lbs
- **Hydration Tracker** - Simple counter
- **Race Countdown** - Days until next race

### Widget Architecture (MVP - Keep Simple)
```
src/components/widgets/
├── GlucoseConverterWidget.tsx
├── PaceCalculatorWidget.tsx
└── ... (add more as needed)
```

Each widget:
- Self-contained component
- Manages own state with useState
- Fixed size card design
- No complex configuration system for MVP

---

## Visual Design Direction (Android-First)

> **Target Platform:** Android (primary), iOS (secondary)
> **Design System:** Material Design 3 (Material You)

### Color Palette (Material Design 3)

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| **Primary** | Blue `#1976D2` | Blue `#90CAF9` |
| **Primary Container** | Light Blue `#BBDEFB` | Dark Blue `#1565C0` |
| **Background** | Surface `#FAFAFA` | Surface `#121212` |
| **Card Surface** | White `#FFFFFF` | Elevated `#1E1E1E` |
| **Text Primary** | On-Surface `#1C1B1F` | On-Surface `#E6E1E5` |
| **Text Secondary** | On-Surface-Variant `#49454F` | `#CAC4D0` |
| **Success/Grade A** | Green `#4CAF50` | Green `#81C784` |
| **Grade B** | Blue `#2196F3` | Blue `#64B5F6` |
| **Warning/Grade C** | Orange `#FF9800` | Orange `#FFB74D` |
| **Error/Grade D** | Red `#F44336` | Red `#E57373` |

### Typography (Roboto - Android System Font)

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Display (Screen Title) | 28sp | Regular | 36sp |
| Headline | 24sp | Regular | 32sp |
| Title Large | 22sp | Medium | 28sp |
| Title Medium | 16sp | Medium | 24sp |
| Body Large | 16sp | Regular | 24sp |
| Body Medium | 14sp | Regular | 20sp |
| Label | 12sp | Medium | 16sp |

### Spacing (Material 8dp Grid)
- Component padding: 16dp
- Card margin: 16dp (horizontal), 8dp (vertical)
- Section gap: 24dp
- Card border radius: 12dp (Material 3 default)
- FAB/Button radius: 16dp

### Component Style (Material Design 3)
- **Cards:** Elevated or Filled surface, 12dp radius, elevation shadow
- **Buttons:** Filled (primary), Outlined (secondary), Text (tertiary)
- **Bottom Nav:** Material 3 NavigationBar with indicator pill
- **Top App Bar:** Large or Medium collapsing style
- **Grade Badges:** Rounded chips with tonal surface

### Android-Specific Considerations
- Use `react-native-paper` or `tamagui` for Material components
- Respect system dark mode preference
- Support dynamic color (Material You) on Android 12+
- Edge-to-edge display with proper insets
- Predictive back gesture support

### Dev Build Commands (Android-First)
```bash
# Build for Android
npx expo prebuild --platform android
npx expo run:android

# Or use development build
eas build --profile development --platform android
```

---

## Screen Breakdown

### Activities Tab (`activities.tsx`)

```
┌─────────────────────────────────────────┐
│ Activities                       [🔄]   │  <-- Pull to refresh
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Jan 10 • Tempo Run             │    │
│  │  8.2 km • 38:42 • 4:43/km       │    │
│  │  ┌───┬───┬───┬───┐              │    │
│  │  │ B │ B │ A │ B │  ← grades    │    │
│  │  └───┴───┴───┴───┘              │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Jan 8 • Easy Recovery          │    │
│  │  5.1 km • 28:15 • 5:32/km       │    │
│  │  ┌───┬───┬───┬───┐              │    │
│  │  │ A │ A │ A │ A │              │    │
│  │  └───┴───┴───┴───┘              │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Jan 6 • Long Run               │    │
│  │  ...                            │    │
│  └─────────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│   [Home]      [Activities]   [Analyze]  │
│     ○              ●            ○       │
└─────────────────────────────────────────┘
```

### Analyze Tab (`analyze.tsx`)

```
┌─────────────────────────────────────────┐
│ Analyze Run                             │
├─────────────────────────────────────────┤
│                                         │
│  Select an activity to analyze:         │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │      📥 FETCH LATEST RUN        │    │  <-- Primary action
│  └─────────────────────────────────┘    │
│                                         │
│  ─────────── OR ───────────             │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  📅 Select by Date              │    │
│  │     [Date Picker Input]         │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  🔢 Recent Unanalyzed           │    │
│  │  • Jan 10 - Tempo Run (8.2km)   │    │
│  │  • Jan 9 - Easy Run (5.0km)     │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Processing indicator when analyzing]  │
│                                         │
├─────────────────────────────────────────┤
│   [Home]      [Activities]   [Analyze]  │
│     ○              ○            ●       │
└─────────────────────────────────────────┘
```

### Activity Detail (Mirrors HTML Report)

### Detail Screen Tabs (`activity/[id]/`)

**Tab 1: Summary (`index.tsx`)**
```
┌─────────────────────────────────────┐
│  AT-A-GLANCE                        │
│  "Solid tempo with good form..."    │
├─────────────────────────────────────┤
│  SUMMARY CARD                       │
│  ┌─────┬─────┬─────┬─────┐         │
│  │ CAD │ GCT │ BAL │ V.R │         │
│  │ 178 │ 241 │ 50.2│ 8.1 │         │
│  │  B  │  B  │  A  │  B  │         │
│  └─────┴─────┴─────┴─────┘         │
├─────────────────────────────────────┤
│  FATIGUE COMPARISON                 │
│  [First Half] vs [Second Half]      │
│  Bar chart: CAD, GCT, VR, HR        │
└─────────────────────────────────────┘
```

**Tab 2: Charts (`charts.tsx`)**
```
┌─────────────────────────────────────┐
│  TIME SERIES (Skia, interactive)    │
│  [Cadence] [GCT] [HR] [V.Ratio]     │
│  ─────────────|─────────────        │
│  Scrub to see values at any point   │
├─────────────────────────────────────┤
│  GCT BALANCE TREND                  │
│  Ideal zone: 49-51% shaded          │
├─────────────────────────────────────┤
│  CADENCE-GCT CORRELATION            │
│  Scatter + trendline + r² value     │
├─────────────────────────────────────┤
│  SSL TREND (if HRM-600)             │
│  Efficiency zones shaded            │
└─────────────────────────────────────┘
```

**Tab 3: Laps (`laps.tsx`)**
```
┌─────────────────────────────────────┐
│  WORKOUT COMPLIANCE (if scheduled)  │
│  Segment | Target | Actual | Status │
│  ────────┼────────┼────────┼────────│
│  Warmup  │ 5:30   │ 5:28   │   ✓    │
│  Tempo 1 │ 4:20   │ 4:18   │   ✓    │
│  Recovery│ 5:00   │ 5:12   │   ~    │
├─────────────────────────────────────┤
│  LAP BREAKDOWN                      │
│  Lap | Pace | CAD | GCT | HR | Int  │
│  ────┼──────┼─────┼─────┼────┼───── │
│  1   │ 5:28 │ 172 │ 255 │ 142│ Easy │
│  2   │ 4:18 │ 182 │ 238 │ 168│ Tempo│
└─────────────────────────────────────┘
```

**Tab 4: Coaching (`coaching.tsx`)**
```
┌─────────────────────────────────────┐
│  WHAT WENT WELL                     │
│  • Excellent GCT balance (50.2%)    │
│  • Strong cadence-GCT coupling      │
│  • Consistent form through tempo    │
├─────────────────────────────────────┤
│  AREAS TO ADDRESS                   │
│  • Vertical ratio crept up in       │
│    final km (8.1% → 9.4%)           │
│  • GCT increased under fatigue      │
├─────────────────────────────────────┤
│  FOCUS CUE FOR NEXT RUN             │
│  "Quick feet off the ground -       │
│   imagine hot coals"                │
└─────────────────────────────────────┘
```

---

## Phase 1: Infrastructure

**Goal:** RN app connects to Docker backend

- [x] Create monorepo structure
- [x] `docker-compose.yml` - Container orchestration
- [x] `backend/Dockerfile` - Python 3.11 slim image
- [x] `backend/requirements.txt` - FastAPI, uvicorn, fitparse, pydantic
- [x] `backend/app/main.py` - Health check endpoint (`GET /health`)
- [x] Initialize Expo app with TypeScript template
- [x] Install expo-dev-client for native module support
- [x] `mobile/src/services/apiConfig.ts` - API base URL config
- [x] `mobile/src/services/api.ts` - Basic fetch wrapper
- [ ] **MILESTONE M1:** App displays "ok" from Docker health endpoint

### Commands
```bash
# Backend
docker-compose up --build

# Mobile
npx create-expo-app@latest mobile --template expo-template-blank-typescript
cd mobile
npx expo install expo-dev-client
npx expo prebuild
npx expo run:ios  # or run:android
```

---

## Phase 2: Data Layer

**Goal:** Activity list populated from real FIT files

- [ ] `backend/app/models/activity.py` - Pydantic schemas (ActivitySummary, ActivityDetails)
- [ ] `backend/app/services/fit_parser.py` - Wrap existing parse_fit.py
- [ ] `backend/app/routers/activities.py` - GET /activities, GET /activities/{id}
- [ ] `mobile/src/types/index.ts` - TypeScript interfaces (mirror Pydantic)
- [ ] `mobile/src/hooks/useActivities.ts` - TanStack Query list hook
- [ ] `mobile/src/hooks/useActivityDetail.ts` - TanStack Query detail hook
- [ ] `mobile/src/stores/uiStore.ts` - Zustand store setup
- [ ] **MILESTONE M2:** Activity list shows real FIT file names

### API Endpoints
```
GET /health              -> { "status": "ok" }
GET /activities          -> ActivitySummary[]
GET /activities/{id}     -> ActivityDetails
```

### TypeScript Types
```typescript
interface ActivitySummary {
  id: string;
  startTime: string;
  activityName: string;
  distanceKm: number;
  durationSeconds: number;
}

interface TimeSeriesDataPoint {
  timestamp: number;
  heartRate?: number;
  cadence?: number;
  pace?: number;
  power?: number;
}

interface ActivityDetails extends ActivitySummary {
  summaryMetrics: {
    avgHeartRate?: number;
    avgPace?: number;
    avgCadence?: number;
  };
  timeSeries: TimeSeriesDataPoint[];
}
```

---

## Phase 3: Core UI

**Goal:** List/detail navigation with proper loading states

- [ ] `mobile/app/_layout.tsx` - Root layout with QueryClientProvider
- [ ] `mobile/app/index.tsx` - Activity list screen with FlashList
- [ ] `mobile/src/components/activity/ActivityCard.tsx` - List item component
- [ ] `mobile/app/activity/[id].tsx` - Detail screen shell
- [ ] `mobile/src/components/ui/LoadingState.tsx` - Skeleton/spinner
- [ ] `mobile/src/components/ui/ErrorState.tsx` - Error with retry
- [ ] **MILESTONE M3:** Tap activity -> detail screen with loading state

### Dependencies
```bash
cd mobile
npx expo install expo-router
npm install @shopify/flash-list
npm install @tanstack/react-query zustand
```

---

## Phase 4: Charts (The Wow Factor)

**Goal:** Interactive 60fps Skia charts with touch scrubbing

- [ ] Install Skia and gesture libraries
- [ ] `mobile/src/components/charts/InteractiveRunChart.tsx` - Skia canvas
- [ ] `mobile/src/hooks/useChartGesture.ts` - Pan gesture handling
- [ ] `mobile/src/components/charts/ChartTooltip.tsx` - Real-time value display
- [ ] `mobile/src/components/charts/MetricBadge.tsx` - Current value badges
- [ ] Integrate chart into detail screen
- [ ] **MILESTONE M4:** Skia renders pace time series at 60fps
- [ ] **MILESTONE M5:** Finger scrub updates tooltip values in real-time

### Dependencies
```bash
cd mobile
npx expo install @shopify/react-native-skia
npx expo install react-native-reanimated react-native-gesture-handler
```

### Skia Chart Pattern
```typescript
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

export function InteractiveRunChart({ data }) {
  const touchX = useSharedValue<number | null>(null);

  const gesture = Gesture.Pan()
    .onUpdate((e) => { touchX.value = e.x; })
    .onEnd(() => { touchX.value = null; });

  // Build Skia path from data points
  // Render with GestureDetector wrapper
}
```

---

## Phase 5: Polish & Analysis

**Goal:** Full biomechanics analysis display

- [ ] `mobile/src/utils/grading.ts` - A/B/C/D grade calculation
- [ ] `mobile/src/utils/formatting.ts` - Pace/time formatters
- [ ] `mobile/src/components/activity/GradeIndicator.tsx` - Visual grade badge
- [ ] `mobile/src/components/activity/LapBreakdown.tsx` - Lap table
- [ ] Add local caching with expo-sqlite (optional)
- [ ] **MILESTONE M6:** Grades, laps, formatted metrics all displaying

### Grading Thresholds
| Metric | A | B | C | D |
|--------|---|---|---|---|
| Cadence | >=180 | >=170 | >=160 | <160 |
| GCT | <=220ms | <=250ms | <=280ms | >280ms |
| GCT Balance | +/-1% | +/-2% | +/-4% | >4% |
| Vertical Ratio | <=8% | <=9% | <=10% | >10% |

---

## Phase 6: Testing & CI/CD

**Goal:** Portfolio-ready with CI pipeline

- [ ] `mobile/__tests__/utils/grading.test.ts` - Grade calculation tests
- [ ] `mobile/__tests__/utils/formatting.test.ts` - Formatter tests
- [ ] `mobile/__tests__/hooks/useActivities.test.ts` - Hook tests with mocks
- [ ] `backend/tests/test_activities.py` - API endpoint tests
- [ ] `.github/workflows/ci.yml` - GitHub Actions pipeline
- [ ] `README.md` - Full documentation with GIF demo
- [ ] Architecture diagram (Excalidraw/Mermaid)
- [ ] **MILESTONE M7:** CI passes with >70% coverage on utils/hooks
- [ ] **MILESTONE M8:** README with GIF, architecture diagram complete

### CI/CD Pipeline
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt pytest httpx
      - run: pytest tests/

  mobile:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: mobile
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx eslint src/
      - run: npm test -- --coverage
```

---

## Milestones Summary

| # | Milestone | Definition of Done |
|---|-----------|-------------------|
| M1 | Connected | RN app displays "ok" from Docker health endpoint |
| M2 | Data Flowing | Activity list shows real FIT file names |
| M3 | Navigation | Tap activity -> detail screen with loading state |
| M4 | Charts | Skia renders pace time series at 60fps |
| M5 | Interactive | Finger scrub updates tooltip values in real-time |
| M6 | Polished | Grades, laps, formatted metrics all displaying |
| M7 | Tested | CI passes with >70% coverage on utils/hooks |
| M8 | Documented | README with GIF, architecture diagram complete |

---

## Interview Talking Points

### "Why Expo dev builds?"
> Strategic choice: production-grade capabilities (Coinbase, Discord use it) with superior DX. Skia requires native code, so dev builds were necessary anyway.

### "Walk me through the architecture"
> Clean separation: FastAPI handles compute-heavy FIT parsing, RN app is presentation only. TanStack Query manages server cache, Zustand handles UI state. Unidirectional data flow.

### "Why Skia over Victory/SVG?"
> Performance with large datasets. Thousands of data points at 60fps. Combined with Gesture Handler and Reanimated for fluid interactive scrubbing.

### "Show me testable code"
> Custom hooks are pure functions over TanStack Query. Utility functions have no side effects. Components receive data as props. All easily mockable.

### "What would you do differently?"
> With more time: offline-first sync with WatermelonDB, background activity polling, push notifications for new activities.

---

## Dependencies Reference

### Mobile (package.json)
```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-dev-client": "~5.0.0",
    "expo-router": "~4.0.0",
    "expo-sqlite": "~15.0.0",
    "react": "18.3.1",
    "react-native": "0.76.x",
    "react-native-paper": "^5.12.0",
    "react-native-safe-area-context": "^4.10.0",
    "@shopify/flash-list": "^1.7.0",
    "@tanstack/react-query": "^5.60.0",
    "zustand": "^5.0.0",
    "@shopify/react-native-skia": "^1.5.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-gesture-handler": "~2.20.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/react": "~18.3.0",
    "jest": "^29.7.0",
    "@testing-library/react-native": "^12.8.0",
    "eslint": "^9.0.0"
  }
}
```

**Note:** `react-native-paper` provides Material Design 3 components out of the box.

### Backend (requirements.txt)
```
fastapi==0.115.0
uvicorn[standard]==0.32.0
fitparse==1.2.0
pydantic==2.10.0
pytest==8.3.0
httpx==0.28.0
```

---

## Notes

- FIT files location: `data/fit-files/` (mounted into Docker container)
- Backend runs on port 8000 via OrbStack
- For physical device testing, use Mac's local IP instead of localhost
- Continuation ID for Zen planning: `72701211-f066-41cf-85fb-9bda54210160`
