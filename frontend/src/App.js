import React, { useEffect, useState } from 'react';
import './index.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';
const emptyNewUser = () => ({ name: '', email: '', password: '', role: 'hr' });
const emptyEditForm = () => ({ name: '', email: '', role: '' });

function App() {
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '' });
  const [status, setStatus] = useState('');
  const [authToken, setAuthToken] = useState(localStorage.getItem('hr_token'));
  const [profile, setProfile] = useState(() => {
    const stored = localStorage.getItem('hr_profile');
    return stored ? JSON.parse(stored) : null;
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState(emptyNewUser());
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm());

  useEffect(() => {
    if (authToken) {
      fetchUsers();
    }
  }, [authToken]);

  const saveSession = (token, user) => {
    localStorage.setItem('hr_token', token);
    localStorage.setItem('hr_profile', JSON.stringify(user));
    setAuthToken(token);
    setProfile(user);
  };

  const clearSession = () => {
    localStorage.removeItem('hr_token');
    localStorage.removeItem('hr_profile');
    setAuthToken(null);
    setProfile(null);
    setUsers([]);
    setEditingUserId(null);
  };

  const callApi = async (path, options = {}) => {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const body =
      options.body && typeof options.body === 'object' ? JSON.stringify(options.body) : options.body;

    const response = await fetch(`${API_BASE}${path}`, { ...options, headers, body });
    const payload = response.status === 204 ? null : await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(payload?.message || 'Request failed');
    }

    return payload;
  };

  const fetchUsers = async () => {
    setLoading(true);
    setStatus('Loading users...');
    try {
      const data = await callApi('/api/users');
      setUsers(data.users || []);
      setStatus('Users refreshed.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setStatus('Signing in...');
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to sign in.');
      }
      saveSession(payload.token, payload.user);
      setStatus('Welcome back!');
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setStatus('Registering...');
    try {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm)
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to register.');
      }
      saveSession(payload.token, payload.user);
      setStatus('Account created. You are logged in.');
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setStatus('Creating user...');
    try {
      await callApi('/api/users', { method: 'POST', body: newUser });
      setStatus('User created.');
      setNewUser(emptyNewUser());
      fetchUsers();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const startEditing = (user) => {
    setEditingUserId(user.id);
    setEditForm({ name: user.name, email: user.email, role: user.role || 'hr' });
  };

  const handleUpdateUser = async (event) => {
    event.preventDefault();
    if (!editingUserId) {
      return;
    }
    setStatus('Saving user...');
    try {
      await callApi(`/api/users/${editingUserId}`, { method: 'PUT', body: editForm });
      setStatus('User updated.');
      setEditingUserId(null);
      setEditForm(emptyEditForm());
      fetchUsers();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditForm(emptyEditForm());
  };

  const handleDeleteUser = async (userId) => {
    const confirmed = window.confirm('Delete this user permanently?');
    if (!confirmed) {
      return;
    }
    setStatus('Deleting user...');
    try {
      await callApi(`/api/users/${userId}`, { method: 'DELETE' });
      setStatus('User removed.');
      fetchUsers();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleLogout = () => {
    clearSession();
    setStatus('Signed out.');
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">HR Auth Suite</p>
          <h1>Manage HR login, signup, and user CRUD</h1>
          <p className="subtitle">
            The backend exposes JWT-authenticated endpoints while the React dashboard drives the Trello
            cards you created.
          </p>
        </div>
        <div className="session">
          {authToken ? (
            <>
              <p>
                Logged in as <strong>{profile?.name || profile?.email}</strong>
              </p>
              <button type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <p>Not authenticated</p>
          )}
        </div>
      </header>

      <div className="status-bar">{status || 'Ready'}</div>

      {!authToken ? (
        <section className="auth-grid">
          <form className="panel" onSubmit={handleLogin}>
            <h2>Login</h2>
            <label>
              Email
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                required
              />
            </label>
            <button type="submit">Sign in</button>
          </form>

          <form className="panel" onSubmit={handleSignup}>
            <h2>Signup</h2>
            <label>
              Full name
              <input
                type="text"
                value={signupForm.name}
                onChange={(event) => setSignupForm({ ...signupForm, name: event.target.value })}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={signupForm.email}
                onChange={(event) => setSignupForm({ ...signupForm, email: event.target.value })}
                required
              />
            </label>
            <label>
              Password (min 8 chars)
              <input
                type="password"
                value={signupForm.password}
                onChange={(event) => setSignupForm({ ...signupForm, password: event.target.value })}
                minLength={8}
                required
              />
            </label>
            <button type="submit">Create account</button>
          </form>
        </section>
      ) : (
        <section className="dashboard">
          <div className="panel split">
            <div>
              <h2>Create HR user</h2>
              <form onSubmit={handleCreateUser}>
                <label>
                  Full name
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(event) => setNewUser({ ...newUser, name: event.target.value })}
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(event) => setNewUser({ ...newUser, email: event.target.value })}
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(event) => setNewUser({ ...newUser, password: event.target.value })}
                    minLength={8}
                    required
                  />
                </label>
                <label>
                  Role
                  <input
                    type="text"
                    value={newUser.role}
                    onChange={(event) => setNewUser({ ...newUser, role: event.target.value })}
                  />
                </label>
                <button type="submit" disabled={loading}>
                  {loading ? 'Working...' : 'Create HR user'}
                </button>
              </form>
            </div>
            <div>
              <h2>Users</h2>
              <button type="button" className="ghost" onClick={fetchUsers} disabled={loading}>
                Refresh list
              </button>
              {loading && <p>Fetching...</p>}
              {users.length === 0 && !loading && <p>No users found yet.</p>}
              <ul className="user-list">
                {users.map((user) => (
                  <li key={user.id}>
                    {editingUserId === user.id ? (
                      <form className="inline-form" onSubmit={handleUpdateUser}>
                        <label>
                          Name
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                            required
                          />
                        </label>
                        <label>
                          Email
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(event) => setEditForm({ ...editForm, email: event.target.value })}
                            required
                          />
                        </label>
                        <label>
                          Role
                          <input
                            type="text"
                            value={editForm.role}
                            onChange={(event) => setEditForm({ ...editForm, role: event.target.value })}
                          />
                        </label>
                        <div className="actions">
                          <button type="submit">Save</button>
                          <button type="button" className="ghost" onClick={handleCancelEdit}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="user-card">
                        <div>
                          <p className="user-name">{user.name}</p>
                          <p className="user-email">{user.email}</p>
                          <p className="user-role">{user.role}</p>
                        </div>
                        <div className="actions">
                          <button type="button" onClick={() => startEditing(user)}>
                            Edit
                          </button>
                          <button type="button" className="ghost" onClick={() => handleDeleteUser(user.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
