// User profile types
export interface UserProfile {
  id: string;
  name: string;
  smokingHistory: {
    cigarettesPerDay: number;
    yearsSmoking: number;
    quitDate?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Test session types
export interface TestSession {
  id: string;
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'not_started' | 'in_progress' | 'completed';
  tests: TestResult[];
  questionnaire?: QuestionnaireResponse;
}

export interface TestResult {
  testType: 'reaction_time' | 'choice_reaction_time' | 'stroop' | 'digit_span' | 'word_recall' | 'simon_says';
  score: number;
  reactionTimes?: number[];
  accuracy?: number;
  completedAt: Date;
}

export interface QuestionnaireResponse {
  sleepHours: number;
  sleepQuality: number; // 1-10 scale
  mood: number; // 1-10 scale
  motivation: number; // 1-10 scale
  anxiety: number; // 1-10 scale
  mentalClarity: number; // 1-10 scale
  energy: number; // 1-10 scale
  cravings: number; // 1-10 scale
  stress: number; // 1-10 scale
  caffeineToday: boolean;
  exerciseToday: boolean;
  sickToday: boolean;
  marijuanaLast24h: boolean;
  completedAt: Date;
}

// Navigation types
export type RootStackParamList = {
  '(tabs)': undefined;
  modal: undefined;
  setup: undefined;
  tests: undefined;
  session: undefined;
  results: undefined;
  settings: undefined;
};

// App state types
export interface AppState {
  user: UserProfile | null;
  currentSession: TestSession | null;
  sessions: TestSession[];
  isLoading: boolean;
  error: string | null;
}
