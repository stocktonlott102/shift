/**
 * Lesson Title Generation Utilities
 * Functions for auto-generating lesson titles based on templates
 */

const MAX_TITLE_LENGTH = 100;

/**
 * Generate a lesson title based on a template and client names
 * @param template - The title template (e.g., "Private Lesson with {client_names}")
 * @param clientNames - Array of client names
 * @returns Generated title (truncated if too long)
 */
export function generateLessonTitle(
  template: string,
  clientNames: string[]
): string {
  if (clientNames.length === 0) {
    return template.replace('{client_names}', 'Unknown');
  }

  let clientText: string;

  if (clientNames.length === 1) {
    // Single client: "Private Lesson with Johnny"
    clientText = clientNames[0];
  } else if (clientNames.length === 2) {
    // Two clients: "Private Lesson with Johnny and Sarah"
    clientText = `${clientNames[0]} and ${clientNames[1]}`;
  } else {
    // 3+ clients: "Private Lesson with Johnny, Sarah and 2 others"
    const remaining = clientNames.length - 2;
    clientText = `${clientNames[0]}, ${clientNames[1]} and ${remaining} other${remaining > 1 ? 's' : ''}`;
  }

  let title = template.replace('{client_names}', clientText);

  // Truncate if too long
  if (title.length > MAX_TITLE_LENGTH) {
    title = title.substring(0, MAX_TITLE_LENGTH - 3) + '...';
  }

  return title;
}

/**
 * Validate a title template
 * @param template - The template to validate
 * @returns Object with isValid flag and optional error message
 */
export function validateTitleTemplate(
  template: string
): { isValid: boolean; error?: string } {
  if (!template || template.trim().length === 0) {
    return { isValid: false, error: 'Template cannot be empty' };
  }

  if (template.length > MAX_TITLE_LENGTH) {
    return {
      isValid: false,
      error: `Template must be ${MAX_TITLE_LENGTH} characters or less`,
    };
  }

  if (!template.includes('{client_names}')) {
    return {
      isValid: false,
      error: 'Template must include {client_names} placeholder',
    };
  }

  return { isValid: true };
}

/**
 * Get a preview of what a title will look like with sample names
 * @param template - The title template
 * @param numClients - Number of clients to simulate (1-5)
 * @returns Preview title
 */
export function getPreviewTitle(
  template: string,
  numClients: number = 2
): string {
  const sampleNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey'];
  const names = sampleNames.slice(0, Math.max(1, Math.min(numClients, 5)));
  return generateLessonTitle(template, names);
}

/**
 * Extract just the client names portion from a generated title
 * Useful for display in tight spaces
 * @param title - The full title
 * @param template - The template used to generate it
 * @returns Just the client names portion, or the full title if can't extract
 */
export function extractClientNames(title: string, template: string): string {
  // Find where {client_names} appears in the template
  const placeholderIndex = template.indexOf('{client_names}');
  if (placeholderIndex === -1) return title;

  // Extract what's before and after the placeholder
  const before = template.substring(0, placeholderIndex);
  const after = template.substring(placeholderIndex + '{client_names}'.length);

  // Remove prefix and suffix from title
  let names = title;
  if (before && names.startsWith(before)) {
    names = names.substring(before.length);
  }
  if (after && names.endsWith(after)) {
    names = names.substring(0, names.length - after.length);
  }

  return names.trim();
}
