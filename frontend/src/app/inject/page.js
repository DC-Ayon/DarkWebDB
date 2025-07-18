'use client';

import { useEffect, useState } from 'react';

const API = 'http://localhost:3001';

export default function Home() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ id: '', email: '', password: '' });

  const loadUsers = async () => {
    const res = await fetch(`${API}/users`);
    const data = await res.json();
    setUsers(data);
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter an email to search.');
      return;
    }

    const res = await fetch(`${API}/users/search?q=${encodeURIComponent(searchQuery)}`);
    const data = await res.json();
    setUsers(data);
  };

  const saveUser = async () => {
    if (!form.email || !form.password) {
      alert('Email and password cannot be empty.');
      return;
    }

    const method = form.id ? 'PUT' : 'POST';
    const url = form.id ? `${API}/users/${form.id}` : `${API}/users`;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email, password: form.password }),
    });

    const result = await res.json();
    if (result.success) {
      alert('User saved.');
      setForm({ id: '', email: '', password: '' });
      loadUsers();
    } else {
      alert('Failed to save user.');
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    const res = await fetch(`${API}/users/${id}`, {
      method: 'DELETE',
    });

    const result = await res.json();
    if (result.success) {
      alert('User deleted.');
      loadUsers();
    } else {
      alert('Failed to delete user.');
    }
  };

  const editUser = (id, email, password) => {
    setForm({ id, email, password });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">User Manager (email:password)</h2>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by email..."
          className="px-4 py-2 border rounded-md w-full sm:w-auto"
        />
        <button
          onClick={searchUsers}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Search
        </button>
        <button
          onClick={loadUsers}
          className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
        >
          🔄 Reset
        </button>
      </div>

      <ul className="space-y-3 mb-6">
        {users.length === 0 ? (
          <li className="bg-red-100 text-red-700 px-4 py-2 rounded">No users found.</li>
        ) : (
          users.map((user) => (
            <li key={user.id} className="bg-gray-100 p-4 rounded shadow-sm">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Password:</strong> {user.password}</p>
              <div className="mt-2 space-x-2">
                <button
                  onClick={() => editUser(user.id, user.email, user.password)}
                  className="bg-yellow-400 text-black px-3 py-1 rounded hover:bg-yellow-500"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => deleteUser(user.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  🗑️ Delete
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      <h3 className="text-xl font-semibold mb-2">Add / Update User</h3>
      <div className="space-y-2">
        <input
          type="text"
          value={form.id}
          onChange={(e) => setForm({ ...form, id: e.target.value })}
          placeholder="User ID (leave empty to add)"
          className="w-full border px-4 py-2 rounded"
        />
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email"
          className="w-full border px-4 py-2 rounded"
        />
        <input
          type="text"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Password"
          className="w-full border px-4 py-2 rounded"
        />
        <button
          onClick={saveUser}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Save
        </button>
      </div>
    </div>
  );
}
