const USERS_KEY = 'app_users';
const CURRENT_USER_KEY = 'app_current_user';

// Migrate a user's legacy single `role` string to the new `roles` array format.
const migrateUser = (user) => {
  if (Array.isArray(user.roles)) return user; // already migrated
  const legacyRole = user.role || 'view_only';
  let roles;
  if (legacyRole === 'admin') {
    roles = ['admin'];
  } else if (legacyRole === 'pilot') {
    roles = ['pilot'];
  } else if (legacyRole === 'crew') {
    roles = ['coordinator'];
  } else if (legacyRole === 'maintenance') {
    roles = ['maintenance'];
  } else if (legacyRole === 'view_only') {
    roles = ['view_only'];
  } else {
    // Default 'user' -> view_only (admin can reassign)
    roles = ['view_only'];
  }
  return { ...user, roles, role: roles[0] };
};

// Initialize mock database and migrate existing users
const initDB = () => {
  try {
    const existing = localStorage.getItem(USERS_KEY);
    if (!existing) {
      const initialUsers = [
        {
          id: 'admin_1',
          name: 'Chad McKie',
          email: 'chadmckie@gmail.com',
          password: '0987654321',
          roles: ['admin'],
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
    } else {
      let users = JSON.parse(existing);
      let changed = false;

      users = users.map(u => {
        // Migrate legacy role -> roles array
        const migrated = migrateUser(u);

        // Ensure Chad McKie is always admin
        if (u.email === 'chadmckie@gmail.com') {
          if (!Array.isArray(migrated.roles) || !migrated.roles.includes('admin')) {
            migrated.roles = ['admin'];
            migrated.role = 'admin';
            changed = true;
          }
          // Fix old default password
          if (migrated.password === 'password123') {
            migrated.password = '0987654321';
            changed = true;
          }
        }

        // Migrate Test User -> pilot
        if (u.name === 'Test User' || u.email?.includes('test')) {
          if (!Array.isArray(migrated.roles) || migrated.roles.includes('view_only') || migrated.roles.includes('user')) {
            migrated.roles = ['pilot'];
            migrated.role = 'pilot';
            changed = true;
          }
        }

        if (!Array.isArray(u.roles)) changed = true;
        return migrated;
      });

      if (changed) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }

      // Also migrate current session user
      try {
        const sessionRaw = localStorage.getItem(CURRENT_USER_KEY);
        if (sessionRaw) {
          const session = JSON.parse(sessionRaw);
          if (!Array.isArray(session.roles)) {
            const fullUser = users.find(u => u.id === session.id);
            if (fullUser) {
              const newSession = { ...session, roles: fullUser.roles, role: fullUser.role };
              localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newSession));
            }
          }
        }
      } catch (_) {}
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
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = authService.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const roles = Array.isArray(user.roles) ? user.roles : [user.role || 'view_only'];
    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      roles,
      role: roles[0],
      viewOwnFlightsOnly: user.viewOwnFlightsOnly || false,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
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
      roles: ['view_only'],
      role: 'view_only',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    authService.saveUsers(users);

    const sessionUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      roles: newUser.roles,
      role: newUser.role,
      viewOwnFlightsOnly: false,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  adminCreateUser: async (name, email, password, roles) => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const users = authService.getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email is already registered');
    }

    const rolesArr = Array.isArray(roles) ? roles : [roles || 'view_only'];
    const newUser = {
      id: `user_${Date.now()}`,
      name,
      email,
      password,
      roles: rolesArr,
      role: rolesArr[0],
      viewOwnFlightsOnly: false,
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
          localStorage.removeItem(CURRENT_USER_KEY);
          return null;
        }
        // Ensure roles array exists
        if (!Array.isArray(parsed.roles)) {
          parsed.roles = [parsed.role || 'view_only'];
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

  // Update roles (array) for a user
  updateUserRoles: async (id, roles) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const rolesArr = Array.isArray(roles) ? roles : [roles];
    const users = authService.getUsers();
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex > -1) {
      users[userIndex].roles = rolesArr;
      users[userIndex].role = rolesArr[0];
      authService.saveUsers(users);
    }
  },

  // Legacy compat
  updateUserRole: async (id, newRole) => {
    return authService.updateUserRoles(id, [newRole]);
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
    throw new Error('User not found');
  },

  updatePassword: async (id, currentPassword, newPassword) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const users = authService.getUsers();
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex > -1) {
      if (users[userIndex].password !== currentPassword) {
        throw new Error('Incorrect current password');
      }
      users[userIndex].password = newPassword;
      authService.saveUsers(users);
      return true;
    }
    throw new Error('User not found');
  }
};
