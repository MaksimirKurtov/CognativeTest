import * as SQLite from 'expo-sqlite';
import { TestSession, UserProfile, QuestionnaireResponse } from '@/types';

let db: SQLite.SQLiteDatabase | null = null;

export async function initializeDatabase() {
  try {
    db = await SQLite.openDatabaseAsync('cognitive_test.db');
    
    // Create tables
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_profile (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        cigarettes_per_day INTEGER,
        years_smoking INTEGER,
        quit_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS test_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        status TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user_profile (id)
      );
      
      CREATE TABLE IF NOT EXISTS test_results (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        test_type TEXT NOT NULL,
        score REAL NOT NULL,
        reaction_times TEXT,
        accuracy REAL,
        completed_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES test_sessions (id)
      );
      
      CREATE TABLE IF NOT EXISTS questionnaire_responses (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        sleep_hours REAL,
        sleep_quality INTEGER,
        mood INTEGER,
        motivation INTEGER,
        anxiety INTEGER,
        mental_clarity INTEGER,
        energy INTEGER,
        cravings INTEGER,
        stress INTEGER,
        caffeine_today INTEGER,
        exercise_today INTEGER,
        sick_today INTEGER,
        marijuana_last24h INTEGER,
        completed_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES test_sessions (id)
      );
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  
  try {
    await db.runAsync(
      `INSERT OR REPLACE INTO user_profile 
       (id, name, cigarettes_per_day, years_smoking, quit_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        profile.id,
        profile.name,
        profile.smokingHistory.cigarettesPerDay,
        profile.smokingHistory.yearsSmoking,
        profile.smokingHistory.quitDate?.toISOString(),
        profile.createdAt.toISOString(),
        profile.updatedAt.toISOString()
      ]
    );
  } catch (error) {
    console.error('Failed to save user profile:', error);
    throw error;
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  if (!db) throw new Error('Database not initialized');
  
  try {
    const result = await db.getFirstAsync<any>(
      'SELECT * FROM user_profile LIMIT 1'
    );
    
    if (!result) return null;
    
    return {
      id: result.id,
      name: result.name,
      smokingHistory: {
        cigarettesPerDay: result.cigarettes_per_day,
        yearsSmoking: result.years_smoking,
        quitDate: result.quit_date ? new Date(result.quit_date) : undefined,
      },
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
    };
  } catch (error) {
    console.error('Failed to get user profile:', error);
    throw error;
  }
}

export async function saveTestSession(session: TestSession): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  
  try {
    await db.runAsync(
      `INSERT OR REPLACE INTO test_sessions 
       (id, user_id, started_at, completed_at, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        session.id,
        session.userId,
        session.startedAt.toISOString(),
        session.completedAt?.toISOString(),
        session.status
      ]
    );
    
    // Save test results
    for (const test of session.tests) {
      await db.runAsync(
        `INSERT OR REPLACE INTO test_results 
         (id, session_id, test_type, score, reaction_times, accuracy, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          `${session.id}-${test.testType}`,
          session.id,
          test.testType,
          test.score,
          test.reactionTimes ? JSON.stringify(test.reactionTimes) : null,
          test.accuracy,
          test.completedAt.toISOString()
        ]
      );
    }
    
    // Save questionnaire if exists
    if (session.questionnaire) {
      await db.runAsync(
        `INSERT OR REPLACE INTO questionnaire_responses 
         (id, session_id, sleep_hours, sleep_quality, mood, motivation, anxiety, 
          mental_clarity, energy, cravings, stress, caffeine_today, exercise_today, 
          sick_today, marijuana_last24h, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `${session.id}-questionnaire`,
          session.id,
          session.questionnaire.sleepHours,
          session.questionnaire.sleepQuality,
          session.questionnaire.mood,
          session.questionnaire.motivation,
          session.questionnaire.anxiety,
          session.questionnaire.mentalClarity,
          session.questionnaire.energy,
          session.questionnaire.cravings,
          session.questionnaire.stress,
          session.questionnaire.caffeineToday ? 1 : 0,
          session.questionnaire.exerciseToday ? 1 : 0,
          session.questionnaire.sickToday ? 1 : 0,
          session.questionnaire.marijuanaLast24h ? 1 : 0,
          session.questionnaire.completedAt.toISOString()
        ]
      );
    }
  } catch (error) {
    console.error('Failed to save test session:', error);
    throw error;
  }
}

export async function getTestSessions(userId: string): Promise<TestSession[]> {
  if (!db) throw new Error('Database not initialized');
  
  try {
    const sessions = await db.getAllAsync<any>(
      'SELECT * FROM test_sessions WHERE user_id = ? ORDER BY started_at DESC',
      [userId]
    );
    
    const result: TestSession[] = [];
    
    for (const sessionRow of sessions) {
      const testResults = await db.getAllAsync<any>(
        'SELECT * FROM test_results WHERE session_id = ?',
        [sessionRow.id]
      );
      
      const questionnaireRow = await db.getFirstAsync<any>(
        'SELECT * FROM questionnaire_responses WHERE session_id = ?',
        [sessionRow.id]
      );
      
      const session: TestSession = {
        id: sessionRow.id,
        userId: sessionRow.user_id,
        startedAt: new Date(sessionRow.started_at),
        completedAt: sessionRow.completed_at ? new Date(sessionRow.completed_at) : undefined,
        status: sessionRow.status,
        tests: testResults.map(test => ({
          testType: test.test_type,
          score: test.score,
          reactionTimes: test.reaction_times ? JSON.parse(test.reaction_times) : undefined,
          accuracy: test.accuracy,
          completedAt: new Date(test.completed_at),
        })),
        questionnaire: questionnaireRow ? {
          sleepHours: questionnaireRow.sleep_hours,
          sleepQuality: questionnaireRow.sleep_quality,
          mood: questionnaireRow.mood,
          motivation: questionnaireRow.motivation,
          anxiety: questionnaireRow.anxiety,
          mentalClarity: questionnaireRow.mental_clarity,
          energy: questionnaireRow.energy,
          cravings: questionnaireRow.cravings,
          stress: questionnaireRow.stress,
          caffeineToday: questionnaireRow.caffeine_today === 1,
          exerciseToday: questionnaireRow.exercise_today === 1,
          sickToday: questionnaireRow.sick_today === 1,
          marijuanaLast24h: questionnaireRow.marijuana_last24h === 1,
          completedAt: new Date(questionnaireRow.completed_at),
        } : undefined,
      };
      
      result.push(session);
    }
    
    return result;
  } catch (error) {
    console.error('Failed to get test sessions:', error);
    throw error;
  }
}
