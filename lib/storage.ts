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
        weeks_smoking INTEGER,
        frequency TEXT,
        amount_estimate TEXT,
        time_of_day TEXT,
        goal TEXT,
        setup_complete INTEGER,
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
        details TEXT,
        completed_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES test_sessions (id)
      );
      
      CREATE TABLE IF NOT EXISTS questionnaire_responses (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        sleep_hours REAL,
        sleep_quality INTEGER,
        wakeups INTEGER,
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
        marijuana_used_time TEXT,
        marijuana_amount TEXT,
        marijuana_method TEXT,
        notes TEXT,
        completed_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES test_sessions (id)
      );
    `);

    // Best-effort migrations for existing installs: add new columns if missing
    const alterStatements = [
      'ALTER TABLE user_profile ADD COLUMN weeks_smoking INTEGER',
      'ALTER TABLE user_profile ADD COLUMN frequency TEXT',
      'ALTER TABLE user_profile ADD COLUMN amount_estimate TEXT',
      'ALTER TABLE user_profile ADD COLUMN time_of_day TEXT',
      'ALTER TABLE user_profile ADD COLUMN goal TEXT',
      'ALTER TABLE user_profile ADD COLUMN setup_complete INTEGER',
      'ALTER TABLE test_results ADD COLUMN details TEXT',
      'ALTER TABLE questionnaire_responses ADD COLUMN wakeups INTEGER',
      'ALTER TABLE questionnaire_responses ADD COLUMN marijuana_used_time TEXT',
      'ALTER TABLE questionnaire_responses ADD COLUMN marijuana_amount TEXT',
      'ALTER TABLE questionnaire_responses ADD COLUMN marijuana_method TEXT',
      'ALTER TABLE questionnaire_responses ADD COLUMN notes TEXT',
    ];
    for (const stmt of alterStatements) {
      try {
        await db.execAsync(stmt);
      } catch {
        // Ignore if column already exists
      }
    }
    
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
       (id, name, cigarettes_per_day, years_smoking, quit_date, weeks_smoking, frequency, amount_estimate, time_of_day, goal, setup_complete, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profile.id,
        profile.name,
        null, // cigarettes_per_day (legacy)
        null, // years_smoking (legacy)
        profile.smokingHistory.quitDate ? profile.smokingHistory.quitDate.toISOString() : null,
        profile.smokingHistory.weeksSmoking ?? null,
        profile.smokingHistory.frequency ?? null,
        profile.smokingHistory.amountEstimate ?? null,
        profile.smokingHistory.timeOfDay ?? null,
        profile.smokingHistory.goal ?? null,
        profile.setupComplete ? 1 : 0,
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
        weeksSmoking: result.weeks_smoking ?? undefined,
        frequency: result.frequency ?? undefined,
        amountEstimate: result.amount_estimate ?? undefined,
        timeOfDay: result.time_of_day ?? undefined,
        goal: result.goal ?? undefined,
        quitDate: result.quit_date ? new Date(result.quit_date) : undefined,
      },
      setupComplete: result.setup_complete === 1,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
    };
  } catch (error) {
    console.error('Failed to get user profile:', error);
    throw error;
  }
}

export async function markSetupComplete(): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  await db.runAsync('UPDATE user_profile SET setup_complete = 1, updated_at = ? WHERE id = ?', [
    new Date().toISOString(),
    'default',
  ]);
}

export async function upsertUserProfile(partial: Partial<UserProfile>): Promise<UserProfile> {
  const existing = await getUserProfile();
  const now = new Date();
  const merged: UserProfile = {
    id: existing?.id ?? 'default',
    name: existing?.name ?? 'Me',
    smokingHistory: {
      ...existing?.smokingHistory,
      ...partial.smokingHistory,
    },
    setupComplete: partial.setupComplete ?? existing?.setupComplete ?? false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await saveUserProfile(merged);
  return merged;
}

export async function setQuitDate(date: Date): Promise<void> {
  await upsertUserProfile({ smokingHistory: { quitDate: date, goal: 'already_quitting' } });
}

export async function getLatestSession(userId: string): Promise<TestSession | null> {
  if (!db) throw new Error('Database not initialized');
  const sessionRow = await db.getFirstAsync<any>(
    'SELECT * FROM test_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT 1',
    [userId]
  );
  if (!sessionRow) return null;
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
    questionnaire: questionnaireRow
      ? {
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
        }
      : undefined,
  };
  return session;
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
        session.completedAt ? session.completedAt.toISOString() : null,
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
          test.accuracy ?? null,
          test.completedAt.toISOString()
        ]
      );
      // Update details separately to preserve back-compat on some runtimes
      if (test.details) {
        await db.runAsync(
          `UPDATE test_results SET details = ? WHERE id = ?`,
          [JSON.stringify(test.details), `${session.id}-${test.testType}`]
        );
      }
    }
    
    // Save questionnaire if exists
    if (session.questionnaire) {
      await db.runAsync(
        `INSERT OR REPLACE INTO questionnaire_responses 
         (id, session_id, sleep_hours, sleep_quality, wakeups, mood, motivation, anxiety, 
          mental_clarity, energy, cravings, stress, caffeine_today, exercise_today, 
          sick_today, marijuana_last24h, marijuana_used_time, marijuana_amount, marijuana_method, notes, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `${session.id}-questionnaire`,
          session.id,
          session.questionnaire.sleepHours ?? null,
          session.questionnaire.sleepQuality ?? null,
          session.questionnaire.wakeups ?? null,
          session.questionnaire.mood ?? null,
          session.questionnaire.motivation ?? null,
          session.questionnaire.anxiety ?? null,
          session.questionnaire.mentalClarity ?? null,
          session.questionnaire.energy ?? null,
          session.questionnaire.cravings ?? null,
          session.questionnaire.stress ?? null,
          session.questionnaire.caffeineToday ? 1 : 0,
          session.questionnaire.exerciseToday ? 1 : 0,
          session.questionnaire.sickToday ? 1 : 0,
          session.questionnaire.marijuanaLast24h ? 1 : 0,
          session.questionnaire.marijuanaUsedTime ?? null,
          session.questionnaire.marijuanaAmount ?? null,
          session.questionnaire.marijuanaMethod ?? null,
          session.questionnaire.notes ?? null,
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
          details: test.details ? JSON.parse(test.details) : undefined,
          completedAt: new Date(test.completed_at),
        })),
        questionnaire: questionnaireRow ? {
          sleepHours: questionnaireRow.sleep_hours ?? undefined,
          sleepQuality: questionnaireRow.sleep_quality ?? undefined,
          wakeups: questionnaireRow.wakeups ?? undefined,
          mood: questionnaireRow.mood,
          motivation: questionnaireRow.motivation,
          anxiety: questionnaireRow.anxiety,
          mentalClarity: questionnaireRow.mental_clarity,
          energy: questionnaireRow.energy,
          cravings: questionnaireRow.cravings,
          stress: questionnaireRow.stress ?? undefined,
          caffeineToday: questionnaireRow.caffeine_today === 1,
          exerciseToday: questionnaireRow.exercise_today === 1,
          sickToday: questionnaireRow.sick_today === 1,
          marijuanaLast24h: questionnaireRow.marijuana_last24h === 1,
          marijuanaUsedTime: questionnaireRow.marijuana_used_time ?? undefined,
          marijuanaAmount: questionnaireRow.marijuana_amount ?? undefined,
          marijuanaMethod: questionnaireRow.marijuana_method ?? undefined,
          notes: questionnaireRow.notes ?? undefined,
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

export function generateId() {
  return Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);
}

export async function beginSession(userId: string): Promise<TestSession> {
  const session: TestSession = {
    id: generateId(),
    userId,
    startedAt: new Date(),
    status: 'in_progress',
    tests: [],
  };
  await saveTestSession(session);
  return session;
}

export async function completeSession(session: TestSession, tests: TestSession['tests'], questionnaire?: QuestionnaireResponse) {
  const completed: TestSession = {
    ...session,
    status: 'completed',
    completedAt: new Date(),
    tests,
    questionnaire,
  };
  await saveTestSession(completed);
  return completed;
}

export async function getLatestResultForTest(userId: string, testType: string): Promise<{ score: number; completedAt: string } | null> {
  if (!db) throw new Error('Database not initialized');
  const row = await db.getFirstAsync<any>(
    `SELECT tr.score as score, tr.completed_at as completed_at
     FROM test_results tr
     JOIN test_sessions ts ON ts.id = tr.session_id
     WHERE ts.user_id = ? AND tr.test_type = ?
     ORDER BY tr.completed_at DESC
     LIMIT 1`,
    [userId, testType]
  );
  if (!row) return null;
  return { score: row.score, completedAt: row.completed_at };
}
