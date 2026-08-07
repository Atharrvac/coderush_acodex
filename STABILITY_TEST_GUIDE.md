# 🧪 STABILITY TESTING GUIDE

## Quick Test Checklist

### ✅ Test 1: Normal Operation (2 minutes)
```
1. Open app
2. Check console for: "✅ Network monitor initialized"
3. Check console for: "✅ Offline queue initialized"
4. Post a problem
5. Expected: Success without errors
```

### ✅ Test 2: Offline Mode (3 minutes)
```
1. Turn OFF WiFi and Mobile Data
2. Try to post a problem
3. Expected: Alert "You're offline..."
4. Check console: "Added operation to queue: POST_PROBLEM"
5. Turn ON internet
6. Expected: Automatic posting + success
7. Check console: "Successfully processed: POST_PROBLEM"
```

### ✅ Test 3: Network Interruption (3 minutes)
```
1. Start posting a problem
2. Turn OFF internet mid-upload
3. Expected: Retry attempts in console
4. Turn ON internet
5. Expected: Upload completes
```

### ✅ Test 4: Chat Stability (2 minutes)
```
1. Open chat
2. Send message
3. Turn OFF internet
4. Send another message
5. Expected: Queued for retry
6. Turn ON internet
7. Expected: Both messages delivered
```

### ✅ Test 5: Error Messages (2 minutes)
```
1. Try invalid operation
2. Expected: User-friendly error alert
3. Check console for error type
4. Expected: Proper error classification
```

---

## Console Output Examples

### Successful Initialization
```
🚀 Initializing stability features...
✅ Network monitor initialized
✅ Offline queue initialized
```

### Network Status Change
```
Network status changed: OFFLINE
Network status changed: ONLINE
Back online, processing queue...
```

### Queue Operations
```
Added operation to queue: POST_PROBLEM
Loaded 1 queued operations
Processing queued operation: POST_PROBLEM
Successfully processed: POST_PROBLEM
```

### Retry Logic
```
Retry attempt 1/3 after 1000ms
Retry attempt 2/3 after 2000ms
Upload successful
```

### Error Handling
```
[NETWORK] Network connection issue
[ERROR LOG] {
  "type": "NETWORK",
  "message": "fetch failed",
  "retryable": true,
  "timestamp": "2026-02-20T..."
}
```

---

## What to Look For

### ✅ GOOD Signs
- No app crashes
- Clear error messages
- Automatic retries
- Queue processing
- Network status updates
- Successful recovery

### ❌ BAD Signs
- App crashes
- Confusing errors
- Lost data
- No retry attempts
- Silent failures

---

## Quick Fixes

### If Network Monitor Not Working
```typescript
// Check in mobile/app/_layout.tsx
// Should see:
networkMonitor.initialize();
```

### If Queue Not Processing
```typescript
// Check AsyncStorage permissions
// Check console for queue errors
```

### If Errors Not Showing
```typescript
// Check STABILITY_CONFIG.ERROR.SHOW_ALERTS = true
```

---

## Performance Checklist

- [ ] App starts without errors
- [ ] Network monitor initializes
- [ ] Offline queue initializes
- [ ] Operations work online
- [ ] Operations queue offline
- [ ] Queue processes when online
- [ ] Errors show user-friendly messages
- [ ] Retries work automatically
- [ ] No data loss
- [ ] No crashes

---

## Success Criteria

✅ All tests pass  
✅ No crashes  
✅ Clear error messages  
✅ Automatic recovery  
✅ Zero data loss  

**If all criteria met: Your app is ROCK SOLID!** 🎉
