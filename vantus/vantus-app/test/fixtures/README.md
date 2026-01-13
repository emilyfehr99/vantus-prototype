# Test Fixtures

This directory contains sample data files for testing and development.

## Files

- `sampleBaseline.json` - Sample baseline calibration data
- `sampleSignal.json` - Sample contextual signal
- `sampleTelemetry.json` - Sample telemetry data point
- `sampleSession.json` - Sample complete session data
- `sampleDetectionResult.json` - Sample AI model detection result

## Usage

These fixtures can be imported in tests or used for development:

```javascript
import sampleBaseline from './test/fixtures/sampleBaseline.json';
import sampleSignal from './test/fixtures/sampleSignal.json';
// ... etc
```

## Generating More Data

Use the mock data generators in `utils/mockDataGenerators.js` to generate additional test data programmatically.
