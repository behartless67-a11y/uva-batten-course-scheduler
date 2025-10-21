/**
 * Mock Storage for Local Development
 *
 * Stores faculty submissions in memory when Azure credentials aren't available
 */

import { FacultySubmissionEntity } from './tableStorage';

// In-memory storage
const mockSubmissions: FacultySubmissionEntity[] = [];

export const mockStorage = {
  /**
   * Save faculty submission to memory
   */
  async saveFacultySubmission(
    submission: Omit<FacultySubmissionEntity, 'partitionKey' | 'rowKey' | 'submittedAt'>
  ): Promise<FacultySubmissionEntity> {
    const entity: FacultySubmissionEntity = {
      partitionKey: 'FacultyPreferences',
      rowKey: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      submittedAt: new Date(),
      ...submission,
    };

    mockSubmissions.push(entity);
    console.log(`[MOCK] Saved submission for ${entity.facultyName}`);

    return entity;
  },

  /**
   * Get all submissions from memory
   */
  async getAllSubmissions(): Promise<FacultySubmissionEntity[]> {
    // Sort by submission date (most recent first)
    return [...mockSubmissions].sort((a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  },

  /**
   * Delete a submission from memory
   */
  async deleteSubmission(rowKey: string): Promise<void> {
    const index = mockSubmissions.findIndex(s => s.rowKey === rowKey);
    if (index !== -1) {
      mockSubmissions.splice(index, 1);
      console.log(`[MOCK] Deleted submission: ${rowKey}`);
    }
  },

  /**
   * Update a submission in memory
   */
  async updateSubmission(
    rowKey: string,
    updates: Partial<FacultySubmissionEntity>
  ): Promise<void> {
    const submission = mockSubmissions.find(s => s.rowKey === rowKey);
    if (submission) {
      Object.assign(submission, updates);
      console.log(`[MOCK] Updated submission: ${rowKey}`);
    }
  },

  /**
   * Clear all mock data (useful for testing)
   */
  clearAll(): void {
    mockSubmissions.length = 0;
    console.log('[MOCK] Cleared all submissions');
  },
};
