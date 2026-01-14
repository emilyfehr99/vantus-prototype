# Developer Setup Guide

**Purpose:** Complete guide for setting up the Vantus development environment

**Last Updated:** January 2026

---

## Prerequisites

- **Node.js:** v20.x or higher
- **npm:** v10.x or higher
- **Git:** Latest version
- **Expo CLI:** For mobile app development (install globally: `npm install -g expo-cli`)
- **iOS Simulator** (macOS only) or **Android Studio** (for mobile testing)

---

## Repository Structure

```
vantus/
├── vantus-app/          # React Native mobile app
├── vantus-dashboard/    # Next.js supervisor dashboard
├── vantus-admin/        # Next.js admin portal
├── bridge-server/       # Node.js/Express bridge server
├── config/              # Configuration templates
├── docs/                # Documentation
└── test/                # Test fixtures and utilities
```

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/emilyfehr99/vantus-prototype.git
cd vantus-prototype/vantus
```

### 2. Install Dependencies

Install dependencies for each component:

```bash
# Bridge Server
cd bridge-server
npm install
cd ..

# Mobile App
cd vantus-app
npm install
cd ..

# Supervisor Dashboard
cd vantus-dashboard
npm install
cd ..

# Admin Portal
cd vantus-admin
npm install
cd ..
```

### 3. Environment Configuration

#### Bridge Server

Create `bridge-server/.env`:

```env
PORT=3001
NODE_ENV=development
LOG_LEVEL=debug
```

#### Mobile App

The mobile app uses `vantus-app/utils/config.js` which loads from:
- Environment variables (via `expo-constants`)
- `config/client-config.js` (if exists)
- Default values from `utils/constants.js`

#### Dashboard & Admin Portal

Create `.env.local` in each directory:

```env
NEXT_PUBLIC_BRIDGE_URL=http://localhost:3001
```

---

## Running the Application

### Development Mode

#### 1. Start Bridge Server

```bash
cd bridge-server
npm start
# Server runs on http://localhost:3001
```

#### 2. Start Mobile App

```bash
cd vantus-app
npm start
# Opens Expo DevTools
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
# Scan QR code for physical device
```

#### 3. Start Supervisor Dashboard

```bash
cd vantus-dashboard
npm run dev
# Dashboard runs on http://localhost:3000
```

#### 4. Start Admin Portal

```bash
cd vantus-admin
npm run dev
# Admin portal runs on http://localhost:3001 (or next available port)
```

---

## Development Workflow

### Code Style

- **JavaScript:** Follow ES6+ standards
- **TypeScript:** Follow TypeScript best practices
- **React Native:** Follow React Native conventions
- **Next.js:** Follow Next.js conventions

### Logging

Use the centralized logger utilities:

```javascript
// React Native (vantus-app)
import logger from './utils/logger';
logger.info('Message', { context });
logger.error('Error', error);

// Node.js (bridge-server)
const logger = require('./utils/logger');
logger.info('Message');
logger.error('Error', error);

// Next.js (dashboard/admin)
import logger from '../utils/logger';
logger.info('Message');
logger.error('Error', error);
```

### Error Handling

Use centralized error codes:

```javascript
import { createError, AUTH_ERRORS, getErrorMessage } from './utils/errorCodes';

try {
  // ... code
} catch (error) {
  const standardError = createError(
    AUTH_ERRORS.INVALID_PIN,
    getErrorMessage(AUTH_ERRORS.INVALID_PIN),
    ERROR_CATEGORIES.AUTHENTICATION,
    error,
    { badgeNumber }
  );
  logger.error('Authentication failed', standardError);
}
```

### Configuration

Always use the config service instead of hardcoded values:

```javascript
import configService from './utils/config';

const serverUrl = configService.getServerUrl();
const officerId = configService.getOfficerId(badgeNumber);
const thresholds = configService.getModelThresholds();
```

---

## Testing

### Unit Tests

```bash
# Run tests (when test framework is set up)
npm test
```

### Manual Testing

1. **Mobile App:**
   - Use demo badge numbers: `12345`, `67890`, `11111`, `22222`
   - PIN: Any 4+ digit number
   - Test authentication flow
   - Test calibration flow
   - Test session start/stop

2. **Dashboard:**
   - Connect to bridge server
   - View officer tiles
   - View contextual signals
   - Test signal detail panes

3. **Admin Portal:**
   - View analytics
   - Test policy controls
   - Test audit log export

---

## Common Development Tasks

### Adding a New Service

1. Create service file in appropriate `services/` directory
2. Add error handling using error codes
3. Add logging using logger utility
4. Document interface with JSDoc
5. Add stub implementation if external API not available

### Adding a New Utility Function

1. Add to appropriate `utils/` file or create new utility file
2. Add JSDoc documentation
3. Add validation if needed
4. Export from `utils/index.js` if applicable

### Modifying Configuration

1. Update `utils/constants.js` for default values
2. Update `utils/config.js` for config service logic
3. Update `config/client-config.template.js` for client template
4. Document changes in configuration documentation

---

## Debugging

### Mobile App

```bash
# Enable debug logging
# Set LOG_LEVEL=debug in environment

# View logs
npx react-native log-android  # Android
npx react-native log-ios      # iOS
```

### Bridge Server

```bash
# Enable debug logging
LOG_LEVEL=debug npm start

# View logs in terminal
```

### Dashboard/Admin Portal

```bash
# Browser console shows logs
# Check Network tab for API calls
```

---

## Git Workflow

### Branch Naming

- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `refactor/component-name` - Refactoring
- `docs/documentation-name` - Documentation

### Commit Messages

Follow conventional commits:

```
feat: Add new feature
fix: Fix bug description
refactor: Refactor component
docs: Update documentation
chore: Maintenance tasks
```

### Before Committing

1. Run linter (when configured)
2. Check for console.log statements (use logger instead)
3. Verify no hardcoded values (use config/constants)
4. Update documentation if needed
5. Test changes locally

---

## Troubleshooting

### npm install fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Expo/React Native issues

```bash
# Clear Expo cache
expo start -c

# Clear Metro bundler cache
npx react-native start --reset-cache
```

### Port already in use

```bash
# Find process using port
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Bridge server connection issues

1. Verify bridge server is running on port 3001
2. Check firewall settings
3. Verify `BRIDGE_SERVER_URL` in config
4. Check network connectivity

---

## Architecture Overview

### Mobile App (React Native)

- **Entry:** `App.js`
- **Components:** `components/`
- **Services:** `services/`
- **Utils:** `utils/`
- **State:** React hooks (useState, useEffect)

### Bridge Server (Node.js/Express)

- **Entry:** `server.js`
- **Services:** `services/`
- **Utils:** `utils/`
- **Communication:** Socket.io for real-time events

### Dashboard (Next.js)

- **Pages:** `pages/`
- **Styles:** `styles/`
- **Utils:** `utils/`
- **Communication:** Socket.io client

### Admin Portal (Next.js)

- **Pages:** `app/`
- **Components:** `components/`
- **Utils:** `utils/`
- **Communication:** REST API calls

---

## Key Files to Know

### Configuration

- `vantus-app/utils/constants.js` - All hardcoded values
- `vantus-app/utils/config.js` - Configuration service
- `config/client-config.template.js` - Client config template

### Services

- `vantus-app/services/telemetryService.js` - Telemetry collection
- `vantus-app/services/baselineCalibration.js` - Baseline calculations
- `vantus-app/services/multiModelDetection.js` - AI model integration
- `bridge-server/services/cadService.js` - CAD integration
- `bridge-server/services/geocodingService.js` - Geocoding integration

### Utilities

- `vantus-app/utils/logger.js` - Logging utility
- `vantus-app/utils/errorCodes.js` - Error codes
- `vantus-app/utils/validationUtils.js` - Validation functions
- `vantus-app/utils/mathUtils.js` - Statistical calculations
- `vantus-app/utils/gpsUtils.js` - GPS calculations

---

## Next Steps

1. **Read Architecture Documentation:** `docs/README.md`
2. **Review Baseline Calibration Spec:** `docs/BASELINE_CALIBRATION_SPEC.md`
3. **Understand Signal Generation:** `docs/SIGNAL_GENERATION_AND_LIMITATIONS.md`
4. **Check Client Onboarding Checklist:** `NOTION_CHECKLIST.md`

---

## Getting Help

- **Documentation:** Check `docs/` directory
- **Code Comments:** Read JSDoc comments in code
- **Issues:** Check GitHub issues
- **Team:** Contact development team

---

## Additional Resources

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Next.js Documentation](https://nextjs.org/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [TensorFlow.js Documentation](https://www.tensorflow.org/js)
