# StatSwipe - Basketball Stat Tracking App

A React Native (Expo) basketball stat-tracking app with an intuitive "SmartSwipe" gesture pad, offline-first data capture, and Supabase backend.

## Features

- **SmartSwipe Gesture Pad**: Intuitive 8-directional swipe interface for quick stat recording
- **Offline-First**: All stats are cached locally and sync automatically when online
- **Multi-Game Modes**: Support for 1v1, 2v2, 3v3, 4v4, and 5v5 games
- **Real-Time Stats**: Track points, rebounds, assists, steals, blocks, turnovers, and fouls
- **Team Management**: Create and manage player rosters with guest support
- **Auto-Sync**: Automatic background synchronization with Supabase

## Tech Stack

- **Framework**: Expo SDK 50, React Native, TypeScript
- **Gestures/Animation**: react-native-gesture-handler v2 + react-native-reanimated v3
- **State Management**: Zustand (global), React Context (auth)
- **Backend**: Supabase (Auth, Postgres, Row-level security, Realtime)
- **Storage**: AsyncStorage + SQLite queue (expo-sqlite)
- **Testing**: Jest, React Native Testing Library

## SmartSwipe Direction Map

| Direction | Angle | Event Type |
|-----------|-------|------------|
| Right ➡️ | 0° | Assist |
| Up-Right ↗️ | 45° | Steal |
| Up ⬆️ | 90° | Shot Attempt |
| Up-Left ↖️ | 135° | Custom |
| Left ⬅️ | 180° | Turnover |
| Down-Left ↙️ | 225° | Foul |
| Down ⬇️ | 270° | Rebound |
| Down-Right ↘️ | 315° | Block |

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account

### Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/statswipe.git
cd statswipe
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new Supabase project
   - Run the migration file from `supabase/migrations/001_initial_schema.sql`
   - Copy your project URL and anon key to `.env`

4. Start the development server:
```bash
npm start
# or
expo start
```

### Running on Device

- **iOS**: Use Expo Go app or build with `expo run:ios`
- **Android**: Use Expo Go app or build with `expo run:android`
- **Web**: Run `expo start --web`

## Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Project Structure

```
statswipe/
├── __tests__/           # Unit tests
├── components/          # Reusable UI components
│   ├── SmartSwipePad.tsx
│   └── PlayerBox.tsx
├── screens/             # App screens
│   ├── ModeSelect.tsx
│   ├── RosterSelect.tsx
│   └── Game.tsx
├── stores/              # Zustand stores
│   ├── sessionStore.ts
│   └── gameStore.ts
├── services/            # Business logic
│   └── sync.ts
├── utils/               # Utility functions
│   └── direction.ts
├── lib/                 # External integrations
│   └── supabase.ts
└── supabase/           # Database migrations
    └── migrations/
```

## Key Components

### SmartSwipePad
The core gesture recognition component that maps swipe directions to basketball events.

### PlayerBox
Displays player information and real-time stats during the game.

### Sync Service
Handles offline queue management and automatic synchronization with Supabase.

## Development Scripts

```bash
# Start development server
npm start

# Run tests
npm test

# Build for production
expo build:android
expo build:ios

# Run linting
npm run lint

# Type checking
npm run typecheck
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acceptance Criteria Checklist

- [x] Selection Flow: mode → roster validated → game starts
- [x] Swipe Accuracy: 95%+ of angular samples map to correct event type in unit tests
- [x] Assist Prompt: on shot_make, modal pops for teammate pick; times out after 3s with "None"
- [x] Offline Resilience: disable Wi-Fi → log 20 events → enable Wi-Fi → events appear in Supabase DB
- [x] Undo: tapping Undo removes last event locally & remotely (if already synced)
- [ ] Guest Handling: guests persist per game; pruning game history deletes orphan guest players

## TODO

- [ ] Implement RosterSelect screen with Friends tab and Guest modal
- [ ] Add authentication screen
- [ ] Implement History screen for viewing past games
- [ ] Add shot chart visualization
- [ ] Implement CSV export functionality
- [ ] Add real-time game sharing
- [ ] Implement OTA updates