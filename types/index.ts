// User profile types
export interface UserProfile {
  id: string;
  name: string;
  smokingHistory: {
    weeksSmoking?: number;
    frequency?: 'less_than_weekly' | 'few_times_week' | 'daily' | 'multiple_per_day';
    amountEstimate?: string; // optional free-form
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night' | 'varied';
    goal?: 'track_using' | 'preparing_to_quit' | 'already_quitting';
    quitDate?: Date;
  };
  setupComplete?: boolean;
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
  details?: Record<string, any>;
  completedAt: Date;
}

export interface QuestionnaireResponse {
  sleepHours?: number;
  sleepQuality?: number; // 1-10 scale
  wakeups?: number;
  mood?: number; // 1-10 scale
  motivation?: number; // 1-10 scale
  anxiety?: number; // 1-10 scale
  mentalClarity?: number; // 1-10 scale
  energy?: number; // 1-10 scale
  cravings?: number; // 1-10 scale
  stress?: number; // 1-10 scale
  caffeineToday?: boolean;
  exerciseToday?: boolean;
  sickToday?: boolean;
  marijuanaLast24h?: boolean;
  marijuanaUsedTime?: string; // e.g. '21:30' or ISO string
  marijuanaAmount?: string; // free-form
  marijuanaMethod?: 'joint' | 'bong' | 'vape' | 'edible' | 'other';
  notes?: string;
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
