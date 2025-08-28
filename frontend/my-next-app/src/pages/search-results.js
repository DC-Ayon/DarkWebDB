'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import getConfig from 'next/config';
import Header from './header';

// Search Summary Component - Shows top-level info
const SearchSummary = ({ users, searchQuery, onUserClick, onClose }) => {
  if (!users || users.length === 0) {
    return (
      <div className="text-center bg-gray-800/50 p-6 rounded-xl border border-gray-700 backdrop-blur-md">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-gray-400">No users found. Try searching for an email address.</p>
        <button 
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm transition-colors duration-200"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Search Results</h2>
        <p className="text-gray-400">Found {users.length} matching users for &quot;{searchQuery}&quot;. Click on any record to see full details.</p>
        <button 
          onClick={onClose}
          className="mt-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm transition-colors duration-200"
        >
          Back to Home
        </button>
      </div>
      
      {/* Top-level summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <div
            key={user.id}
            onClick={() => onUserClick(user)}
            className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-blue-500 hover:bg-gray-700/50 transition-all duration-200 shadow-lg cursor-pointer group backdrop-blur-md"
          >
            {/* User Avatar */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">{user.email.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm truncate">{user.email}</p>
                <p className="text-gray-400 text-xs">ID: {user.id}</p>
              </div>
            </div>
            
            {/* Quick Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Email Domain:</span>
                <span className="text-cyan-400 font-medium">{user.email.split('@')[1]}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Password Length:</span>
                <span className="text-yellow-400 font-medium">{user.password.length} chars</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Status:</span>
                <span className="text-green-400 font-medium">Active</span>
              </div>
            </div>
            
            {/* Action indicator */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
              <span className="text-xs text-gray-400">Click for full details</span>
              <svg className="h-4 w-4 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// User Details Component - Shows full details
const UserDetails = ({ user, onClose, onBack }) => {
  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto text-white space-y-4">
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 shadow-lg backdrop-blur-md">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Full User Details</h2>
          <button
            onClick={onBack}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm transition-colors duration-200"
          >
            ← Back to Summary
          </button>
        </div>

        {/* User Avatar and Basic Info */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">{user.email.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{user.email}</h3>
            <p className="text-gray-400">User ID: {user.id}</p>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <p className="text-sm text-gray-400 font-medium mb-1">Email Address</p>
              <p className="text-white font-semibold">{user.email}</p>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <p className="text-sm text-gray-400 font-medium mb-1">User ID</p>
              <p className="text-white font-semibold">{user.id}</p>
            </div>
          </div>
          
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <p className="text-sm text-gray-400 font-medium mb-1">Password</p>
            <p className="text-white font-semibold font-mono text-sm break-all">{user.password}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700/50 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-400 font-medium mb-1">Email Domain</p>
              <p className="text-cyan-400 font-semibold">{user.email.split('@')[1]}</p>
            </div>
            <div className="bg-gray-700/50 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-400 font-medium mb-1">Password Length</p>
              <p className="text-yellow-400 font-semibold">{user.password.length} chars</p>
            </div>
            <div className="bg-gray-700/50 p-3 rounded-lg text-center">
              <p className="text-sm text-gray-400 font-medium mb-1">Status</p>
              <p className="text-green-400 font-semibold">Active</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {/* <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors duration-200">
            Edit User
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors duration-200">
            Delete User
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default function SearchResultsPage() {
  const router = useRouter();
  const { publicRuntimeConfig = {} } = getConfig() || {};
  const basePath = publicRuntimeConfig.basePath || '/darkweb';
  const searchParams = useSearchParams();
  const [searchResults, setSearchResults] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    // Get search data from URL parameters
    const query = searchParams.get('query');
    const results = searchParams.get('results');
    
    if (query && results) {
      try {
        const parsedResults = JSON.parse(decodeURIComponent(results));
        setSearchResults(parsedResults);
        setSearchQuery(query);
      } catch (error) {
        console.error('Error parsing search results:', error);
  router.push(basePath + '/');
      }
    } else {
      // If no search data, redirect to home
  router.push(basePath + '/');
    }
  }, [searchParams, router]);

  const handleUserClick = (user) => {
    setSelectedUser(user);
  };

  const handleCloseSearch = () => {
    router.push(basePath + '/');
  };

  const handleBackToSummary = () => {
    setSelectedUser(null);
  };

  return (
    <div className="relative min-h-screen bg-gray-950 overflow-hidden flex flex-col">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(120deg, #0a101a 0%, #06101c 40%, #01081a 80%, #000 100%)',
            zIndex: 0,
          }}
        ></div>

        <div className="absolute top-1/2 left-1/2 w-[900px] h-[900px] bg-gradient-to-br from-cyan-900 via-blue-900 to-black rounded-full blur-[200px] opacity-40 animate-blob-morph -translate-x-1/2 -translate-y-1/2 z-20"></div>
        <div className="absolute top-[-80px] left-[-80px] w-[300px] h-[300px] rounded-full bg-cyan-900 opacity-10 blur-3xl z-10"></div>
        <div className="absolute top-[20%] right-[-100px] w-[250px] h-[250px] rounded-full bg-blue-900 opacity-10 blur-3xl z-10"></div>
        <div className="absolute bottom-[-100px] left-[30%] w-[200px] h-[200px] rounded-full bg-cyan-800 opacity-10 blur-3xl z-10"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[180px] h-[180px] rounded-full bg-blue-950 opacity-20 blur-2xl z-10"></div>
        <div className="absolute left-[60%] top-[15%] w-40 h-40 bg-cyan-800 rounded-full blur-2xl opacity-20 animate-pulse z-20"></div>

        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M200 600 Q400 500 600 600 T1000 600" stroke="#60aaff22" strokeWidth="2" fill="none" />
          <rect x="1100" y="250" width="200" height="200" rx="50" stroke="#60aaff11" strokeWidth="2" fill="none" />
        </svg>

        <div
          className="absolute inset-0 rounded-2xl border border-[#60aaff11] pointer-events-none z-30"
          style={{ boxShadow: '0 0 40px 10px #60aaff11' }}
        ></div>
      </div>

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-start w-full px-6 md:px-20 py-12 space-y-16">
        {/* Search Summary or User Details */}
        {selectedUser ? (
          <UserDetails 
            user={selectedUser}
            onClose={handleCloseSearch}
            onBack={handleBackToSummary}
          />
        ) : (
          <SearchSummary 
            users={searchResults} 
            searchQuery={searchQuery}
            onUserClick={handleUserClick}
            onClose={handleCloseSearch}
          />
        )}
      </main>
    </div>
  );
} 