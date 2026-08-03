const USERS_KEY = 'app_users';
const CURRENT_USER_KEY = 'app_current_user';

// Initialize mock database
const initDB = () => {
  try {
    const existing = localStorage.getItem(USERS_KEY);
    if (!existing) {
      const initialUsers = [
        {
          id: 'admin_1',
          name: 'Chad McKie',
          email: 'chadmckie@gmail.com',
          password: '0987654321', // Updated password
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
    } else {
      let users = JSON.parse(existing);
      let chad = users.find(u => u.email === 'chadmckie@gmail.com');
      if (chad && chad.password === 'password123') {
        chad.password = '0987654321';
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    }
  } catch (e) {
    console.error('Failed to init mock DB', e);
  }
};

initDB();

export const authService = {
  getUsers: () => {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    } catch {
      return [];
    }
  },

  saveUsers: (users) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  login: async (email, password) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const users = authService.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const sessionUser = { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  signup: async (name, email, password) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const users = authService.getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email is already registered');
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name,
      email,
      password,
      role: 'user', // default role
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    authService.saveUsers(users);

    const sessionUser = { 
      id: newUser.id, 
      name: newUser.name, 
      email: newUser.email, 
      role: newUser.role,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  adminCreateUser: async (name, email, password, role) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const users = authService.getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email is already registered');
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name,
      email,
      password,
      role: role || 'user',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    authService.saveUsers(users);
    return newUser;
  },

  logout: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem(CURRENT_USER_KEY);
      if (user) {
        const parsed = JSON.parse(user);
        if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
          // Session expired
          localStorage.removeItem(CURRENT_USER_KEY);
          return null;
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  },
  
  deleteUser: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    let users = authService.getUsers();
    users = users.filter(u => u.id !== id);
    authService.saveUsers(users);
  },
  
  updateUserRole: async (id, newRole) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const users = authService.getUsers();
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex > -1) {
      users[userIndex].role = newRole;
      authService.saveUsers(users);
    }
  },

  updateProfile: async (id, updates) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const users = authService.getUsers();
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex > -1) {
      users[userIndex] = { ...users[userIndex], ...updates };
      authService.saveUsers(users);
      
      const sessionUser = authService.getCurrentUser();
      if (sessionUser && sessionUser.id === id) {
        const newSession = { ...sessionUser, ...updates };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newSession));
        return newSession;
      }
    }
    throw new Error("User not found");
  },

  updatePassword: async (id, currentPassword, newPassword) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const users = authService.getUsers();
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex > -1) {
      if (users[userIndex].password !== currentPassword) {
        throw new Error("Incorrect current password");
      }
      users[userIndex].password = newPassword;
      authService.saveUsers(users);
      return true;
    }
    throw new Error("User not found");
  }
};
