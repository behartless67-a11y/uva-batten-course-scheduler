/**
 * Azure Table Storage Configuration
 *
 * Handles faculty preference submissions storage
 */

import { TableClient, AzureNamedKeyCredential } from '@azure/data-tables';

// Faculty submission entity interface
export interface FacultySubmissionEntity {
  partitionKey: string; // Will be "FacultyPreferences"
  rowKey: string; // Will be unique submission ID (timestamp-based)

  // Faculty Info
  facultyName: string;
  email: string;
  preferredDays?: string; // Comma-separated: "Monday,Wednesday"
  cannotTeachDays?: string; // Comma-separated: "Tuesday,Thursday"
  preferredTimeSlots?: string; // e.g., "Morning,Afternoon"
  shareParentingWith?: string;
  additionalNotes?: string;

  // Course Info
  courseCode?: string;
  courseName?: string;
  courseType?: string; // Core, Elective, Capstone
  enrollmentCap?: string;
  numberOfSections?: string;
  numberOfDiscussions?: string;
  duration?: string; // minutes
  sessionsPerWeek?: string;
  targetPrograms?: string; // Comma-separated
  courseNotes?: string;

  submittedAt: Date;
  timestamp?: Date;
}

// Configuration
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || '';
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || '';
const tableName = 'facultypreferences';

let tableClient: TableClient | null = null;

/**
 * Get or create Table Storage client
 */
export function getTableClient(): TableClient {
  if (tableClient) {
    return tableClient;
  }

  // Check if credentials are configured
  if (!accountName || !accountKey) {
    console.warn('Azure Storage credentials not configured. Using mock storage.');
    throw new Error('Azure Storage not configured. Please set AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY environment variables.');
  }

  const credential = new AzureNamedKeyCredential(accountName, accountKey);
  tableClient = new TableClient(
    `https://${accountName}.table.core.windows.net`,
    tableName,
    credential
  );

  return tableClient;
}

/**
 * Initialize table (create if doesn't exist)
 */
export async function initializeTable(): Promise<void> {
  try {
    const client = getTableClient();
    await client.createTable();
    console.log(`Table "${tableName}" created or already exists`);
  } catch (error: any) {
    if (error.statusCode === 409) {
      console.log(`Table "${tableName}" already exists`);
    } else {
      console.error('Error initializing table:', error);
      throw error;
    }
  }
}

/**
 * Save faculty submission
 */
export async function saveFacultySubmission(
  submission: Omit<FacultySubmissionEntity, 'partitionKey' | 'rowKey' | 'submittedAt'>
): Promise<FacultySubmissionEntity> {
  const client = getTableClient();

  const entity: FacultySubmissionEntity = {
    partitionKey: 'FacultyPreferences',
    rowKey: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    submittedAt: new Date(),
    ...submission,
  };

  await client.createEntity(entity);
  console.log(`Saved submission for ${entity.facultyName}`);

  return entity;
}

/**
 * Get all faculty submissions
 */
export async function getAllSubmissions(): Promise<FacultySubmissionEntity[]> {
  const client = getTableClient();
  const submissions: FacultySubmissionEntity[] = [];

  const entities = client.listEntities<FacultySubmissionEntity>({
    queryOptions: { filter: `PartitionKey eq 'FacultyPreferences'` }
  });

  for await (const entity of entities) {
    submissions.push(entity);
  }

  // Sort by submission date (most recent first)
  submissions.sort((a, b) =>
    new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  return submissions;
}

/**
 * Delete a submission
 */
export async function deleteSubmission(rowKey: string): Promise<void> {
  const client = getTableClient();
  await client.deleteEntity('FacultyPreferences', rowKey);
  console.log(`Deleted submission: ${rowKey}`);
}

/**
 * Update a submission
 */
export async function updateSubmission(
  rowKey: string,
  updates: Partial<FacultySubmissionEntity>
): Promise<void> {
  const client = getTableClient();
  await client.updateEntity({
    partitionKey: 'FacultyPreferences',
    rowKey,
    ...updates,
  }, 'Merge');
  console.log(`Updated submission: ${rowKey}`);
}
