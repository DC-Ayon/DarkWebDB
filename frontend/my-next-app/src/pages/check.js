'use client';
import Header from './header';
import { useEffect, useState } from 'react';

const API = 'http://localhost:3001';

export default function UserSearch() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load initial users
  useEffect(() => {
    const fetchInitialUsers = async () => {
      try {
        const res = await fetch(`${API}/users`);
        if (!res.ok) throw new Error('Failed to fetch initial users');
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error('Initial Load Error:', err);
        alert('Failed to load initial users.');
      }
    };

    fetchInitialUsers();
  }, []);

  // Search users by email
  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter an email to search.');
      return;
    }
    try {
      const res = await fetch(`${API}/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error('Search failed.');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Search Error:', err);
      alert('Error searching users.');
    }
  };

  const resetSearch = async () => {
    setSearchQuery('');
    try {
      const res = await fetch(`${API}/users`);
      if (!res.ok) throw new Error('Reset load failed');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Reset Load Error:', err);
      alert('Failed to reload users.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181824] via-[#111] to-[#1a1a1a] text-white px-4 py-10">
      <Header />
      <div className="max-w-3xl mx-auto pt-24">
        <h2 className="text-4xl font-extrabold mb-10 text-center tracking-tight bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent drop-shadow-lg">
          Search Users by Email
        </h2>

        {/* Search and Reset */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-10 justify-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email..."
            className="px-4 py-3 bg-[#232336] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600 w-full sm:w-auto transition"
          />
          <button
            onClick={searchUsers}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg shadow transition duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            🔍 Search
          </button>
          <button
            onClick={resetSearch}
            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg shadow transition duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            🔄 Reset
          </button>
        </div>

        {/* User List */}
        <ul className="space-y-6 mb-12">
          {users.length === 0 ? (
            <li className="bg-red-800/80 text-red-200 px-4 py-3 rounded-lg text-center shadow">
              No users found.
            </li>
          ) : (
            users.map((user) => (
              <li
                key={user.id}
                className="bg-[#232336] p-6 rounded-2xl shadow-lg border border-gray-800 hover:border-purple-500 transition group"
              >
                <p className="mb-1">
                  <span className="font-semibold text-purple-400">ID:</span> {user.id}
                </p>
                <p className="mb-1">
                  <span className="font-semibold text-purple-400">Email:</span> {user.email}
                </p>
                <p className="mb-1">
                  <span className="font-semibold text-purple-400">Password:</span> {user.password}
                </p>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
