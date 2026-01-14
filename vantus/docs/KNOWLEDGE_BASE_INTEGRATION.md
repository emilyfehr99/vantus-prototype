# Knowledge Base Integration Guide

**Purpose:** Guide for integrating self-hosted knowledge management systems with Vantus

**Status:** Ready for integration - Supports multiple knowledge base providers

---

## Overview

The Vantus system can integrate with self-hosted knowledge management systems to:
- Store and retrieve pattern knowledge
- Document false positive patterns
- Store historical pattern insights
- Provide operational context guides
- Support supervisor training and reference

**Benefits:**
- Centralized knowledge management
- Pattern learning and improvement
- Historical context for signals
- Training materials for supervisors
- Documentation of system behavior

---

## Supported Knowledge Base Providers

### 1. Wiki.js (Recommended)

**What it is:** Modern, extensible wiki platform with Markdown support

**Setup:**
1. Deploy Wiki.js: [Wiki.js Documentation](https://docs.requarks.io/)
2. Create API key in Wiki.js settings
3. Configure API endpoint

**Configuration:**
```javascript
knowledgeBase: {
  provider: 'wikijs',
  apiUrl: 'https://your-wikijs-instance.com/api/v1',
  apiKey: 'your-wikijs-api-key',
}
```

**Environment Variables:**
```bash
KB_PROVIDER=wikijs
KB_API_URL=https://your-wikijs-instance.com/api/v1
KB_API_KEY=your-wikijs-api-key
```

**Features:**
- Markdown support
- Version history
- Access control
- Full-text search
- API access

---

### 2. BookStack

**What it is:** Easy-to-use platform with hierarchical organization (books/chapters/pages)

**Setup:**
1. Deploy BookStack: [BookStack Documentation](https://www.bookstackapp.com/docs/)
2. Create API token in BookStack settings
3. Configure API endpoint

**Configuration:**
```javascript
knowledgeBase: {
  provider: 'bookstack',
  apiUrl: 'https://your-bookstack-instance.com/api',
  apiKey: 'your-bookstack-api-token',
}
```

**Environment Variables:**
```bash
KB_PROVIDER=bookstack
KB_API_URL=https://your-bookstack-instance.com/api
KB_API_KEY=your-bookstack-api-token
```

**Features:**
- Hierarchical organization
- WYSIWYG editor
- Role-based permissions
- Full-text search
- API access

---

### 3. Custom API

**What it is:** Custom knowledge base API endpoint

**Setup:**
1. Deploy your own knowledge base API
2. Implement required endpoints
3. Configure API endpoint

**Configuration:**
```javascript
knowledgeBase: {
  provider: 'api',
  apiUrl: 'https://your-kb-api.com',
  apiKey: 'your-api-key',
}
```

**Required API Endpoints:**
- `POST /knowledge/store` - Store knowledge
- `POST /knowledge/retrieve` - Retrieve knowledge
- `POST /knowledge/search` - Search knowledge
- `POST /knowledge/context` - Get context guide

---

## Use Cases

### 1. Pattern Knowledge Storage

Store information about signal patterns:
- Pattern descriptions
- Interpretation guidelines
- Common contexts
- False positive indicators

**Example:**
```javascript
await knowledgeBase.storePatternKnowledge({
  type: 'pattern_knowledge',
  patternType: 'abrupt_stop',
  category: 'movement',
  description: 'Sudden deceleration detected in officer movement',
  interpretation: 'May indicate officer responding to situation',
  commonContexts: ['traffic_stop', 'checkpoint'],
  falsePositiveIndicators: ['GPS signal loss', 'vehicle stop'],
});
```

### 2. False Positive Learning

Store false positive patterns for future reference:
- Pattern characteristics
- Reasons for false positive
- Context information

**Example:**
```javascript
await signalValidation.recordFalsePositive(
  signal,
  'GPS signal loss caused false movement anomaly',
  { operationalContext: 'routine' }
);
```

### 3. Historical Pattern Insights

Store insights from historical pattern analysis:
- Pattern trends
- Context-specific patterns
- Officer-specific patterns

**Example:**
```javascript
await knowledgeBase.storeHistoricalInsight({
  patternType: 'speech_rate_deviation',
  category: 'audio',
  insight: 'Speech rate deviations are more common during traffic stops',
  context: { operationalContext: 'traffic_stop' },
  metadata: { frequency: 'high', confidence: 0.85 },
});
```

### 4. Operational Context Guides

Retrieve context-specific guides for supervisors:
- Expected patterns
- Typical durations
- Common signals

**Example:**
```javascript
const guide = await knowledgeBase.getOperationalContextGuide('traffic_stop');
// Returns: { expectedPatterns: [...], typicalDuration: '5-15 minutes', ... }
```

---

## Integration Points

### Signal Validation

The knowledge base integrates with signal validation:
- Stores false positive patterns
- Retrieves pattern knowledge for validation
- Provides context guides

### Signal Analysis

The knowledge base can enhance signal analysis:
- Provides historical context
- Offers pattern interpretation
- Suggests validation checks

### Supervisor Dashboard

The knowledge base can support supervisors:
- Provides pattern explanations
- Offers context guides
- Shows historical patterns

---

## Configuration

### Method 1: Environment Variables

```bash
KB_PROVIDER=wikijs
KB_API_URL=https://your-wikijs-instance.com/api/v1
KB_API_KEY=your-api-key
```

### Method 2: Client Config

```javascript
export default {
  knowledgeBase: {
    provider: 'wikijs',
    apiUrl: 'https://your-wikijs-instance.com/api/v1',
    apiKey: 'your-api-key',
  },
  // ... other config
};
```

### Method 3: Runtime Initialization

```javascript
import knowledgeBase from './services/knowledgeBase';

knowledgeBase.initialize(
  'wikijs',
  'https://your-wikijs-instance.com/api/v1',
  'your-api-key'
);
```

---

## Knowledge Structure

### Pattern Knowledge

```json
{
  "type": "pattern_knowledge",
  "patternType": "abrupt_stop",
  "category": "movement",
  "description": "Pattern description",
  "interpretation": "How to interpret this pattern",
  "commonContexts": ["traffic_stop", "checkpoint"],
  "falsePositiveIndicators": ["GPS loss", "vehicle stop"],
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### False Positive Pattern

```json
{
  "type": "false_positive",
  "signalCategory": "abrupt_stop",
  "pattern": {
    "confidence": 0.75,
    "indicators": ["high_deceleration"],
    "context": {}
  },
  "reason": "GPS signal loss",
  "context": {
    "operationalContext": "routine"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Historical Insight

```json
{
  "type": "historical_insight",
  "patternType": "speech_rate_deviation",
  "category": "audio",
  "insight": "Pattern insight description",
  "context": {
    "operationalContext": "traffic_stop"
  },
  "metadata": {
    "frequency": "high",
    "confidence": 0.85
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## Privacy & Security

- **Self-Hosted:** All knowledge bases can be self-hosted
- **Access Control:** Use knowledge base access controls
- **API Keys:** Secure API key storage
- **Data Privacy:** Knowledge stays within your infrastructure
- **Audit Logging:** Track knowledge base access

---

## Benefits

### For System Accuracy
- Learn from false positives
- Improve pattern recognition
- Historical context for signals
- Better validation

### For Supervisors
- Pattern explanations
- Context guides
- Training materials
- Historical insights

### For System Improvement
- Pattern documentation
- Knowledge accumulation
- Continuous learning
- Better accuracy over time

---

## Next Steps

1. **Choose Knowledge Base Provider** (recommend Wiki.js or BookStack)
2. **Deploy Knowledge Base** (self-hosted recommended)
3. **Configure API Access** (create API keys)
4. **Set Environment Variables** (or client config)
5. **Test Integration** (store and retrieve knowledge)
6. **Populate Knowledge Base** (add pattern knowledge, context guides)
7. **Monitor Usage** (track knowledge base access)

---

## Resources

- [Wiki.js Documentation](https://docs.requarks.io/)
- [BookStack Documentation](https://www.bookstackapp.com/docs/)
- [OpenApps.pro - Knowledge Management](https://openapps.pro/category/open-source-apps-for-knowledge-management)
- [Logseq Documentation](https://docs.logseq.com/)
- [Joplin Documentation](https://joplinapp.org/help/)

---

## Notes

- Knowledge base integration is **optional** - system works without it
- Local knowledge fallback is always available
- Caching improves performance
- Can be enabled/disabled at any time
- Supports multiple knowledge base providers
