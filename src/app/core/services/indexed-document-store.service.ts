import { Injectable } from '@angular/core';
import { KnowledgeDocument } from '../models/knowledge-file.model';

const DATABASE_NAME = 'aether-local-knowledge';
const STORE_NAME = 'documents';
const DATABASE_VERSION = 1;

@Injectable({ providedIn: 'root' })
export class IndexedDocumentStoreService {
  private databasePromise: Promise<IDBDatabase> | null = null;

  async put(document: KnowledgeDocument): Promise<void> {
    const database = await this.open();
    await this.request(database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(document));
  }

  async getAll(): Promise<KnowledgeDocument[]> {
    const database = await this.open();
    return this.request<KnowledgeDocument[]>(database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll());
  }

  async delete(id: string): Promise<void> {
    const database = await this.open();
    await this.request(database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id));
  }

  private open(): Promise<IDBDatabase> {
    if (this.databasePromise) {
      return this.databasePromise;
    }

    this.databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onerror = () => reject(request.error ?? new Error('Could not open local knowledge storage.'));
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
    });

    return this.databasePromise;
  }

  private request<T = IDBValidKey>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Local storage operation failed.'));
    });
  }
}
