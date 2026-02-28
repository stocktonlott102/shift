export interface CalendarBlock {
  id: string;
  coach_id: string;
  title: string;
  notes?: string | null;
  start_time: string;
  end_time: string;
  color: string;
  created_at: string;
  updated_at: string;
}
