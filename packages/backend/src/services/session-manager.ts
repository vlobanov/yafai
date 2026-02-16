import type { BaseMessage } from '@langchain/core/messages';
import { v4 as uuid } from 'uuid';

export interface Session {
  id: string;
  deckId: string;
  createdAt: Date;
  messages: BaseMessage[];
}

/**
 * Manages chat sessions and conversation history
 * In-memory for PoC - can be swapped for persistent storage later
 */
export class SessionManager {
  private sessions: Map<string, Session> = new Map();

  createSession(deckId?: string): Session {
    const session: Session = {
      id: uuid(),
      deckId: deckId || uuid(),
      createdAt: new Date(),
      messages: [],
    };
    this.sessions.set(session.id, session);
    return session;
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  addMessages(sessionId: string, messages: BaseMessage[]): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages.push(...messages);
    }
  }

  getMessages(sessionId: string): BaseMessage[] {
    return this.sessions.get(sessionId)?.messages || [];
  }

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }
}

export const sessionManager = new SessionManager();
