# 🏛️ Complete GovTech CRM Code Package

## 📦 All Remaining Files Organized

This document contains ALL the code you need to complete the GovTech upgrade.
Copy each section to the specified file path.

---

## 1️⃣ Backend - Department Controller

**File:** `backend/src/controllers/department.controller.js`

```javascript
const { supabase } = require('../config/supabase');

exports.getAllDepartments = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    res.json({ success: true, departments: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDepartmentStats = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('department_stats')
      .select('*');

    if (error) throw error;
    res.json({ success: true, stats: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## 2️⃣ Backend - Officer Controller

**File:** `backend/src/controllers/officer.controller.js`

```javascript
const { supabase } = require('../config/supabase');

exports.getOfficerDashboard = async (req, res) => {
  try {
    const officerId = req.officer.id;

    const { data: complaints } = await supabase
      .from('problems')
      .select('*, user:users(*)')
      .eq('assigned_officer_id', officerId)
      .order('created_at', { ascending: false });

    const { data: stats } = await supabase
      .from('officer_performance')
      .select('*')
      .eq('id', officerId)
      .single();

    res.json({ success: true, complaints, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, resolution_images } = req.body;
    const officerId = req.officer.id;

    const { data, error } = await supabase
      .from('problems')
      .update({
        complaint_status: status,
        resolution_notes: notes,
        resolution_images,
        resolved_by: status === 'resolved' ? officerId : null,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null
      })
      .eq('id', id)
      .eq('assigned_officer_id', officerId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, complaint: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## 3️⃣ Backend - Analytics Controller

**File:** `backend/src/controllers/analytics.controller.js`

```javascript
const { supabase } = require('../config/supabase');

exports.getAnalytics = async (req, res) => {
  try {
    // Complaints by category
    const { data: byCategory } = await supabase
      .from('problems')
      .select('category')
      .then(({ data }) => {
        const counts = {};
        data.forEach(p => {
          counts[p.category] = (counts[p.category] || 0) + 1;
        });
        return { data: Object.entries(counts).map(([name, value]) => ({ name, value })) };
      });

    // Complaints by status
    const { data: byStatus } = await supabase
      .from('problems')
      .select('complaint_status')
      .then(({ data }) => {
        const counts = {};
        data.forEach(p => {
          counts[p.complaint_status] = (counts[p.complaint_status] || 0) + 1;
        });
        return { data: Object.entries(counts).map(([name, value]) => ({ name, value })) };
      });

    // Department stats
    const { data: deptStats } = await supabase
      .from('department_stats')
      .select('*');

    res.json({
      success: true,
      analytics: {
        byCategory,
        byStatus,
        departments: deptStats
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## 4️⃣ Backend - Routes

**File:** `backend/src/routes/govtech.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaint.controller');
const departmentController = require('../controllers/department.controller');
const officerController = require('../controllers/officer.controller');
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth');

// Complaint routes
router.post('/complaints', authenticate, complaintController.createComplaint);
router.get('/complaints/tracking/:id', authenticate, complaintController.getComplaintTracking);
router.get('/complaints/user', authenticate, complaintController.getUserComplaints);

// Department routes
router.get('/departments', departmentController.getAllDepartments);
router.get('/departments/stats', departmentController.getDepartmentStats);

// Officer routes (requires officer auth)
router.get('/officer/dashboard', authenticate, officerController.getOfficerDashboard);
router.put('/officer/complaints/:id', authenticate, officerController.updateComplaintStatus);

// Analytics routes
router.get('/analytics', analyticsController.getAnalytics);

module.exports = router;
```

---

## 5️⃣ Mobile - Language Selector Component

**File:** `mobile/src/components/LanguageSelector.tsx`

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' }
];

interface LanguageSelectorProps {
  selected: string;
  onSelect: (code: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selected, onSelect }) => {
  return (
    <View style={styles.container}>
      {LANGUAGES.map((lang) => (
        <TouchableOpacity
          key={lang.code}
          style={[
            styles.languageButton,
            selected === lang.code && styles.selectedButton
          ]}
          onPress={() => onSelect(lang.code)}
        >
          <Text style={styles.flag}>{lang.flag}</Text>
          <Text style={[
            styles.languageName,
            selected === lang.code && styles.selectedText
          ]}>
            {lang.nativeName}
          </Text>
          {selected === lang.code && (
            <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  languageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedButton: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16A34A',
  },
  flag: {
    fontSize: 20,
    marginRight: 6,
  },
  languageName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 4,
  },
  selectedText: {
    color: '#16A34A',
  },
});
```

---

## 6️⃣ Mobile - Complaint Timeline Component

**File:** `mobile/src/components/ComplaintTimeline.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TimelineItem {
  status: string;
  timestamp: string;
  notes?: string;
}

interface ComplaintTimelineProps {
  history: TimelineItem[];
}

const STATUS_CONFIG = {
  submitted: { icon: 'paper-plane', color: '#F59E0B', label: 'Submitted' },
  assigned: { icon: 'person-add', color: '#3B82F6', label: 'Assigned' },
  in_progress: { icon: 'construct', color: '#8B5CF6', label: 'In Progress' },
  resolved: { icon: 'checkmark-circle', color: '#10B981', label: 'Resolved' },
  rejected: { icon: 'close-circle', color: '#EF4444', label: 'Rejected' },
};

export const ComplaintTimeline: React.FC<ComplaintTimelineProps> = ({ history }) => {
  return (
    <View style={styles.container}>
      {history.map((item, index) => {
        const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.submitted;
        const isLast = index === history.length - 1;

        return (
          <View key={index} style={styles.timelineItem}>
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: config.color }]}>
                <Ionicons name={config.icon as any} size={20} color="#FFFFFF" />
              </View>
              {!isLast && <View style={styles.connector} />}
            </View>
            <View style={styles.content}>
              <Text style={styles.label}>{config.label}</Text>
              <Text style={styles.timestamp}>
                {new Date(item.timestamp).toLocaleString()}
              </Text>
              {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  notes: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
  },
});
```

---

## 7️⃣ Mobile - Translation Service

**File:** `mobile/src/services/translation.service.ts`

```typescript
import api from '../config/api';

export const translationService = {
  async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
    try {
      const response = await api.post('/translate', {
        text,
        source_lang: sourceLang,
        target_lang: targetLang
      });
      return response.data.translated_text;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original on error
    }
  },

  async detectLanguage(text: string): Promise<string> {
    try {
      const response = await api.post('/translate/detect', { text });
      return response.data.language_code;
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en';
    }
  }
};
```

---

## 8️⃣ Officer Dashboard - Package.json

**File:** `officer-dashboard/package.json`

```json
{
  "name": "nagrikseva-officer-dashboard",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@supabase/supabase-js": "^2.39.0",
    "recharts": "^2.10.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "axios": "^1.6.5"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

---

## 🎯 Next Steps

1. **Apply database migration** in Supabase
2. **Add Grok API key** to backend/.env
3. **Create all files** from this document
4. **Install dependencies**
5. **Test each module**
6. **Prepare demo**

## 📊 Testing Checklist

- [ ] Submit complaint in Hindi
- [ ] Verify auto-translation to English
- [ ] Check department auto-assignment
- [ ] Test officer dashboard
- [ ] Verify real-time updates
- [ ] Test analytics charts
- [ ] Check map markers
- [ ] Test notifications

---

**Continue to next document for Officer Dashboard UI code...**
