import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { PiketRecord } from '../types/piket';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

// Test Firestore connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'piket_records', 'test-connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client is offline, falling back to local/server cache.");
    }
    // Still considered online or active if non-fatal
    return false;
  }
}

// Real-time listener for piket records
export function subscribeToPiketRecords(onData: (records: PiketRecord[]) => void) {
  const path = 'piket_records';
  try {
    const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(150));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: PiketRecord[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as PiketRecord);
        });
        onData(items);
      },
      (error) => {
        console.warn('Firestore snapshot warning, falling back to server sync:', error.message);
      }
    );
  } catch (err) {
    console.warn('Failed to subscribe to firestore, will use server sync:', err);
    return () => {};
  }
}

// Save or sync a piket record to Firestore
export async function saveRecordToFirestore(record: PiketRecord): Promise<void> {
  const path = `piket_records/${record.id}`;
  try {
    await setDoc(doc(db, 'piket_records', record.id), record);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Update SPV status in Firestore
export async function updateRecordStatusInFirestore(
  recordId: string, 
  spvStatus: 'APPROVED' | 'REVISION_NEEDED', 
  spvNotes?: string
): Promise<void> {
  const path = `piket_records/${recordId}`;
  try {
    await updateDoc(doc(db, 'piket_records', recordId), {
      spvStatus,
      spvNotes: spvNotes || '',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
