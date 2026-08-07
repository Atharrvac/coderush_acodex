# 🤝 "I Can Help" System - Industry-Grade Algorithm

## Overview
Smart matching system that connects helpers with problems in real-time, similar to Uber's driver-rider matching.

---

## 🎯 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER POSTS PROBLEM                    │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              SMART MATCHING ENGINE                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  1. Find Nearby Helpers (5km radius)             │  │
│  │  2. Check Helper Availability                     │  │
│  │  3. Calculate Match Score                         │  │
│  │  4. Rank by Score                                 │  │
│  │  5. Send Push Notifications                       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              HELPER RESPONDS                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │  • "I Can Help" (Accept)                         │  │
│  │  • "Not Now" (Decline)                           │  │
│  │  • Timeout (30 seconds)                          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              ASSIGNMENT LOGIC                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │  • First to accept gets assigned                 │  │
│  │  • Others get "Already being helped" message     │  │
│  │  • Problem status → "being_helped"               │  │
│  │  • Real-time updates to all parties              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              TRACKING & COMPLETION                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  • Helper can message poster                     │  │
│  │  • Helper can call poster                        │  │
│  │  • Helper marks as solved                        │  │
│  │  • Poster confirms solution                      │  │
│  │  • Both earn points & achievements               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🧮 Smart Matching Algorithm

### Match Score Calculation:
```typescript
match_score = 
  (distance_score * 0.3) +      // 30% weight
  (skill_score * 0.25) +         // 25% weight
  (reputation_score * 0.20) +    // 20% weight
  (availability_score * 0.15) +  // 15% weight
  (response_time_score * 0.10)   // 10% weight

Where each score is 0-100
```

### 1. Distance Score (30% weight)
```typescript
distance_score = Math.max(0, 100 - (distance_km * 20))

Examples:
- 0.5 km → 90 points
- 1 km → 80 points
- 2 km → 60 points
- 5 km → 0 points
```

### 2. Skill Score (25% weight)
```typescript
skill_score = has_relevant_skill ? 100 : 50

Skills matched by:
- Problem category (road → civil engineer)
- Past solved problems in same category
- User-declared skills
- Verified expertise
```

### 3. Reputation Score (20% weight)
```typescript
reputation_score = (
  (problems_solved * 10) +
  (success_rate * 50) +
  (avg_rating * 10)
) / 3

Examples:
- 10 solved, 90% success, 4.5 rating → 85 points
- 5 solved, 100% success, 5.0 rating → 83 points
- 20 solved, 80% success, 4.0 rating → 80 points
```

### 4. Availability Score (15% weight)
```typescript
availability_score = 
  is_online ? 100 :
  last_active < 5_min ? 80 :
  last_active < 30_min ? 60 :
  last_active < 1_hour ? 40 :
  20

Real-time presence tracking
```

### 5. Response Time Score (10% weight)
```typescript
response_time_score = Math.max(0, 100 - (avg_response_minutes * 5))

Examples:
- 2 min avg → 90 points
- 5 min avg → 75 points
- 10 min avg → 50 points
- 20 min avg → 0 points
```

---

## 🔄 Real-Time Workflow

### Phase 1: Problem Posted
```typescript
1. User posts problem
2. System calculates problem urgency
3. Determines search radius (1-10km based on urgency)
4. Finds potential helpers in radius
5. Calculates match scores
6. Ranks helpers by score
7. Sends notifications to top 10 helpers
```

### Phase 2: Helper Notification
```typescript
Notification includes:
- Problem title & category
- Distance from helper
- Estimated time to reach
- Problem urgency
- Potential points to earn
- "I Can Help" button
- 30 second countdown timer
```

### Phase 3: Helper Response
```typescript
Scenario A: Helper Accepts
├─ Check if problem still available
├─ If yes: Assign helper, notify poster
├─ If no: Show "Already being helped"
└─ Update all other helpers

Scenario B: Helper Declines
├─ Remove from current batch
├─ Send to next batch of helpers
└─ Track decline reason (optional)

Scenario C: Timeout (30s)
├─ Auto-decline
├─ Send to next batch
└─ Reduce availability score
```

### Phase 4: Assignment
```typescript
1. First helper to accept gets assigned
2. Problem status → "being_helped"
3. Helper info added to problem
4. Poster gets notification with helper details
5. Helper gets poster contact info
6. Real-time chat/call enabled
7. Other helpers notified "Already assigned"
8. Points awarded to helper (+50)
```

### Phase 5: Tracking
```typescript
Real-time updates:
├─ Helper location (optional)
├─ Status updates
├─ Chat messages
├─ Time elapsed
└─ ETA to completion

Helper can:
├─ Message poster
├─ Call poster
├─ Update status
├─ Upload progress photos
└─ Mark as solved
```

### Phase 6: Completion
```typescript
1. Helper marks as solved
2. Uploads "after" photo
3. Adds solution notes
4. Poster gets notification
5. Poster confirms/disputes
6. If confirmed:
   ├─ Problem status → "solved"
   ├─ Helper gets +100 points
   ├─ Poster gets +25 points
   ├─ Both earn achievements
   ├─ Ratings exchanged
   └─ Success story created
```

---

## 📊 Database Schema

### Helper Availability Table
```sql
CREATE TABLE helper_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  is_available BOOLEAN DEFAULT true,
  last_active TIMESTAMP DEFAULT NOW(),
  current_location GEOGRAPHY(POINT),
  max_distance_km INTEGER DEFAULT 5,
  preferred_categories TEXT[],
  busy_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_helper_availability_location ON helper_availability USING GIST(current_location);
CREATE INDEX idx_helper_availability_user ON helper_availability(user_id);
CREATE INDEX idx_helper_availability_active ON helper_availability(is_available, last_active);
```

### Help Requests Table
```sql
CREATE TABLE help_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID REFERENCES problems(id),
  helper_id UUID REFERENCES users(id),
  status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'declined', 'timeout', 'cancelled')),
  match_score DECIMAL(5,2),
  notified_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  response_time_seconds INTEGER,
  decline_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_help_requests_problem ON help_requests(problem_id, status);
CREATE INDEX idx_help_requests_helper ON help_requests(helper_id, status);
CREATE INDEX idx_help_requests_status ON help_requests(status, notified_at);
```

### Helper Stats Table
```sql
CREATE TABLE helper_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id),
  total_requests_received INTEGER DEFAULT 0,
  total_accepted INTEGER DEFAULT 0,
  total_declined INTEGER DEFAULT 0,
  total_timeout INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  avg_response_time_seconds INTEGER DEFAULT 0,
  avg_completion_time_hours DECIMAL(10,2) DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  last_helped_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_helper_stats_user ON helper_stats(user_id);
CREATE INDEX idx_helper_stats_rating ON helper_stats(avg_rating DESC);
```

### Ratings Table
```sql
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID REFERENCES problems(id),
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  helpful_tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ratings_to_user ON ratings(to_user_id);
CREATE INDEX idx_ratings_problem ON ratings(problem_id);
```

---

## 🚀 Implementation

### 1. Matching Service
```typescript
// matchingService.ts
export const matchingService = {
  // Find and notify helpers
  findHelpers: async (problemId: string) => {
    const problem = await getProblem(problemId);
    
    // 1. Determine search radius based on urgency
    const radius = getSearchRadius(problem.urgency);
    
    // 2. Find nearby available helpers
    const helpers = await findNearbyHelpers(
      problem.latitude,
      problem.longitude,
      radius
    );
    
    // 3. Calculate match scores
    const scoredHelpers = await Promise.all(
      helpers.map(helper => calculateMatchScore(helper, problem))
    );
    
    // 4. Sort by score
    scoredHelpers.sort((a, b) => b.score - a.score);
    
    // 5. Send notifications to top 10
    const topHelpers = scoredHelpers.slice(0, 10);
    await notifyHelpers(topHelpers, problem);
    
    // 6. Create help requests
    await createHelpRequests(topHelpers, problem);
    
    return topHelpers;
  },
  
  // Calculate match score
  calculateMatchScore: async (helper, problem) => {
    const distance = calculateDistance(
      helper.location,
      problem.location
    );
    
    const distanceScore = Math.max(0, 100 - (distance * 20));
    const skillScore = hasRelevantSkill(helper, problem) ? 100 : 50;
    const reputationScore = calculateReputation(helper);
    const availabilityScore = calculateAvailability(helper);
    const responseTimeScore = calculateResponseTime(helper);
    
    const matchScore = 
      (distanceScore * 0.3) +
      (skillScore * 0.25) +
      (reputationScore * 0.2) +
      (availabilityScore * 0.15) +
      (responseTimeScore * 0.1);
    
    return {
      helper,
      score: matchScore,
      breakdown: {
        distance: distanceScore,
        skill: skillScore,
        reputation: reputationScore,
        availability: availabilityScore,
        responseTime: responseTimeScore,
      }
    };
  },
  
  // Handle helper response
  handleResponse: async (requestId, response) => {
    const request = await getHelpRequest(requestId);
    
    if (response === 'accept') {
      // Check if still available
      const problem = await getProblem(request.problem_id);
      
      if (problem.status === 'posted') {
        // Assign helper
        await assignHelper(problem.id, request.helper_id);
        
        // Update request
        await updateHelpRequest(requestId, {
          status: 'accepted',
          responded_at: new Date(),
        });
        
        // Notify poster
        await notifyPoster(problem, request.helper_id);
        
        // Notify other helpers
        await notifyOtherHelpers(problem.id, request.helper_id);
        
        // Award points
        await awardPoints(request.helper_id, 50, 'Started helping');
        
        return { success: true, assigned: true };
      } else {
        return { success: false, reason: 'Already assigned' };
      }
    } else {
      // Decline
      await updateHelpRequest(requestId, {
        status: 'declined',
        responded_at: new Date(),
      });
      
      // Send to next batch
      await sendToNextBatch(request.problem_id);
      
      return { success: true, assigned: false };
    }
  },
};
```

### 2. Real-Time Notifications
```typescript
// notificationService.ts
export const notificationService = {
  // Send push notification to helper
  notifyHelper: async (helper, problem, matchScore) => {
    const notification = {
      title: '🆘 Someone needs your help!',
      body: `${problem.title} - ${formatDistance(matchScore.distance)}km away`,
      data: {
        type: 'help_request',
        problem_id: problem.id,
        match_score: matchScore.score,
        distance: matchScore.distance,
        points: 150, // 50 + 100 if solved
        urgency: problem.urgency,
      },
      actions: [
        { id: 'accept', title: 'I Can Help' },
        { id: 'decline', title: 'Not Now' },
      ],
      timeout: 30000, // 30 seconds
    };
    
    await sendPushNotification(helper.id, notification);
    
    // Also send in-app notification
    await createInAppNotification(helper.id, notification);
  },
  
  // Notify poster that helper is coming
  notifyPoster: async (problem, helper) => {
    const notification = {
      title: '🎉 Help is on the way!',
      body: `${helper.name} is coming to help with your problem`,
      data: {
        type: 'helper_assigned',
        problem_id: problem.id,
        helper_id: helper.id,
        helper_name: helper.name,
        helper_phone: helper.phone,
        helper_rating: helper.avg_rating,
      },
    };
    
    await sendPushNotification(problem.user_id, notification);
  },
  
  // Real-time status updates
  sendStatusUpdate: async (problemId, status, message) => {
    // Use Supabase real-time
    await supabase
      .channel(`problem:${problemId}`)
      .send({
        type: 'broadcast',
        event: 'status_update',
        payload: { status, message, timestamp: new Date() },
      });
  },
};
```

### 3. Availability Tracking
```typescript
// availabilityService.ts
export const availabilityService = {
  // Update helper availability
  updateAvailability: async (userId, isAvailable) => {
    await supabase
      .from('helper_availability')
      .upsert({
        user_id: userId,
        is_available: isAvailable,
        last_active: new Date(),
      });
  },
  
  // Update location
  updateLocation: async (userId, latitude, longitude) => {
    await supabase
      .from('helper_availability')
      .upsert({
        user_id: userId,
        current_location: `POINT(${longitude} ${latitude})`,
        last_active: new Date(),
      });
  },
  
  // Track presence
  trackPresence: async (userId) => {
    const channel = supabase.channel('online-users');
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Update availability based on presence
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId, online_at: new Date() });
        }
      });
  },
};
```

---

## 📱 Mobile UI Flow

### Helper Notification Screen:
```
┌─────────────────────────────────┐
│  🆘 HELP REQUEST                │
├─────────────────────────────────┤
│  Pothole on MG Road             │
│  📍 1.2 km away                 │
│  ⏱️ ~5 min to reach             │
│  🔥 High urgency                │
│  ⭐ Earn 150 points             │
├─────────────────────────────────┤
│  [Photo of problem]             │
├─────────────────────────────────┤
│  ⏰ Respond in: 00:28           │
├─────────────────────────────────┤
│  ┌─────────────┐ ┌────────────┐│
│  │ I Can Help  │ │  Not Now   ││
│  │   (Accept)  │ │ (Decline)  ││
│  └─────────────┘ └────────────┘│
└─────────────────────────────────┘
```

### Helping Screen:
```
┌─────────────────────────────────┐
│  🤝 HELPING NOW                 │
├─────────────────────────────────┤
│  Pothole on MG Road             │
│  Status: In Progress            │
│  Time: 15 minutes               │
├─────────────────────────────────┤
│  📞 Contact Poster              │
│  💬 Send Message                │
│  📸 Upload Progress Photo       │
│  ✅ Mark as Solved              │
└─────────────────────────────────┘
```

---

## 🎯 Success Metrics

### Track:
- Average response time
- Acceptance rate
- Completion rate
- Time to solve
- Helper ratings
- Poster satisfaction

### Goals:
- <5 min response time
- >60% acceptance rate
- >80% completion rate
- <2 hours to solve
- >4.0 average rating

---

**This is production-grade matching like Uber/Swiggy!** 🚀
