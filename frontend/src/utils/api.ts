import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

class ApiClient {
  private token: string | null = null;

  async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('auth_token', token);
  }

  async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('auth_token');
    }
    return this.token;
  }

  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem('auth_token');
  }

  async fetch(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const url = `${API_BASE}/api${endpoint}`;
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Request failed');
    }
    return response.json();
  }

  // Auth
  async register(email: string, password: string, name: string) {
    const data = await this.fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    await this.setToken(data.token);
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await this.setToken(data.token);
    return data;
  }

  async guestLogin() {
    const data = await this.fetch('/auth/guest', { method: 'POST' });
    await this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.fetch('/auth/me');
  }

  // Profile
  async updateProfile(updates: Record<string, any>) {
    return this.fetch('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async updateOnboarding(data: Record<string, any>) {
    return this.fetch('/user/onboarding', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Tasks
  async getTasks(filter: string = 'all') {
    return this.fetch(`/tasks?filter=${filter}`);
  }

  async getTask(taskId: string) {
    return this.fetch(`/tasks/${taskId}`);
  }

  async createTask(task: Record<string, any>) {
    return this.fetch('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(taskId: string, updates: Record<string, any>) {
    return this.fetch(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(taskId: string) {
    return this.fetch(`/tasks/${taskId}`, { method: 'DELETE' });
  }

  async toggleSubtask(taskId: string, subtaskId: string) {
    return this.fetch(`/tasks/${taskId}/subtask/${subtaskId}`, { method: 'PUT' });
  }

  // AI
  async aiSuggest(title: string) {
    return this.fetch('/ai/suggest', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async aiBreakdown(title: string) {
    return this.fetch('/ai/breakdown', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async aiChat(message: string, aiModel: string = 'claude', sessionId?: string) {
    return this.fetch('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, ai_model: aiModel, session_id: sessionId }),
    });
  }

  async getChatHistory(sessionId?: string) {
    const qs = sessionId ? `?session_id=${sessionId}` : '';
    return this.fetch(`/ai/chat-history${qs}`);
  }

  // Dashboard
  async getDashboard() {
    return this.fetch('/dashboard');
  }

  // Gamification
  async getGamificationStats() {
    return this.fetch('/gamification/stats');
  }

  // Notifications
  async getNotifications() {
    return this.fetch('/notifications');
  }

  async markNotificationRead(notifId: string) {
    return this.fetch(`/notifications/${notifId}/read`, { method: 'PUT' });
  }

  async markAllRead() {
    return this.fetch('/notifications/mark-all-read', { method: 'POST' });
  }

  async getUnreadCount() {
    return this.fetch('/notifications/unread-count');
  }
}

export const api = new ApiClient();
