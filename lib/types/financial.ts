/**
 * Financial Type Definitions
 *
 * Types for the Coach Financials feature — income summaries,
 * breakdowns, tax reporting, and CSV export.
 */

export interface FinancialData {
  year: number;
  monthlyIncome: MonthlyIncome[];
  clientBreakdown: ClientIncome[];
  lessonTypeBreakdown: LessonTypeIncome[];
  taxSummary: TaxSummary;
  lessonDetails: LessonExportRow[];
}

export interface MonthlyIncome {
  month: number;           // 0-11
  totalPaid: number;
  lessonCount: number;
  hoursCoached: number;
}

export interface ClientIncome {
  clientId: string;
  clientName: string;
  lessonCount: number;
  hoursCoached: number;
  totalPaid: number;
}

export interface LessonTypeIncome {
  lessonTypeId: string | null;
  lessonTypeName: string;
  lessonTypeColor: string;
  lessonCount: number;
  hoursCoached: number;
  totalPaid: number;
  rate: number;
}

export interface TaxSummary {
  grossIncome: number;
  quarterlyBreakdown: QuarterlyIncome[];
  totalLessons: number;
  totalHoursCoached: number;
  uniqueClientsServed: number;
}

export interface QuarterlyIncome {
  quarter: number;       // 1-4
  label: string;
  income: number;
  deadline: string;
}

export interface LessonExportRow {
  date: string;
  clientName: string;
  lessonType: string;
  durationHours: number;
  amountPaid: number;
  paymentStatus: string;
}
