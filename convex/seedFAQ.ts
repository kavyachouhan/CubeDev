import { mutation } from "./_generated/server";

// Helper to create URL-friendly slugs
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

// ===== Category Data =====
const CATEGORIES = [
  {
    name: "Getting Started",
    slug: "getting-started",
    description:
      "New to CubeDev? Learn how to sign in, navigate the platform, and set up your account.",
    icon: "Zap",
    order: 0,
  },
  {
    name: "Timer",
    slug: "timer",
    description:
      "Everything about the speedcubing timer — how to start, stop, and manage your solves.",
    icon: "Timer",
    order: 1,
  },
  {
    name: "Statistics & Analytics",
    slug: "statistics",
    description:
      "Understand your performance data, averages, trends, and session statistics.",
    icon: "BarChart3",
    order: 2,
  },
  {
    name: "Algorithm Trainer",
    slug: "algorithm-trainer",
    description:
      "Learn how to use the algorithm trainer to practice and master OLL, PLL, and more.",
    icon: "GraduationCap",
    order: 3,
  },
  {
    name: "Coach",
    slug: "coach",
    description:
      "Personalized coaching — set goals, track progress, and get AI-powered improvement tips.",
    icon: "Compass",
    order: 4,
  },
  {
    name: "Competitions",
    slug: "competitions",
    description: "Simulate WCA-style competitions and practice under pressure.",
    icon: "Play",
    order: 5,
  },
  {
    name: "Challenge Rooms",
    slug: "challenge-rooms",
    description:
      "Compete with others in real-time scramble rooms and climb the leaderboard.",
    icon: "Trophy",
    order: 6,
  },
  {
    name: "Cubers & Profiles",
    slug: "cubers-profiles",
    description:
      "Learn how to find cubers, view profiles, understand stats, and manage profile visibility.",
    icon: "User",
    order: 7,
  },
  {
    name: "Account & Settings",
    slug: "account-settings",
    description:
      "Manage your profile, theme, privacy settings, and linked WCA account.",
    icon: "Settings",
    order: 8,
  },
  {
    name: "Cubie AI",
    slug: "cubie-ai",
    description:
      "Learn about Cubie, the AI assistant that helps you improve your cubing skills.",
    icon: "MessageSquare",
    order: 9,
  },
];

// ===== Articles per Category =====

const GETTING_STARTED_ARTICLES = [
  {
    title: "How do I sign in to CubeDev?",
    slug: "how-to-sign-in",
    summary:
      "CubeDev uses your WCA (World Cube Association) account for authentication. Here's how to sign in.",
    content:
      "CubeDev uses WCA OAuth for authentication. You need a WCA account to sign in. If you don't have one, you can create a WCA account at worldcubeassociation.org. Once you have a WCA account, signing in to CubeDev is quick and secure.",
    steps: [
      {
        stepNumber: 1,
        title: "Go to CubeDev",
        description:
          'Visit cubedev.xyz in your browser. You\'ll see the homepage with a "Sign in with WCA" button in the top right corner of the navigation bar.',
      },
      {
        stepNumber: 2,
        title: "Click Sign in with WCA",
        description:
          "Click the sign-in button. You'll be redirected to the WCA website to authorize CubeDev.",
      },
      {
        stepNumber: 3,
        title: "Authorize CubeDev",
        description:
          'On the WCA page, log in with your WCA credentials if you haven\'t already, then click "Authorize" to grant CubeDev access to your basic profile info (name, WCA ID, country).',
      },
      {
        stepNumber: 4,
        title: "You're in!",
        description:
          "After authorization, you'll be redirected back to CubeDev and automatically signed in. Your avatar and name will appear in the navigation bar.",
      },
    ],
    searchTags: [
      "sign in",
      "login",
      "WCA",
      "authentication",
      "account",
      "register",
    ],
    order: 0,
    isFeatured: true,
  },
  {
    title: "How do I navigate CubeDev?",
    slug: "how-to-navigate",
    summary:
      "A quick tour of CubeDev's layout — the public pages, Cube Lab sidebar, and where to find each feature.",
    content:
      'CubeDev has two main areas: the public website and the Cube Lab. The public website includes the homepage, About, Contact, Cubers directory, and this Help Center. The Cube Lab is where all the cubing tools live — you can access it by signing in and clicking "Go to Lab" or navigating to any Cube Lab feature.\n\nThe Cube Lab has a sidebar on the left with links to all features: Timer, Statistics, Algorithm Trainer, Coach, Competitions, and Challenge Rooms. On mobile, tap the hamburger menu to open the sidebar. You can collapse the sidebar on desktop for more screen space.',
    steps: [
      {
        stepNumber: 1,
        title: "Visit the Homepage",
        description:
          "The homepage at cubedev.xyz shows an overview of all features. Scroll down to explore what CubeDev offers.",
      },
      {
        stepNumber: 2,
        title: "Access the Cube Lab",
        description:
          'Sign in with your WCA account, then click "Go to Lab" on the homepage or navigate directly to cubedev.xyz/cube-lab/timer.',
      },
      {
        stepNumber: 3,
        title: "Use the Sidebar",
        description:
          "The left sidebar lists all Cube Lab features. Click any section to navigate. On mobile, tap the menu icon at the top left to open the sidebar.",
      },
      {
        stepNumber: 4,
        title: "Collapse the Sidebar",
        description:
          "On desktop, click the chevron at the bottom of the sidebar to collapse it. This gives you more space for the timer and other tools.",
      },
    ],
    searchTags: [
      "navigate",
      "sidebar",
      "menu",
      "layout",
      "cube lab",
      "homepage",
    ],
    order: 1,
    isFeatured: true,
  },
  {
    title: "What events does CubeDev support?",
    slug: "supported-events",
    summary:
      "CubeDev supports a wide range of WCA and non-WCA events for timing and practice.",
    content:
      "CubeDev supports all official WCA events and several non-WCA events. You can time solves for:\n\n• 2x2x2 through 7x7x7\n• 3x3x3 One-Handed (OH)\n• 3x3x3 Blindfolded (BLD)\n• Pyraminx\n• Megaminx\n• Skewb\n• Square-1\n• Clock\n\nYou can change the event in the Timer using the event selector dropdown above the scramble. Each event generates appropriate scrambles and tracks statistics separately.",
    searchTags: [
      "events",
      "puzzles",
      "2x2",
      "3x3",
      "4x4",
      "pyraminx",
      "megaminx",
      "skewb",
      "clock",
      "OH",
      "blindfolded",
    ],
    order: 2,
    isFeatured: false,
  },
  {
    title: "Is CubeDev free to use?",
    slug: "is-cubedev-free",
    summary:
      "Yes! CubeDev is completely free for all cubers. No premium tiers, no paywalls.",
    content:
      "CubeDev is 100% free to use. All features — the timer, statistics, algorithm trainer, coach, competitions, and challenge rooms — are available to every user at no cost. There are no premium tiers or paywalls. CubeDev is built by cubers, for the cubing community.\n\nIf you'd like to support the project, you can contribute on GitHub or share CubeDev with your cubing friends!",
    searchTags: ["free", "cost", "price", "premium", "paid", "subscription"],
    order: 3,
    isFeatured: false,
  },
  {
    title: "How do I restart feature tours and walkthrough guides?",
    slug: "restart-feature-tours",
    summary:
      "Use the Help or Guide buttons inside feature pages to reopen walkthroughs whenever you need a refresher.",
    content:
      "CubeDev walkthroughs can always be revisited. Most feature pages show a floating Help or Guide button after your first completion, so you can replay onboarding anytime.",
    steps: [
      {
        stepNumber: 1,
        title: "Open the Feature Page",
        description:
          "Go to Coach, Competitions, Challenge Rooms, or Algorithm Trainer from the Cube Lab sidebar.",
      },
      {
        stepNumber: 2,
        title: "Find the Help Button",
        description:
          'Look for a floating "Help" or "Guide" button near the bottom-right corner.',
      },
      {
        stepNumber: 3,
        title: "Replay the Walkthrough",
        description:
          "Click the button to restart the walkthrough and go step-by-step through key actions again.",
      },
    ],
    searchTags: [
      "tour",
      "walkthrough",
      "guide",
      "help",
      "onboarding",
      "restart",
    ],
    order: 4,
    isFeatured: false,
  },
];

const TIMER_ARTICLES = [
  {
    title: "How do I start and stop the timer?",
    slug: "how-to-start-stop-timer",
    summary:
      "Hold the spacebar (or tap on mobile) to ready the timer, release to start, and press again to stop.",
    content:
      "The CubeDev timer works just like a Stackmat timer. You can use the spacebar on desktop or tap the screen on mobile devices.",
    steps: [
      {
        stepNumber: 1,
        title: "Go to the Timer",
        description:
          "Navigate to Cube Lab > Timer from the sidebar, or go directly to cubedev.xyz/cube-lab/timer.",
      },
      {
        stepNumber: 2,
        title: "Hold the Spacebar",
        description:
          "Press and hold the spacebar. The timer display will turn yellow, indicating it's in the holding state.",
      },
      {
        stepNumber: 3,
        title: "Wait for Green",
        description:
          "Keep holding until the display turns green. This means the timer is ready to start.",
      },
      {
        stepNumber: 4,
        title: "Release to Start",
        description:
          "Release the spacebar to start the timer. The display turns red while timing. Perform your solve!",
      },
      {
        stepNumber: 5,
        title: "Press to Stop",
        description:
          "Press the spacebar (or tap the screen) again to stop the timer. Your solve time will be recorded.",
      },
    ],
    searchTags: [
      "timer",
      "start",
      "stop",
      "spacebar",
      "solve",
      "record",
      "tap",
    ],
    order: 0,
    isFeatured: true,
  },
  {
    title: "How do I add a +2 or DNF penalty?",
    slug: "add-penalty",
    summary:
      "After each solve, penalty buttons appear below the timer to mark +2 or DNF.",
    content:
      "After you stop the timer, +2 and DNF penalty buttons appear below the time display. You can also change penalties from the solve history list.\n\n• +2 adds 2 seconds to your solve time (for starting/stopping infractions)\n• DNF (Did Not Finish) marks a solve as incomplete\n\nClick the penalty button once to apply it, click again to remove it. Penalties are reflected immediately in your averages and statistics.",
    steps: [
      {
        stepNumber: 1,
        title: "Complete a Solve",
        description:
          "Finish a solve normally so the time is displayed on screen.",
      },
      {
        stepNumber: 2,
        title: "Click +2 or DNF",
        description:
          'Below the timer display, click the "+2" button to add 2 seconds, or "DNF" to mark it as Did Not Finish.',
      },
      {
        stepNumber: 3,
        title: "Toggle Off",
        description:
          "Click the same button again to remove the penalty. You can also change it from the solve history by clicking on a solve.",
      },
    ],
    searchTags: ["penalty", "+2", "DNF", "infraction", "did not finish"],
    order: 1,
    isFeatured: false,
  },
  {
    title: "How do I use manual time entry?",
    slug: "manual-time-entry",
    summary:
      "Switch to Manual mode to type in solve times directly instead of using the timer.",
    content:
      "If you're using an external timer (like a physical Stackmat) or want to enter times manually, you can switch to Manual mode.\n\nIn Manual mode, you'll see a text input field where you can type your time. Enter the time in seconds (e.g., 12.34) and press Enter to record it. The scramble and all statistics work the same as in normal timer mode.",
    steps: [
      {
        stepNumber: 1,
        title: "Open Timer Settings",
        description:
          "Click the settings/gear icon near the timer display area.",
      },
      {
        stepNumber: 2,
        title: "Switch to Manual Mode",
        description:
          'In the timer settings, find the "Timer Mode" option and select "Manual".',
      },
      {
        stepNumber: 3,
        title: "Type Your Time",
        description:
          "A text input appears. Type your solve time in seconds (e.g., 15.67) and press Enter to record it.",
      },
    ],
    searchTags: [
      "manual",
      "type",
      "enter",
      "input",
      "stackmat",
      "external timer",
    ],
    order: 2,
    isFeatured: false,
  },
  {
    title: "How do I use Stackmat mode?",
    slug: "stackmat-mode",
    summary:
      "Connect a Stackmat timer via your device's microphone input to use hardware timing.",
    content:
      "CubeDev supports Stackmat timer integration through your device's microphone input. Connect your Stackmat timer using a 2.5mm to 3.5mm audio cable to your computer/phone's mic port, then switch to Stackmat mode in the timer settings.\n\nNote: Stackmat mode requires microphone permission in your browser. Make sure to allow access when prompted.",
    steps: [
      {
        stepNumber: 1,
        title: "Connect Your Stackmat",
        description:
          "Use a 2.5mm to 3.5mm audio cable to connect your Stackmat timer to your device's microphone/headphone jack.",
      },
      {
        stepNumber: 2,
        title: "Open Timer Settings",
        description: "Click the gear icon near the timer display.",
      },
      {
        stepNumber: 3,
        title: 'Select "Stackmat" Mode',
        description:
          'In timer mode settings, select "Stackmat". Allow microphone access if prompted by your browser.',
      },
      {
        stepNumber: 4,
        title: "Start Solving",
        description:
          "Use your Stackmat timer as normal. Times will be automatically read and recorded in CubeDev.",
      },
    ],
    searchTags: [
      "stackmat",
      "hardware",
      "microphone",
      "audio",
      "cable",
      "timer mode",
    ],
    order: 3,
    isFeatured: false,
  },
  {
    title: "How do I manage sessions?",
    slug: "manage-sessions",
    summary:
      "Sessions let you organize your solves into groups. Create, rename, switch, and delete sessions.",
    content:
      "Sessions help you organize your practice. You might have one session for 3x3, another for OH practice, and another for a competition warm-up.\n\nEach session keeps its own solve history and statistics. When you switch sessions, the timer, scramble, and stats all update to reflect the active session.",
    steps: [
      {
        stepNumber: 1,
        title: "Find the Session Manager",
        description:
          "Above the timer area, you'll see the current session name and a dropdown arrow.",
      },
      {
        stepNumber: 2,
        title: "Create a New Session",
        description:
          'Click the "+" or "New Session" button. Give it a name and select the default event.',
      },
      {
        stepNumber: 3,
        title: "Switch Sessions",
        description:
          "Click the session dropdown and select a different session. Your timer and stats will switch to that session's data.",
      },
      {
        stepNumber: 4,
        title: "Rename or Delete",
        description:
          "Right-click or use the session menu (three dots) to rename or delete a session.",
      },
    ],
    searchTags: ["session", "create", "switch", "rename", "delete", "organize"],
    order: 4,
    isFeatured: false,
  },
  {
    title: "How do I change the scramble event?",
    slug: "change-scramble-event",
    summary:
      "Use the event selector dropdown to switch between different puzzle events.",
    content:
      "The event selector is located above the scramble display in the Timer section. Click it to see all supported events and select the one you want to practice. The scramble algorithm will update to match the selected event, and your statistics will filter to show only solves for that event.",
    searchTags: ["event", "scramble", "puzzle", "change", "switch", "select"],
    order: 5,
    isFeatured: false,
  },
  {
    title: "How do I delete a solve?",
    slug: "delete-solve",
    summary:
      "Remove a mistaken solve from your history by clicking the trash/delete icon on any solve entry.",
    content:
      "If you accidentally recorded a solve or want to remove one, you can delete it from your solve history.\n\nIn the solve history list below the timer, find the solve you want to remove. Click on it to expand the details, then click the trash/delete icon. The solve will be permanently removed and your averages will be recalculated.\n\nNote: Deleted solves cannot be recovered.",
    searchTags: ["delete", "remove", "solve", "history", "undo", "trash"],
    order: 6,
    isFeatured: false,
  },
  {
    title: "How do I view the scramble preview?",
    slug: "scramble-preview",
    summary:
      "A visual 2D/3D preview of the scramble is shown below the scramble notation in the timer.",
    content:
      "The scramble preview gives you a visual representation of what the puzzle looks like after applying the scramble. It appears below the scramble notation in the Timer section.\n\nThis is helpful for verifying your scramble is correct and for practicing inspection. The preview updates every time a new scramble is generated.",
    searchTags: [
      "scramble",
      "preview",
      "visual",
      "3D",
      "2D",
      "image",
      "diagram",
    ],
    order: 7,
    isFeatured: false,
  },
  {
    title: "How do I import or export my solves?",
    slug: "import-export-solves",
    summary:
      "Import solve data from other timers or export your CubeDev solves for backup.",
    content:
      "CubeDev supports importing and exporting solve data so you can transfer times from other timers or back up your data.\n\nLook for the Import/Export buttons in the Timer section (usually near the session manager or in the settings area). Export saves your solves as a file, and Import lets you load solves from supported formats.\n\nThis is particularly useful if you're migrating from another cubing timer to CubeDev.",
    searchTags: [
      "import",
      "export",
      "backup",
      "transfer",
      "cstimer",
      "migrate",
      "data",
    ],
    order: 8,
    isFeatured: false,
  },
  {
    title: "How do I switch timer modes?",
    slug: "switch-timer-modes",
    summary:
      "Choose between Normal Timer, Manual Entry, and Stackmat mode from the Timer settings panel.",
    content:
      "CubeDev supports three timer modes so you can practice with your preferred setup. Normal mode uses spacebar/tap timing, Manual mode lets you type times, and Stackmat mode reads hardware input through your microphone.",
    steps: [
      {
        stepNumber: 1,
        title: "Open Timer Settings",
        description:
          "Go to Cube Lab > Timer and click the settings/gear button near the timer controls.",
      },
      {
        stepNumber: 2,
        title: "Open Timer Mode",
        description: "In settings, open the Timer Mode dropdown.",
      },
      {
        stepNumber: 3,
        title: "Choose a Mode",
        description:
          "Select Normal Timer, Manual Entry, or Stackmat Timer. Your selection applies immediately.",
      },
    ],
    searchTags: [
      "timer mode",
      "normal",
      "manual",
      "stackmat",
      "switch",
      "settings",
    ],
    order: 9,
    isFeatured: true,
  },
  {
    title: "How do I configure keyboard shortcuts?",
    slug: "configure-keyboard-shortcuts",
    summary:
      "Customize timer shortcuts in Settings so event switching and timer actions match your workflow.",
    content:
      "You can fully customize keyboard shortcuts for timer actions such as event switching, scramble navigation, session controls, and penalties.",
    steps: [
      {
        stepNumber: 1,
        title: "Open Settings",
        description:
          "From Cube Lab, open your user menu and navigate to Settings.",
      },
      {
        stepNumber: 2,
        title: "Expand Keyboard Shortcuts",
        description:
          "Find the Keyboard Shortcuts section and enable shortcuts if they are currently disabled.",
      },
      {
        stepNumber: 3,
        title: "Edit a Shortcut",
        description:
          "Click the shortcut you want to change, then press the new key combination.",
      },
      {
        stepNumber: 4,
        title: "Save Changes",
        description:
          "Confirm and save. The new shortcut applies on the Timer page.",
      },
    ],
    searchTags: [
      "keyboard",
      "shortcuts",
      "hotkeys",
      "settings",
      "timer controls",
      "customize",
    ],
    order: 10,
    isFeatured: true,
  },
  {
    title: "Why are my keyboard shortcuts not working?",
    slug: "shortcuts-not-working",
    summary:
      "Shortcuts only work on the Timer page and require a physical keyboard with shortcuts enabled.",
    content:
      "If shortcuts are not responding, check where you are in the app and confirm shortcut settings. On mobile devices, keyboard shortcuts are disabled unless you use a physical keyboard.",
    steps: [
      {
        stepNumber: 1,
        title: "Go to Timer Page",
        description:
          "Open Cube Lab > Timer. Shortcuts are scoped to the Timer page.",
      },
      {
        stepNumber: 2,
        title: "Enable Shortcuts",
        description:
          "In Settings > Keyboard Shortcuts, make sure the enable toggle is turned on.",
      },
      {
        stepNumber: 3,
        title: "Check for Conflicts",
        description:
          "If a shortcut conflicts with another action, update one of them to a unique key combination.",
      },
      {
        stepNumber: 4,
        title: "Verify Device Type",
        description:
          "On phones/tablets without a physical keyboard, use on-screen controls instead of keyboard shortcuts.",
      },
    ],
    searchTags: [
      "keyboard",
      "shortcut",
      "not working",
      "timer page",
      "mobile",
      "conflict",
    ],
    order: 11,
    isFeatured: false,
  },
  {
    title: "How do I enable and use inspection time?",
    slug: "enable-inspection-time",
    summary:
      "Turn on Inspection Time in Timer settings to use a 15-second pre-solve countdown.",
    content:
      "Inspection mode adds a 15-second countdown before your solve begins. This helps you practice WCA-style starts.",
    steps: [
      {
        stepNumber: 1,
        title: "Open Timer Settings",
        description: "In Cube Lab > Timer, click the settings panel.",
      },
      {
        stepNumber: 2,
        title: "Enable Inspection Time",
        description: "Toggle Inspection Time on.",
      },
      {
        stepNumber: 3,
        title: "Start a Solve",
        description:
          "Hold the timer to arm it, then release to begin the inspection countdown.",
      },
      {
        stepNumber: 4,
        title: "Begin Solving",
        description:
          "Start solving before inspection expires and stop as usual when finished.",
      },
    ],
    searchTags: [
      "inspection",
      "15 seconds",
      "WCA",
      "countdown",
      "timer settings",
    ],
    order: 12,
    isFeatured: false,
  },
  {
    title: "How do I use Focus Mode on the timer?",
    slug: "use-focus-mode",
    summary:
      "Enable Focus Mode in Timer settings for a cleaner, distraction-reduced timing experience.",
    content:
      "Focus Mode is designed for uninterrupted practice by minimizing distractions in the timer interface.",
    steps: [
      {
        stepNumber: 1,
        title: "Open Timer Settings",
        description: "Go to Cube Lab > Timer and open settings.",
      },
      {
        stepNumber: 2,
        title: "Enable Focus Mode",
        description: "Toggle Focus Mode on to simplify the active timer view.",
      },
      {
        stepNumber: 3,
        title: "Practice in Focus",
        description:
          "Run solves normally. Turn Focus Mode off anytime to return to the full interface.",
      },
    ],
    searchTags: [
      "focus mode",
      "timer",
      "distraction",
      "clean view",
      "settings",
    ],
    order: 13,
    isFeatured: false,
  },
  {
    title: "How do I turn on phase splits?",
    slug: "turn-on-phase-splits",
    summary:
      "Enable Phase Splits in Timer settings to track stage-by-stage timing during solves.",
    content:
      "Phase splits help you analyze where time is spent in your solve. You can pair splits with your preferred solving method.",
    steps: [
      {
        stepNumber: 1,
        title: "Open Timer Settings",
        description: "Go to the Timer page and open settings.",
      },
      {
        stepNumber: 2,
        title: "Enable Phase Splits",
        description: "Turn on the Phase Splits toggle.",
      },
      {
        stepNumber: 3,
        title: "Select a Split Method",
        description:
          "Pick a method such as CFOP, Roux, ZZ, Petrus, or another available split preset.",
      },
      {
        stepNumber: 4,
        title: "Record and Review",
        description:
          "Complete solves and review per-phase timing to identify your slowest stages.",
      },
    ],
    searchTags: ["phase splits", "splits", "CFOP", "Roux", "ZZ", "analysis"],
    order: 14,
    isFeatured: false,
  },
  {
    title: "How do I choose the right split method?",
    slug: "choose-split-method",
    summary:
      "Use a split preset that matches your solving method so phase data is meaningful.",
    content:
      "Choose the split method that mirrors your real solve structure. This gives you clean phase comparisons and better improvement insights.",
    steps: [
      {
        stepNumber: 1,
        title: "Open Split Method Menu",
        description:
          "With Phase Splits enabled, open the split method dropdown in Timer settings.",
      },
      {
        stepNumber: 2,
        title: "Match Your Method",
        description:
          "Select CFOP, Roux, ZZ, Petrus, Mehta, OLL-only, PLL-only, or another preset that matches your solve flow.",
      },
      {
        stepNumber: 3,
        title: "Test for a Few Sessions",
        description:
          "Use the method for multiple solves, then compare phase consistency and adjust if needed.",
      },
    ],
    searchTags: [
      "split method",
      "phase",
      "CFOP",
      "Roux",
      "Petrus",
      "Mehta",
      "settings",
    ],
    order: 15,
    isFeatured: false,
  },
  {
    title: "How do I change timer sounds or mute PB sounds?",
    slug: "timer-sounds-and-pb-mute",
    summary:
      "Use Timer settings to choose sound style and control personal-best sound playback.",
    content:
      "CubeDev lets you customize timer audio feedback so it matches your practice setup. You can switch sound presets and mute PB celebration sound when needed.",
    steps: [
      {
        stepNumber: 1,
        title: "Open Timer Settings",
        description: "Go to Cube Lab > Timer and open settings.",
      },
      {
        stepNumber: 2,
        title: "Open Sound Options",
        description:
          "Find the sound section and choose your preferred option (for example beep, tick, or wood).",
      },
      {
        stepNumber: 3,
        title: "Adjust PB Sound",
        description:
          "Turn PB sound off if you want a quieter session, or keep it on for milestone feedback.",
      },
    ],
    searchTags: [
      "timer sound",
      "audio",
      "pb sound",
      "mute",
      "settings",
      "beep",
      "tick",
    ],
    order: 16,
    isFeatured: false,
  },
];

const STATISTICS_ARTICLES = [
  {
    title: "How do I view my solve statistics?",
    slug: "view-statistics",
    summary:
      "Navigate to Statistics in the Cube Lab sidebar to see your performance data, graphs, and trends.",
    content:
      "The Statistics page gives you a comprehensive view of your cubing performance. You can see your current averages (Ao5, Ao12, Ao50, Ao100, and more), personal bests, solve distribution charts, and improvement trends over time.\n\nNavigate to Cube Lab > Statistics from the sidebar. The page shows data for your active session by default.",
    steps: [
      {
        stepNumber: 1,
        title: "Open Statistics",
        description:
          'Click "Statistics" in the Cube Lab sidebar, or navigate to cubedev.xyz/cube-lab/statistics.',
      },
      {
        stepNumber: 2,
        title: "View Your Averages",
        description:
          "At the top you'll see your current averages — Ao5, Ao12, Ao50, Ao100 — along with your session best and global best.",
      },
      {
        stepNumber: 3,
        title: "Explore Charts",
        description:
          "Scroll down to see solve time distribution histograms, trend lines, and performance charts that show your progress.",
      },
    ],
    searchTags: [
      "statistics",
      "averages",
      "Ao5",
      "Ao12",
      "personal best",
      "trends",
      "graphs",
    ],
    order: 0,
    isFeatured: true,
  },
  {
    title: "What do Ao5, Ao12, Ao50, Ao100 mean?",
    slug: "averages-explained",
    summary:
      "These are running averages — the average of your last N solves, excluding the best and worst.",
    content:
      'In speedcubing, averages are calculated using the "trimmed mean" method:\n\n• Ao5 (Average of 5): Take your last 5 solves, remove the best and worst, average the remaining 3.\n• Ao12 (Average of 12): Take your last 12 solves, remove the best and worst, average the remaining 10.\n• Ao50 / Ao100: Same principle with 50 or 100 solves.\n\nIf any of the middle solves is a DNF, the entire average becomes DNF. If you have a +2 penalty, that 2 seconds is included in the average.\n\nThese averages give a more consistent picture of your solving speed by removing outliers.',
    searchTags: [
      "average",
      "Ao5",
      "Ao12",
      "Ao50",
      "Ao100",
      "trimmed mean",
      "calculation",
    ],
    order: 1,
    isFeatured: true,
  },
  {
    title: "How are personal bests tracked?",
    slug: "personal-bests",
    summary:
      "CubeDev automatically tracks your best single time and best averages across all sessions.",
    content:
      "CubeDev automatically tracks your personal bests (PBs) for both single solves and averages. Whenever you set a new PB, it's recorded and highlighted.\n\nYour PBs include:\n• Best single time\n• Best Ao5\n• Best Ao12\n\nThese are tracked per event, so your 3x3 PBs are separate from your 2x2 PBs. You can see your PBs on the Statistics page and in the timer area after each solve.",
    searchTags: [
      "personal best",
      "PB",
      "record",
      "best time",
      "single",
      "best average",
    ],
    order: 2,
    isFeatured: false,
  },
];

const ALGORITHM_TRAINER_ARTICLES = [
  {
    title: "How do I start learning algorithms?",
    slug: "start-learning-algorithms",
    summary:
      "Choose an algorithm set (PLL, OLL, etc.), browse the cases, and start practicing from the Algorithm Trainer.",
    content:
      "The Algorithm Trainer helps you learn and master cubing algorithms through spaced repetition and active practice. It supports PLL, OLL, F2L, COLL, CLL, EG-1, EG-2, ZBLL, and more.",
    steps: [
      {
        stepNumber: 1,
        title: "Open Algorithm Trainer",
        description:
          'Click "Algorithm Trainer" in the Cube Lab sidebar to access the trainer.',
      },
      {
        stepNumber: 2,
        title: "Choose an Algorithm Set",
        description:
          "You'll see algorithm sets organized by category (CFOP, 2x2, etc.). Click on a set like PLL or OLL to view its cases.",
      },
      {
        stepNumber: 3,
        title: "Browse Cases",
        description:
          "Each set shows all cases with their names, diagrams, and the default algorithm. Click on a case to see all available algorithms.",
      },
      {
        stepNumber: 4,
        title: "Start Practicing",
        description:
          'Select cases to practice and click "Start Training". The trainer will show you cases and track your recognition and execution speed.',
      },
    ],
    searchTags: [
      "algorithm",
      "learn",
      "PLL",
      "OLL",
      "F2L",
      "practice",
      "trainer",
      "cases",
    ],
    order: 0,
    isFeatured: true,
  },
  {
    title: "What algorithm sets are available?",
    slug: "available-algorithm-sets",
    summary:
      "CubeDev includes PLL, OLL, F2L, COLL, CLL, EG-1, EG-2, ZBLL, and more.",
    content:
      "The Algorithm Trainer includes a wide range of algorithm sets:\n\n3x3 CFOP:\n• PLL (21 cases) — Permutation of Last Layer\n• OLL (57 cases) — Orientation of Last Layer\n• F2L (41 cases) — First Two Layers\n• COLL (40 cases) — Corners of Last Layer\n• ZBLL (493 cases) — Zborowski-Bruchem Last Layer\n\n2x2:\n• CLL (40+ cases) — Corners of Last Layer for 2x2\n• EG-1 — Guimond method extension\n• EG-2 — Guimond method extension\n\nEach set includes case names, visual diagrams, multiple algorithm options, and difficulty ratings. New sets are added periodically.",
    searchTags: [
      "algorithm sets",
      "PLL",
      "OLL",
      "F2L",
      "COLL",
      "CLL",
      "EG-1",
      "EG-2",
      "ZBLL",
      "list",
    ],
    order: 1,
    isFeatured: false,
  },
  {
    title: "How does spaced repetition work?",
    slug: "spaced-repetition",
    summary:
      "The trainer uses spaced repetition to schedule reviews — harder cases appear more often.",
    content:
      "Spaced repetition is a proven learning technique. The Algorithm Trainer tracks your performance on each case and schedules reviews optimally:\n\n• Cases you struggle with appear more frequently\n• Cases you know well are spaced out over longer intervals\n• Your mastery level is tracked per case\n\nThis means you spend more time on algorithms you need to work on and less time on ones you've already mastered. Consistent daily practice of 10-15 minutes is more effective than occasional long sessions.",
    searchTags: [
      "spaced repetition",
      "review",
      "schedule",
      "mastery",
      "learning",
      "practice",
    ],
    order: 2,
    isFeatured: false,
  },
  {
    title: "How do I use recognition, execution, and blind practice modes?",
    slug: "algorithm-practice-modes",
    summary:
      "Pick a practice mode based on your goal: case identification, execution speed, or memory-based recall.",
    content:
      "Algorithm Trainer includes multiple drill styles so you can train different skills, from recognizing cases quickly to executing with better speed and consistency.",
    steps: [
      {
        stepNumber: 1,
        title: "Open Algorithm Trainer",
        description:
          "Go to Cube Lab > Algorithm Trainer and open an algorithm set.",
      },
      {
        stepNumber: 2,
        title: "Open Practice Modes",
        description:
          "Choose Recognition Drill, Execution Drill, or Blind Recognition.",
      },
      {
        stepNumber: 3,
        title: "Run Focused Sessions",
        description:
          "Use recognition to improve case ID, execution to improve speed, and blind mode to strengthen memory and pattern intuition.",
      },
    ],
    searchTags: [
      "algorithm trainer",
      "practice modes",
      "recognition",
      "execution",
      "blind recognition",
      "drills",
    ],
    order: 3,
    isFeatured: false,
  },
  {
    title: "What do mastery, due reviews, and heatmap activity mean?",
    slug: "mastery-due-reviews-heatmap",
    summary:
      "Mastery tracks learned stability, due reviews show what to practice today, and the heatmap shows consistency over time.",
    content:
      "These indicators are your daily training dashboard:\n\n• Mastery count: cases you consistently recall correctly\n• Due reviews: cases scheduled for today by spaced repetition\n• Activity heatmap: your review consistency across days\n\nUse all three together to keep progress steady instead of cramming long sessions.",
    searchTags: [
      "mastery",
      "due reviews",
      "heatmap",
      "spaced repetition",
      "daily practice",
      "algorithm progress",
    ],
    order: 4,
    isFeatured: false,
  },
];

const COACH_ARTICLES = [
  {
    title: "How do I set up the Coach?",
    slug: "setup-coach",
    summary:
      "Create a coaching profile by selecting your event, setting a goal, and the Coach will build a personalized plan.",
    content:
      "The Coach feature helps you improve systematically with personalized training plans and progress tracking.",
    steps: [
      {
        stepNumber: 1,
        title: "Open Coach",
        description:
          'Click "Coach" in the Cube Lab sidebar to access the coaching feature.',
      },
      {
        stepNumber: 2,
        title: "Create Your Profile",
        description:
          "Set up your coaching profile by selecting your primary event (e.g., 3x3) and your current skill level.",
      },
      {
        stepNumber: 3,
        title: "Set a Goal",
        description:
          'Choose a goal like "Sub-20" or "Sub-15", or set a custom target time. Select a target date to achieve it.',
      },
      {
        stepNumber: 4,
        title: "Follow Your Plan",
        description:
          "The Coach generates a personalized training plan based on your current performance and goal. Follow the recommended practice schedule and track your progress.",
      },
    ],
    searchTags: [
      "coach",
      "goal",
      "training plan",
      "improve",
      "personalized",
      "setup",
    ],
    order: 0,
    isFeatured: false,
  },
  {
    title: "How does goal tracking work?",
    slug: "goal-tracking",
    summary:
      "The Coach monitors your solve times and tells you if you're on track to reach your goal by the target date.",
    content:
      "Once you set a goal in the Coach, it continuously monitors your performance:\n\n• Your current average is compared against your target\n• A progress bar shows how close you are to your goal\n• The Coach tells you if you're on track, ahead, or behind schedule\n• Weekly snapshots record your progress over time\n• When you achieve your goal, it's archived in your goal history\n\nThe Coach analyzes your solve data to provide actionable insights about where you can improve — whether it's cross efficiency, F2L recognition, or last layer speed.",
    searchTags: [
      "goal",
      "tracking",
      "progress",
      "on track",
      "improvement",
      "target",
    ],
    order: 1,
    isFeatured: false,
  },
  {
    title: "How do I use Coach tabs (Plan, Journal, Progress)?",
    slug: "use-coach-tabs",
    summary:
      "Coach tabs separate planning, daily logging, and long-term progress so you can improve systematically.",
    content:
      "Coach is designed as a workflow: plan your week, log your practice, then review progress. Using all three tabs gives the best results.",
    steps: [
      {
        stepNumber: 1,
        title: "Open Training Plan",
        description:
          "Use Training Plan to view weekly activities and complete daily tasks.",
      },
      {
        stepNumber: 2,
        title: "Log Sessions in Journal",
        description:
          "Use Journal to record what you practiced, your mood, and notes about what worked.",
      },
      {
        stepNumber: 3,
        title: "Review Progress",
        description:
          "Open Progress to check streaks, goal movement, and improvement trends.",
      },
    ],
    searchTags: [
      "coach tabs",
      "training plan",
      "journal",
      "progress",
      "workflow",
      "coach",
    ],
    order: 2,
    isFeatured: false,
  },
  {
    title: "How does Coach create smart recommendations?",
    slug: "coach-smart-recommendations",
    summary:
      "Coach analyzes your solve patterns and goal timeline to suggest practice that targets weak areas.",
    content:
      "Smart recommendations adapt based on your recent solves, consistency patterns, and remaining time to your goal. This helps you focus effort where it has the highest impact.",
    searchTags: [
      "coach",
      "recommendations",
      "weak areas",
      "goal planning",
      "training",
      "improvement",
    ],
    order: 3,
    isFeatured: false,
  },
];

const COMPETITIONS_ARTICLES = [
  {
    title: "How do I start a competition simulation?",
    slug: "start-competition-simulation",
    summary:
      "Practice competing under WCA-style conditions with timed rounds, averages, and rankings.",
    content:
      "Competition Simulations let you practice competing in a WCA-style format from the comfort of your home. You can simulate first rounds, finals, and multi-round events.",
    steps: [
      {
        stepNumber: 1,
        title: "Open Competitions",
        description: 'Click "Competitions" in the Cube Lab sidebar.',
      },
      {
        stepNumber: 2,
        title: "Select a Format",
        description:
          "Choose the competition format: Average of 5 (Ao5), Mean of 3 (Mo3), or Best of 3 (Bo3).",
      },
      {
        stepNumber: 3,
        title: "Start the Simulation",
        description:
          'Click "Start" to begin. You\'ll get the exact number of scrambles for the format (5 for Ao5, 3 for Mo3). Solve each one as if you were at a real competition.',
      },
      {
        stepNumber: 4,
        title: "View Results",
        description:
          "After all solves, see your result calculated exactly as WCA would — with trimmed averages and final ranking.",
      },
    ],
    searchTags: [
      "competition",
      "simulation",
      "WCA",
      "practice",
      "Ao5",
      "mean",
      "round",
    ],
    order: 0,
    isFeatured: false,
  },
  {
    title: "How do I filter competitions by event, region, or date?",
    slug: "filter-competitions",
    summary:
      "Use competition filters to quickly find events by puzzle, location, and timeframe.",
    content:
      "Competition browsing includes smart filtering so you can target the kinds of events you care about before running simulations.",
    steps: [
      {
        stepNumber: 1,
        title: "Open Competitions",
        description: "Go to Cube Lab > Competitions.",
      },
      {
        stepNumber: 2,
        title: "Set Filter Values",
        description:
          "Choose event type, region, and time range using the filter controls.",
      },
      {
        stepNumber: 3,
        title: "Refine by Search",
        description:
          "Use search terms like city or competition name to narrow results further.",
      },
    ],
    searchTags: [
      "competitions",
      "filter",
      "region",
      "event",
      "date",
      "search",
      "simulation",
    ],
    order: 1,
    isFeatured: false,
  },
  {
    title: "How do I review simulation history and performance analytics?",
    slug: "simulation-history-analytics",
    summary:
      "After simulations, open history and analytics to track averages, consistency, and trends over time.",
    content:
      "Simulation history helps you compare sessions, while analytics highlights consistency and trend direction so you can practice with intent.",
    steps: [
      {
        stepNumber: 1,
        title: "Complete Simulations",
        description:
          "Run one or more simulated rounds in the Competitions section.",
      },
      {
        stepNumber: 2,
        title: "Open History",
        description:
          "View your simulation history list to compare recent rounds.",
      },
      {
        stepNumber: 3,
        title: "Inspect Analytics",
        description:
          "Review averages, consistency signals, and trend charts to decide what to improve next.",
      },
    ],
    searchTags: [
      "simulation history",
      "analytics",
      "competition",
      "trend",
      "consistency",
      "averages",
    ],
    order: 2,
    isFeatured: false,
  },
];

const CHALLENGES_ARTICLES = [
  {
    title: "How do I join a Challenge Room?",
    slug: "join-challenge-room",
    summary:
      "Challenge Rooms let you compete with other cubers on the same scramble in real-time.",
    content:
      "Challenge Rooms are real-time rooms where cubers compete on the same scramble. Everyone gets the same scramble, and you can see how your time compares to others instantly.",
    steps: [
      {
        stepNumber: 1,
        title: "Open Challenge Rooms",
        description: 'Click "Challenge Rooms" in the Cube Lab sidebar.',
      },
      {
        stepNumber: 2,
        title: "Browse Available Rooms",
        description:
          "See a list of active challenge rooms. Each shows the event type, number of participants, and the current scramble round.",
      },
      {
        stepNumber: 3,
        title: "Join a Room",
        description:
          'Click "Join" on any active room that matches the event you want to compete in.',
      },
      {
        stepNumber: 4,
        title: "Solve & Compare",
        description:
          "Solve using the shared scramble. Your time is automatically submitted and you can see the live leaderboard of all participants.",
      },
    ],
    searchTags: [
      "challenge",
      "room",
      "join",
      "compete",
      "multiplayer",
      "leaderboard",
      "live",
    ],
    order: 0,
    isFeatured: false,
  },
  {
    title: "How do Challenge Room leaderboards work?",
    slug: "challenge-leaderboards",
    summary:
      "Each room has a live leaderboard showing all participants ranked by their solve time.",
    content:
      "When you complete a solve in a Challenge Room, your time is immediately added to the room's leaderboard. The leaderboard shows:\n\n• All participants ranked by time (fastest first)\n• DNF results at the bottom\n• Your position highlighted\n• Total number of participants\n\nEach round uses a new scramble, and the leaderboard resets for each round. Your overall Challenge Room statistics (total rooms, wins, average placement) are tracked on your profile.",
    searchTags: ["leaderboard", "ranking", "position", "challenge", "results"],
    order: 1,
    isFeatured: false,
  },
  {
    title: "How do I create a Challenge Room?",
    slug: "create-challenge-room",
    summary:
      "Create a room from Quick Action, choose event and format, then share it publicly or privately.",
    content:
      "Creating a room is the fastest way to start a live challenge with friends or the wider CubeDev community.",
    steps: [
      {
        stepNumber: 1,
        title: "Open Challenge Rooms",
        description: "Go to Cube Lab > Challenge Rooms.",
      },
      {
        stepNumber: 2,
        title: "Select Create Room",
        description: "Use Quick Action and choose Create Room.",
      },
      {
        stepNumber: 3,
        title: "Set Room Options",
        description:
          "Pick event, format (Ao5 or Ao12), and choose whether the room is public or private.",
      },
      {
        stepNumber: 4,
        title: "Launch and Share",
        description:
          "Create the room and share the link or code so others can join.",
      },
    ],
    searchTags: [
      "challenge room",
      "create",
      "Ao5",
      "Ao12",
      "public",
      "private",
      "quick action",
    ],
    order: 2,
    isFeatured: true,
  },
  {
    title: "How do I join a room by code or from active public rooms?",
    slug: "join-room-by-code-or-public",
    summary:
      "Join private rooms with a code or jump into open public rooms from the active list.",
    content:
      "Challenge Rooms support both invite-based and open participation so you can compete with friends or meet new cubers.",
    steps: [
      {
        stepNumber: 1,
        title: "Open Join Room",
        description: "From Quick Action, choose Join Room.",
      },
      {
        stepNumber: 2,
        title: "Use a Room Code",
        description: "Enter the room code if the room is private.",
      },
      {
        stepNumber: 3,
        title: "Or Browse Public Rooms",
        description:
          "Use Active Public Rooms to join open challenges instantly.",
      },
    ],
    searchTags: [
      "join room",
      "room code",
      "public rooms",
      "private room",
      "challenge",
      "quick action",
    ],
    order: 3,
    isFeatured: false,
  },
  {
    title: "How do room rankings and 48-hour expiry work?",
    slug: "challenge-room-ranking-and-expiry",
    summary:
      "Rooms stay active for 48 hours, rankings update live, and final reports are available after closure.",
    content:
      "Challenge Rooms keep leaderboards live during the room window. When the room reaches its end, final results remain available for review.",
    steps: [
      {
        stepNumber: 1,
        title: "Compete During Active Window",
        description: "Submit your solves while the room is active.",
      },
      {
        stepNumber: 2,
        title: "Track Live Ranking",
        description:
          "Watch positions update in real time as participants finish.",
      },
      {
        stepNumber: 3,
        title: "Review Final Results",
        description:
          "After 48 hours, the room closes and final ranking/statistics are locked in the results view.",
      },
    ],
    searchTags: [
      "ranking",
      "leaderboard",
      "expiry",
      "48 hours",
      "challenge room",
      "results",
    ],
    order: 4,
    isFeatured: false,
  },
];

const ACCOUNT_SETTINGS_ARTICLES = [
  {
    title: "How do I change the color scheme?",
    slug: "change-color-scheme",
    summary:
      "CubeDev offers 5 color schemes (Blue, Purple, Green, Orange, Cyan) that you can switch from Settings.",
    content:
      "CubeDev supports 5 color schemes to personalize your experience. Each scheme changes the primary accent color across the entire platform.",
    steps: [
      {
        stepNumber: 1,
        title: "Go to Settings",
        description:
          'Click on your avatar/profile in the Cube Lab sidebar and select "Settings", or navigate to the Settings page from your profile dropdown.',
      },
      {
        stepNumber: 2,
        title: "Find Color Scheme",
        description:
          'Under the "Appearance" section, you\'ll see the Color Scheme selector with 5 color options.',
      },
      {
        stepNumber: 3,
        title: "Select a Color",
        description:
          "Click on Blue, Purple, Green, Orange, or Cyan. The change applies instantly across the entire site.",
      },
    ],
    searchTags: [
      "color",
      "scheme",
      "theme",
      "blue",
      "purple",
      "green",
      "orange",
      "cyan",
      "appearance",
    ],
    order: 0,
    isFeatured: true,
  },
  {
    title: "How do I switch between dark and light mode?",
    slug: "dark-light-mode",
    summary:
      'Toggle between dark and light themes from Settings, or set it to "Auto" to follow your system preference.',
    content:
      "CubeDev supports dark mode, light mode, and automatic system detection.\n\n• Dark mode (default): Easy on the eyes, ideal for long practice sessions\n• Light mode: Bright and clean for well-lit environments\n• Auto: Follows your operating system's preference\n\nYou can change this in Settings under the Appearance section.",
    searchTags: [
      "dark mode",
      "light mode",
      "theme",
      "toggle",
      "auto",
      "appearance",
    ],
    order: 1,
    isFeatured: false,
  },
  {
    title: "How do I customize the timer display?",
    slug: "customize-timer-display",
    summary:
      "Change timer font size, font family, and update mode (live, solving text, or seconds only).",
    content:
      'You can customize how the timer looks and behaves from Settings:\n\nFont Size: Choose from Small, Medium, Large, or Extra Large.\n\nFont Family:\n• Mono — Monospaced font, classic timer look\n• Sans — Clean sans-serif\n• Statement — Bold display font\n\nTimer Update Mode:\n• Live — Shows time updating in real-time while solving\n• Solving — Shows "Solving..." text while the timer runs\n• Seconds — Shows only whole seconds while running\n\nYou can also toggle visual effects like glow and reduce motion for a cleaner look.',
    searchTags: [
      "timer",
      "font",
      "size",
      "display",
      "customize",
      "glow",
      "motion",
      "update mode",
    ],
    order: 2,
    isFeatured: false,
  },
  {
    title: "How do I make my profile private?",
    slug: "private-profile",
    summary:
      "Toggle profile visibility in Settings to hide your CubeDev profile from public view.",
    content:
      'If you don\'t want other users to see your profile in the Cubers directory:\n\n1. Go to Settings > Privacy\n2. Enable "Hide Profile" — this hides your profile from the public Cubers directory\n3. You can also hide your Challenge Room statistics separately\n\nNote: Your WCA profile on the WCA website is separate and not affected by this setting.',
    searchTags: ["privacy", "profile", "hide", "private", "public", "visible"],
    order: 3,
    isFeatured: false,
  },
  {
    title: "How do I reset keyboard shortcuts to default?",
    slug: "reset-shortcuts-default",
    summary:
      "Use the Keyboard Shortcuts settings panel to reset one shortcut or all shortcuts back to defaults.",
    content:
      "If your custom keybinds become confusing, you can safely revert to CubeDev defaults.",
    steps: [
      {
        stepNumber: 1,
        title: "Open Keyboard Shortcuts",
        description: "Go to Settings > Keyboard Shortcuts.",
      },
      {
        stepNumber: 2,
        title: "Choose Reset Type",
        description:
          "Use reset for one action or reset all shortcuts depending on what you need.",
      },
      {
        stepNumber: 3,
        title: "Confirm Reset",
        description: "Confirm the reset and test shortcuts on the Timer page.",
      },
    ],
    searchTags: [
      "keyboard",
      "shortcuts",
      "reset",
      "default",
      "keybind",
      "settings",
    ],
    order: 4,
    isFeatured: false,
  },
  {
    title: "How do I export and import solve data from Settings?",
    slug: "settings-export-import-solves",
    summary:
      "Use Data Management in Settings to export backups and import solve files from supported timers.",
    content:
      "Data Management helps you back up your progress and migrate solve history from other tools.",
    steps: [
      {
        stepNumber: 1,
        title: "Open Settings",
        description: "Go to your Cube Lab settings page.",
      },
      {
        stepNumber: 2,
        title: "Find Data Management",
        description: "Open the import/export section in settings.",
      },
      {
        stepNumber: 3,
        title: "Export or Import",
        description:
          "Choose Export Solves for a backup file, or Import Solves to upload supported solve data.",
      },
    ],
    searchTags: [
      "export",
      "import",
      "solves",
      "backup",
      "data management",
      "settings",
      "cstimer",
    ],
    order: 5,
    isFeatured: false,
  },
];

const CUBERS_PROFILES_ARTICLES = [
  {
    title: "How do I find cubers in the Cubers directory?",
    slug: "find-cubers-directory",
    summary:
      "Open the Cubers page to browse registered members, countries, and profile cards.",
    content:
      "The Cubers directory is the public community list where you can discover active CubeDev members and open their profiles.",
    steps: [
      {
        stepNumber: 1,
        title: "Open Cubers Directory",
        description: "Navigate to the Cubers page from the main navigation.",
      },
      {
        stepNumber: 2,
        title: "Browse User Cards",
        description:
          "Scroll through profile cards showing names, WCA IDs, and country.",
      },
      {
        stepNumber: 3,
        title: "Open a Profile",
        description: "Click any card to view that cuber's full profile page.",
      },
    ],
    searchTags: [
      "cubers",
      "directory",
      "find users",
      "profiles",
      "community",
      "browse",
    ],
    order: 0,
    isFeatured: true,
  },
  {
    title: "How do I search cubers by name, WCA ID, or country?",
    slug: "search-cubers",
    summary:
      "Use the search bar on the Cubers page to filter results by name, WCA ID, or country code.",
    content:
      "Search is instant in the directory, making it easy to locate specific cubers quickly.",
    steps: [
      {
        stepNumber: 1,
        title: "Open the Cubers Page",
        description: "Navigate to the Cubers directory.",
      },
      {
        stepNumber: 2,
        title: "Type a Search Term",
        description:
          "Enter a name, WCA ID, or country code in the search field.",
      },
      {
        stepNumber: 3,
        title: "Open Matching Profile",
        description: "Select a result card to open the cuber profile.",
      },
    ],
    searchTags: [
      "search",
      "cubers",
      "WCA ID",
      "country",
      "directory filter",
      "profiles",
    ],
    order: 1,
    isFeatured: false,
  },
  {
    title: "How do I use cuber profile tabs and stats sections?",
    slug: "use-cuber-profile-tabs",
    summary:
      "Cuber profiles include CubeDev stats, WCA stats, and training-related views depending on available data.",
    content:
      "Profiles are organized into tabs so you can quickly switch between platform stats and WCA competition data.",
    steps: [
      {
        stepNumber: 1,
        title: "Open a Cuber Profile",
        description: "From the directory, click a user card.",
      },
      {
        stepNumber: 2,
        title: "Switch Tabs",
        description:
          "Use profile tabs to move between CubeDev data, WCA data, and other available sections.",
      },
      {
        stepNumber: 3,
        title: "Compare Insights",
        description:
          "Use CubeDev trends for training patterns and WCA sections for official competition history.",
      },
    ],
    searchTags: [
      "cuber profile",
      "tabs",
      "CubeDev stats",
      "WCA stats",
      "training",
      "profile view",
    ],
    order: 2,
    isFeatured: false,
  },
  {
    title: "Why is a cuber profile hidden or unavailable?",
    slug: "cuber-profile-hidden-unavailable",
    summary:
      "A profile may be hidden due to privacy settings, account status, or because the user is not publicly registered.",
    content:
      "Not all profiles are always visible. Users can hide their profile, and unavailable accounts may no longer appear publicly.",
    searchTags: [
      "profile hidden",
      "unavailable",
      "privacy",
      "cubers directory",
      "not found",
      "public profile",
    ],
    order: 3,
    isFeatured: false,
  },
];

const CUBIE_AI_ARTICLES = [
  {
    title: "What is Cubie AI?",
    slug: "what-is-cubie",
    summary:
      "Cubie is CubeDev's AI assistant that helps you improve your cubing skills with personalized advice.",
    content:
      "Cubie AI is an intelligent assistant built into CubeDev that helps speedcubers improve. Cubie can:\n\n• Answer cubing questions (algorithms, techniques, methods)\n• Access the CubeDev knowledge base for detailed explanations\n• Look up WCA competition data and results\n• Analyze your solve times for personalized improvement suggestions\n• Recommend training plans based on your skill level\n\nCubie combines cubing expertise with knowledge of your personal data to give tailored advice. Ask Cubie anything about cubing!",
    searchTags: [
      "Cubie",
      "AI",
      "assistant",
      "chatbot",
      "help",
      "advice",
      "improve",
    ],
    order: 0,
    isFeatured: true,
  },
  {
    title: "What can I ask Cubie?",
    slug: "what-to-ask-cubie",
    summary:
      "Ask about algorithms, WCA competitions, your solve analysis, training tips, and general cubing questions.",
    content:
      'Here are some example questions you can ask Cubie:\n\n• "What\'s the best PLL algorithm for the T-perm?"\n• "How do I get faster at F2L?"\n• "Analyze my last 100 solves and tell me where I can improve"\n• "Who won 3x3 at Worlds 2023?"\n• "Create a practice plan to help me get sub-20"\n• "What\'s the difference between CFOP and Roux?"\n• "Show my average progression this month"\n\nCubie has access to your solve data (with your permission), WCA competition databases, and a comprehensive cubing knowledge base.',
    searchTags: [
      "ask",
      "questions",
      "examples",
      "Cubie",
      "what",
      "can",
      "help",
    ],
    order: 1,
    isFeatured: false,
  },
];

// ===== Seed Mutation =====
export const seedFAQ = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("faqCategories").first();

    if (existing) {
      return {
        message:
          "FAQ data already seeded. Delete existing data first to re-seed.",
      };
    }

    const now = Date.now();

    // Map of category slugs to their article data
    const categoryArticleMap: Record<string, typeof GETTING_STARTED_ARTICLES> =
      {
        "getting-started": GETTING_STARTED_ARTICLES,
        timer: TIMER_ARTICLES,
        statistics: STATISTICS_ARTICLES,
        "algorithm-trainer": ALGORITHM_TRAINER_ARTICLES,
        coach: COACH_ARTICLES,
        competitions: COMPETITIONS_ARTICLES,
        "challenge-rooms": CHALLENGES_ARTICLES,
        "cubers-profiles": CUBERS_PROFILES_ARTICLES,
        "account-settings": ACCOUNT_SETTINGS_ARTICLES,
        "cubie-ai": CUBIE_AI_ARTICLES,
      };

    let totalCategories = 0;
    let totalArticles = 0;

    for (const category of CATEGORIES) {
      // Insert category
      const categoryId = await ctx.db.insert("faqCategories", {
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        order: category.order,
        isPublished: true,
        createdAt: now,
        updatedAt: now,
      });
      totalCategories++;

      // Insert articles for this category
      const articles = categoryArticleMap[category.slug] || [];
      for (const article of articles) {
        await ctx.db.insert("faqArticles", {
          categoryId,
          title: article.title,
          slug: article.slug,
          summary: article.summary,
          content: article.content,
          steps: article.steps || undefined,
          searchTags: article.searchTags || undefined,
          order: article.order,
          isPublished: true,
          isFeatured: article.isFeatured || false,
          viewCount: 0,
          helpfulYes: 0,
          helpfulNo: 0,
          createdAt: now,
          updatedAt: now,
        });
        totalArticles++;
      }
    }

    return {
      message: `Successfully seeded ${totalCategories} categories and ${totalArticles} articles.`,
      categories: totalCategories,
      articles: totalArticles,
    };
  },
});

// Utility: Delete all FAQ data (useful for re-seeding)
export const clearFAQ = mutation({
  args: {},
  handler: async (ctx) => {
    const articles = await ctx.db.query("faqArticles").collect();
    for (const article of articles) {
      await ctx.db.delete(article._id);
    }

    const categories = await ctx.db.query("faqCategories").collect();
    for (const category of categories) {
      await ctx.db.delete(category._id);
    }

    return {
      message: `Cleared ${categories.length} categories and ${articles.length} articles.`,
    };
  },
});
