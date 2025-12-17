/**
 * Lesson Type Types
 * Defines types for the lesson types feature
 */

export interface LessonType {
  id: string;
  coach_id: string;
  name: string;
  hourly_rate: number;
  color: string;
  title_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateLessonTypeInput {
  name: string;
  hourly_rate: number;
  color: string;
  title_template: string;
}

export interface UpdateLessonTypeInput {
  name?: string;
  hourly_rate?: number;
  color?: string;
  title_template?: string;
}

export interface LessonTypeFormData extends CreateLessonTypeInput {
  // For form validation
}

// Validation constants
export const LESSON_TYPE_CONSTRAINTS = {
  NAME_MAX_LENGTH: 50,
  TITLE_TEMPLATE_MAX_LENGTH: 100,
  MAX_HOURLY_RATE: 999,
  MIN_HOURLY_RATE: 0.01,
  DEFAULT_COLOR: '#3B82F6',
  DEFAULT_TITLE_TEMPLATE: '{client_names}',
} as const;

// Predefined lesson type colors (optional presets for UI)
export const LESSON_TYPE_COLORS = [
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Orange', hex: '#F59E0B' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Indigo', hex: '#6366F1' },
] as const;
