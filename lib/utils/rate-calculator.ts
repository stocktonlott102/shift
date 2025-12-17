/**
 * Rate Calculation Utilities
 * Functions for calculating lesson costs and splitting rates among participants
 */

/**
 * Calculate the total cost of a lesson based on hourly rate and duration
 * @param hourlyRate - The rate per hour
 * @param startTime - Lesson start time (Date or ISO string)
 * @param endTime - Lesson end time (Date or ISO string)
 * @returns Total lesson cost
 */
export function calculateLessonCost(
  hourlyRate: number,
  startTime: Date | string,
  endTime: Date | string
): number {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;

  const durationMs = end.getTime() - start.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);

  return hourlyRate * durationHours;
}

/**
 * Calculate the cost per client when splitting a lesson cost
 * @param totalCost - Total cost of the lesson
 * @param numClients - Number of participants
 * @returns Cost per client (rounded to 2 decimal places)
 */
export function calculatePerClientCost(
  totalCost: number,
  numClients: number
): number {
  if (numClients === 0) return 0;

  const perClient = totalCost / numClients;
  return Math.round(perClient * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate both total cost and per-client cost for a lesson
 * @param hourlyRate - The rate per hour
 * @param startTime - Lesson start time
 * @param endTime - Lesson end time
 * @param numClients - Number of participants
 * @returns Object with totalCost and perClient
 */
export function calculateSplitRates(
  hourlyRate: number,
  startTime: Date | string,
  endTime: Date | string,
  numClients: number
): { totalCost: number; perClient: number } {
  const totalCost = calculateLessonCost(hourlyRate, startTime, endTime);
  const perClient = calculatePerClientCost(totalCost, numClients);

  return { totalCost, perClient };
}

/**
 * Calculate the duration of a lesson in hours
 * @param startTime - Lesson start time
 * @param endTime - Lesson end time
 * @returns Duration in hours
 */
export function calculateDurationHours(
  startTime: Date | string,
  endTime: Date | string
): number {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;

  const durationMs = end.getTime() - start.getTime();
  return durationMs / (1000 * 60 * 60);
}

/**
 * Format a cost as currency (USD)
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "$15.00")
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
