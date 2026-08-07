/**
 * API Test Page - Debug real data loading
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function ApiTest() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const testApi = async () => {
    setLoading(true);
    const results: any[] = [];
    
    try {
      const baseUrl = 'http://localhost:3000/api/v1';
      
      // Test 1: Users endpoint
      try {
        const usersResponse = await fetch(`${baseUrl}/users`);
        const usersData = await usersResponse.json();
        results.push({
          endpoint: '/users',
          status: usersResponse.status,
          success: usersResponse.ok,
          data: usersData,
          count: usersData.users?.length || 0
        });
      } catch (error) {
        results.push({
          endpoint: '/users',
          status: 'ERROR',
          success: false,
          error: (error as any).message
        });
      }

      // Test 2: Problems endpoint
      try {
        const problemsResponse = await fetch(`${baseUrl}/problems`);
        const problemsData = await problemsResponse.json();
        results.push({
          endpoint: '/problems',
          status: problemsResponse.status,
          success: problemsResponse.ok,
          data: problemsData,
          count: problemsData.problems?.length || 0
        });
      } catch (error) {
        results.push({
          endpoint: '/problems',
          status: 'ERROR',
          success: false,
          error: (error as any).message
        });
      }

      // Test 3: GovTech complaints endpoint
      try {
        const govtechResponse = await fetch(`${baseUrl}/govtech/complaints`);
        const govtechData = await govtechResponse.json();
        results.push({
          endpoint: '/govtech/complaints',
          status: govtechResponse.status,
          success: govtechResponse.ok,
          data: govtechData,
          count: govtechData.complaints?.length || 0
        });
      } catch (error) {
        results.push({
          endpoint: '/govtech/complaints',
          status: 'ERROR',
          success: false,
          error: (error as any).message
        });
      }

      setTestResults(results);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testApi();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 API Test Results</Text>
      
      <TouchableOpacity style={styles.refreshButton} onPress={testApi} disabled={loading}>
        <Text style={styles.refreshText}>
          {loading ? '🔄 Testing...' : '🔄 Refresh Tests'}
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.results}>
        {testResults.map((result, index) => (
          <View key={index} style={[styles.resultCard, result.success ? styles.success : styles.error]}>
            <Text style={styles.endpoint}>{result.endpoint}</Text>
            <Text style={styles.status}>Status: {result.status}</Text>
            {result.success ? (
              <>
                <Text style={styles.count}>✅ Count: {result.count}</Text>
                {result.data && (
                  <Text style={styles.preview} numberOfLines={3}>
                    Preview: {JSON.stringify(result.data).substring(0, 200)}...
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.errorText}>❌ Error: {result.error || 'Failed'}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#1E40AF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  refreshText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  results: {
    flex: 1,
  },
  resultCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  success: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  error: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  endpoint: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    marginBottom: 4,
  },
  count: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: 'bold',
  },
  preview: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
  },
});