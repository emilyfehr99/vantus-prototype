# Production Setup Guide

**Purpose:** Step-by-step guide for setting up production-ready security and encryption.

---

## 1. Install Production Libraries

```bash
cd vantus-app
npm install react-native-bcrypt expo-secure-store crypto-js
# OR for argon2:
npm install react-native-argon2 expo-secure-store crypto-js
```

### Alternative: Use argon2
```bash
npm install react-native-argon2 expo-secure-store crypto-js
```

---

## 2. Replace Security Files

### PIN Security
```bash
# Backup current file
cp utils/pinSecurity.js utils/pinSecurity.js.backup

# Use production version
cp utils/pinSecurityProduction.js utils/pinSecurity.js
```

### Video Encryption
```bash
# Backup current file
cp services/videoEncryption.js services/videoEncryption.js.backup

# Use production version
cp services/videoEncryptionProduction.js services/videoEncryption.js
```

---

## 3. Update Imports

### In AuthenticationScreen.js or wherever PIN hashing is used:
```javascript
// Change from:
import { hashPIN, verifyPIN } from '../utils/pinSecurity';

// To (if using production version):
import { hashPIN, verifyPIN } from '../utils/pinSecurity';
// (Same import, but now uses bcrypt/argon2)
```

### In videoBuffer.js:
```javascript
// Already imports videoEncryption, no changes needed
// But ensure it's using the production version
import videoEncryption from './videoEncryption';
```

---

## 4. Configure Secure Storage

Secure storage is automatically used in the production versions. No additional configuration needed.

### Verify Secure Storage Works:
```javascript
import * as SecureStore from 'expo-secure-store';

// Test
await SecureStore.setItemAsync('test_key', 'test_value');
const value = await SecureStore.getItemAsync('test_key');
console.log('Secure storage works:', value === 'test_value');
```

---

## 5. Test Production Security

### Test PIN Hashing:
```javascript
import { hashPIN, verifyPIN, getHashingMethod } from './utils/pinSecurity';

// Hash a PIN
const { hash, salt } = await hashPIN('1234');
console.log('Hashing method:', getHashingMethod()); // Should be 'bcrypt' or 'argon2'
console.log('Hash:', hash);

// Verify PIN
const isValid = await verifyPIN('1234', hash, salt);
console.log('PIN valid:', isValid);
```

### Test Video Encryption:
```javascript
import videoEncryption from './services/videoEncryption';

// Encrypt video
const result = await videoEncryption.encryptVideo('file://path/to/video.mp4');
console.log('Encrypted:', result.encryptedUri);
console.log('Key ID:', result.keyId);

// Decrypt video
const decrypted = await videoEncryption.decryptVideo(
  result.encryptedUri,
  result.keyId,
  result.iv,
  result.tag
);
console.log('Decrypted:', decrypted);
```

---

## 6. Environment Variables

Create `.env` file (do not commit to git):

```bash
# Roster API
ROSTER_API_URL=https://api.client.com/roster
ROSTER_API_KEY=your-api-key

# CAD Integration
CAD_API_URL=https://api.client.com/cad
CAD_API_KEY=your-cad-api-key

# Geocoding
GEOCODING_API_KEY=your-geocoding-api-key

# Database
BASELINE_DB_URL=postgresql://user:pass@host:5432/vantus
```

---

## 7. Build for Production

### iOS:
```bash
npm run ios -- --configuration Release
```

### Android:
```bash
npm run android -- --variant release
```

---

## 8. Security Checklist

- [ ] Production libraries installed (bcrypt/argon2, crypto-js, expo-secure-store)
- [ ] Production security files in use
- [ ] Secure storage tested and working
- [ ] PIN hashing uses bcrypt/argon2 (not SHA-256)
- [ ] Video encryption uses AES-256-GCM (not XOR)
- [ ] Encryption keys stored in secure storage
- [ ] Environment variables set (not hardcoded)
- [ ] API keys in environment variables
- [ ] No demo badges in production build
- [ ] Database schema deployed
- [ ] Baseline persistence using database

---

## Troubleshooting

### "Module not found: react-native-bcrypt"
- Run: `npm install react-native-bcrypt`
- For iOS: `cd ios && pod install`
- Rebuild the app

### "SecureStore is not available"
- Ensure you're using Expo SDK 49+
- For bare React Native, install `expo-secure-store` separately

### "crypto-js not found"
- Run: `npm install crypto-js`
- Ensure it's imported correctly

---

## Notes

- Production versions automatically detect available libraries
- Falls back to basic implementation if libraries not installed
- Always test in staging before production deployment
- Keep backups of original files
