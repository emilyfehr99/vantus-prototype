# Production Deployment Checklist

**Purpose:** Complete checklist for deploying Vantus to production with a new client.

---

## Pre-Deployment

### 1. Configuration ✅
- [ ] Update `client-config.js` with client-specific values
- [ ] Set all environment variables
- [ ] Update server URLs (bridge, dashboard, admin)
- [ ] Update GPS coordinates for client jurisdiction
- [ ] Configure officer ID format
- [ ] Set department name and branding

### 2. Security ✅
- [ ] Install production libraries:
  ```bash
  npm install react-native-bcrypt expo-secure-store crypto-js
  ```
- [ ] Replace `pinSecurity.js` with production version
- [ ] Replace `videoEncryption.js` with production version
- [ ] Test PIN hashing (should use bcrypt/argon2)
- [ ] Test video encryption (should use AES-256-GCM)
- [ ] Verify secure storage works
- [ ] Remove all demo badges
- [ ] Disable demo mode in config

### 3. Database ✅
- [ ] Deploy database schema:
  ```bash
  cd bridge-server/database
  ./deploy.sh
  ```
- [ ] Verify all tables created
- [ ] Test baseline persistence
- [ ] Configure database backups
- [ ] Set up connection pooling

### 4. Integrations ✅
- [ ] Configure CAD API (if applicable)
- [ ] Configure geocoding API
- [ ] Configure roster API
- [ ] Test all API connections
- [ ] Set up API key rotation

### 5. Models ✅
- [ ] Deploy trained models to production
- [ ] Update model paths in config
- [ ] Test model inference
- [ ] Verify model accuracy

---

## Deployment

### 6. Mobile App ✅
- [ ] Build production iOS app
- [ ] Build production Android app
- [ ] Test on physical devices
- [ ] Verify all features work
- [ ] Test authentication flow
- [ ] Test calibration
- [ ] Test threat detection
- [ ] Test video recording
- [ ] Test encryption

### 7. Bridge Server ✅
- [ ] Deploy to production server
- [ ] Configure SSL/TLS certificates
- [ ] Set up monitoring
- [ ] Configure logging
- [ ] Set up error tracking
- [ ] Test Socket.io connections
- [ ] Test all API endpoints

### 8. Dashboard ✅
- [ ] Build production dashboard
- [ ] Deploy to hosting
- [ ] Configure environment variables
- [ ] Test all Socket.io events
- [ ] Test officer state updates
- [ ] Test signal display
- [ ] Test map functionality

### 9. Admin Portal ✅
- [ ] Build production admin portal
- [ ] Deploy to hosting
- [ ] Configure environment variables
- [ ] Test analytics
- [ ] Test audit logs
- [ ] Test user management

---

## Post-Deployment

### 10. Testing ✅
- [ ] End-to-end testing with real officers
- [ ] Test authentication with real badge numbers
- [ ] Test calibration with real data
- [ ] Test threat detection accuracy
- [ ] Test dispatch flow
- [ ] Test video recording and encryption
- [ ] Test dashboard updates
- [ ] Test admin portal

### 11. Monitoring ✅
- [ ] Set up application monitoring
- [ ] Set up error tracking
- [ ] Set up performance monitoring
- [ ] Configure alerts
- [ ] Set up log aggregation
- [ ] Monitor database performance
- [ ] Monitor API response times

### 12. Documentation ✅
- [ ] Update user manuals
- [ ] Create training materials
- [ ] Document client-specific configurations
- [ ] Create runbooks
- [ ] Document troubleshooting steps

---

## Go-Live

### 13. Final Checks ✅
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Backup and recovery tested
- [ ] Support team trained
- [ ] Client approval received
- [ ] Rollback plan prepared

### 14. Launch ✅
- [ ] Deploy to production
- [ ] Monitor for first 24 hours
- [ ] Collect feedback
- [ ] Address issues immediately
- [ ] Schedule 30-day review

---

## Rollback Plan

If issues occur:
1. Revert to previous version
2. Restore database backup
3. Notify client
4. Investigate root cause
5. Fix and redeploy

---

## Support

- Monitor error logs daily for first week
- Schedule daily check-ins with client
- Collect and document all issues
- Update procedures based on real-world usage
