
export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
}

export enum Subject {
  CHINESE = '语文',
  MATH = '数学',
  ENGLISH = '英语',
  PHYSICS = '物理',
  CHEMISTRY = '化学',
  HISTORY = '历史',
  GEOGRAPHY = '地理',
  BIOLOGY = '生物',
}

export type SubjectGuidelines = Record<string, string>;

export interface BatchItem {
  subject: Subject;
  topic: string;
  content: string;
  analysis: string;
  imageIndex: number; // Index in the original images array
}

export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
}

export interface TimelineData {
  title: string;
  events: TimelineEvent[];
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  image?: string; // Legacy single image
  images?: string[]; // Multiple images
  batchData?: BatchItem[]; // Structured data from batch analysis
  timelineData?: TimelineData; // New: Timeline data
  isWrongQuestionAnalysis?: boolean;
  timestamp: number;
}

export interface KnowledgeNode {
  id: string;
  label: string;
  type: 'center' | 'parent' | 'child' | 'related';
}

export interface KnowledgeMapData {
  center: string;
  parents: string[];
  children: string[];
  related: string[];
}

export interface WrongQuestion {
  id: string;
  subject: Subject;
  topic: string;
  imageUrl?: string;
  textContent: string;
  analysis: string;
  date: string;
}

export interface UserStats {
  powerLevel: number;
  subjects: { [key in Subject]: number }; // 0-100 score
}

export interface TrainingRecommendation {
  focusArea: string;
  suggestion: string;
  difficulty: 'Basic' | 'Super Saiyan' | 'Super Saiyan God';
}

export interface ProvinceData {
  id: string;
  name: string;
  abbr: string; // 简称
  capital: string; // 行政中心
  path: string; // SVG Path data
  cx: number; // Label X
  cy: number; // Label Y
}

export interface HomeworkTask {
  id: string;
  subject: Subject | string;
  content: string;
  isTestPrep: boolean; // 是否是明天考测内容
  imageUrls?: string[]; // Uploaded images (e.g. from WeChat)
  status: 'todo' | 'doing' | 'done';
  timeSpent: number; // seconds
  targetDuration?: number; // seconds (Plan time)
  startTime?: number; // timestamp
}

export interface HistoryEventItem {
  id: string;
  content: string;
  year: number; 
  displayDate: string;
}

export interface MathPuzzle {
  id: string;
  title: string;
  description: string;
  svgContent?: React.ReactNode; 
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AppState {
  messages: Message[];
  knowledgeData: KnowledgeMapData | null;
  wrongQuestions: WrongQuestion[];
  homeworkTasks: HomeworkTask[];
  stats: UserStats;
  guidelines: SubjectGuidelines;
  recommendations: TrainingRecommendation[];
}

export enum Tab {
  CHAT = 'chat',
  NETWORK = 'network',
  WRONG_BOOK = 'wrong_book',
  STATS = 'stats',
  TRAINING = 'training',
  HOMEWORK = 'homework',
}
