'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { FiLogOut, FiClock, FiTrash2, FiSearch, FiSettings, FiAlertCircle, FiCheckCircle, FiX, FiInfo } from 'react-icons/fi';

const API = 'http://localhost:4001';

// --- Custom Notification System ---
const NotificationContext = React.createContext();

const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now() + Math.random();
        const notification = { id, message, type, duration };

        setNotifications(prev => [...prev, notification]);

        if (duration > 0) {
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const value = {
        addNotification,
        removeNotification,
        notifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <NotificationContainer />
        </NotificationContext.Provider>
    );
};

const useNotification = () => {
    const context = React.useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
};

const NotificationContainer = () => {
    const { notifications, removeNotification } = useNotification();

    if (notifications.length === 0) return null;

    return createPortal(
        <div className="fixed top-4 right-4 z-[99999999] space-y-2 pointer-events-none">
            {notifications.map((notification) => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRemove={() => removeNotification(notification.id)}
                />
            ))}
        </div>,
        document.body
    );
};

const NotificationItem = ({ notification, onRemove }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const handleRemove = () => {
        setIsLeaving(true);
        setTimeout(onRemove, 300); // Wait for exit animation
    };

    const getIcon = () => {
        switch (notification.type) {
            case 'success':
                return <FiCheckCircle className="text-green-400" size={20} />;
            case 'error':
                return <FiAlertCircle className="text-red-400" size={20} />;
            case 'warning':
                return <FiAlertCircle className="text-yellow-400" size={20} />;
            default:
                return <FiInfo className="text-cyan-400" size={20} />;
        }
    };

    const getColors = () => {
        switch (notification.type) {
            case 'success':
                return 'from-green-500/20 to-emerald-600/20 border-green-500/50';
            case 'error':
                return 'from-red-500/20 to-red-600/20 border-red-500/50';
            case 'warning':
                return 'from-yellow-500/20 to-orange-600/20 border-yellow-500/50';
            default:
                return 'from-cyan-500/20 to-blue-600/20 border-cyan-500/50';
        }
    };

    return (
        <div
            className={`
                pointer-events-auto relative bg-gradient-to-r ${getColors()} 
                backdrop-blur-md rounded-lg border shadow-2xl p-4 min-w-[300px] max-w-md
                transform transition-all duration-300 ease-out
                ${isVisible && !isLeaving
                    ? 'translate-x-0 opacity-100 scale-100'
                    : 'translate-x-full opacity-0 scale-95'
                }
            `}
            style={{
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 20px 5px rgba(96, 170, 255, 0.1)'
            }}
        >
            {/* Glass shine effect */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-30 pointer-events-none"></div>

            <div className="relative flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    {getIcon()}
                </div>

                <div className="flex-1 text-white text-sm leading-relaxed">
                    {notification.message}
                </div>

                <button
                    onClick={handleRemove}
                    className="flex-shrink-0 text-white/60 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
                    aria-label="Close notification"
                >
                    <FiX size={16} />
                </button>
            </div>

            {/* Progress bar for timed notifications */}
            {notification.duration > 0 && (
                <div className="absolute bottom-0 left-0 h-1 bg-white/20 rounded-b-lg overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-b-lg animate-shrink"
                        style={{
                            animationDuration: `${notification.duration}ms`,
                            animationTimingFunction: 'linear',
                            animationFillMode: 'forwards'
                        }}
                    />
                </div>
            )}

            <style jsx>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                
                .animate-shrink {
                    animation-name: shrink;
                }
            `}</style>
        </div>
    );
};

// --- Confirmation Modal Component ---
const ConfirmationModal = ({ onConfirm, onCancel, title, message }) => {
    return createPortal(
        <div
            className="fixed inset-0 z-[9999999] flex items-center justify-center p-4"
            onClick={onCancel}
            role="dialog"
            aria-modal="true"
            style={{
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(8px)'
            }}
        >
            <div
                className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl max-w-sm w-full p-6"
                onClick={e => e.stopPropagation()}
                style={{
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 40px 10px rgba(96, 170, 255, 0.1)'
                }}
            >
                {/* Glass shine effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-30 pointer-events-none"></div>

                <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-xl">
                            <FiInfo className="text-white" size={24} />
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                    <p className="text-cyan-200/80 text-sm mb-6">{message}</p>

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] border border-white/20"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-3 rounded-lg font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                        >
                            Login
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

// --- Enhanced SearchInput component ---
const SearchInput = ({ isAuthenticated, promptLogin, user }) => {
    const { addNotification } = useNotification();
    const [isHovered, setIsHovered] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showLoginConfirm, setShowLoginConfirm] = useState(false);
    const [pendingSearchData, setPendingSearchData] = useState(null);
    const timeoutRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        fetchAllUsers();
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const fetchAllUsers = async () => {
        try {
            const res = await fetch(`${API}/users`);
            if (!res.ok) throw new Error('Failed to fetch users.');
            const data = await res.json();
            setAllUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
            addNotification('Failed to load user data. Please try again.', 'error');
        }
    };

    const saveSearchHistory = async (query, resultsCount) => {
        if (user && user.id) {
            try {
                await fetch(`${API}/search-history`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${user.token}`,
                    },
                    body: JSON.stringify({
                        userId: user.id,
                        query,
                        resultsCount
                    }),
                });
            } catch (err) {
                console.error('Error saving search history:', err);
            }
        }
    };

    const performSearch = async (query) => {
        setIsSearching(true);
        setShowSuggestions(false);
        try {
            const filtered = allUsers
                .filter(user => user.email.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 5);

            // Save search history if user is logged in
            await saveSearchHistory(query, filtered.length);

            addNotification(`Found ${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${query}"`, 'success', 3000);

            router.push(
                `/search-results?query=${encodeURIComponent(query)}&results=${encodeURIComponent(
                    JSON.stringify(filtered)
                )}`
            );
        } catch (err) {
            console.error('Search Error:', err);
            addNotification('Error occurred while searching. Please try again.', 'error');
        } finally {
            setIsSearching(false);
        }
    };

    const searchUsers = useCallback(async () => {
        if (!searchQuery.trim()) {
            addNotification('Please enter an email to search.', 'warning');
            return;
        }

        // If user is not authenticated, show confirmation modal first
        if (!isAuthenticated) {
            setPendingSearchData({ query: searchQuery });
            setShowLoginConfirm(true);
            return;
        }

        // User is authenticated, proceed with search
        await performSearch(searchQuery);
    }, [allUsers, searchQuery, router, user, addNotification, isAuthenticated]);

    const handleLoginConfirm = () => {
        setShowLoginConfirm(false);
        if (pendingSearchData) {
            // Proceed to login modal
            promptLogin();
            setPendingSearchData(null);
        }
    };

    const handleLoginCancel = () => {
        setShowLoginConfirm(false);
        setPendingSearchData(null);
        // User stays on main page, search is cancelled
        addNotification('Search cancelled. Login required to view full details.', 'info', 3000);
    };

    const handleSearchChange = value => {
        setSearchQuery(value);
        if (value.trim() === '') {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        const matches = allUsers
            .filter(user => user.email.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 3);
        setSuggestions(matches);
        setShowSuggestions(matches.length > 0);
    };

    const handleSuggestionClick = async email => {
        if (!isAuthenticated) {
            setPendingSearchData({ query: email });
            setShowLoginConfirm(true);
            return;
        }

        setSearchQuery(email);
        setShowSuggestions(false);
        await performSearch(email);
    };

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsHovered(false);
        }, 300);
    };

    return (
        <>
            <div className="relative p-2 flex items-center justify-between gap-2 rounded-[25px] w-full max-w-[600px] bg-white/10 backdrop-blur-sm border border-white/10">
                {/* Search Icon */}
                <button
                    onClick={searchUsers}
                    disabled={isSearching}
                    className="cursor-pointer bg-transparent hover:bg-white/10 transition rounded-[12px] p-2"
                    aria-label="Search button"
                    type="button"
                >
                    {isSearching ? (
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                            <path
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                fill="currentColor"
                                className="opacity-75"
                            />
                        </svg>
                    ) : (
                        <svg
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            height="20px"
                            width="20px"
                        >
                            <path
                                d="M4 9a5 5 0 1110 0A5 5 0 014 9zm5-7a7 7 0 104.2 12.6.999.999 0 00.093.107l3 3a1 1 0 001.414-1.414l-3-3a.999.999 0 00-.107-.093A7 7 0 009 2z"
                                fillRule="evenodd"
                                fill="#fff"
                            />
                        </svg>
                    )}
                </button>

                {/* Input */}
                <input
                    type="text"
                    name="text"
                    placeholder="Search For Your Data"
                    value={searchQuery}
                    onChange={e => handleSearchChange(e.target.value)}
                    onFocus={() => searchQuery.trim() && suggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onKeyDown={e => e.key === 'Enter' && searchUsers()}
                    className="w-full bg-transparent placeholder-white text-white rounded-[18px] outline-none border-none px-2 py-[2px] text-sm"
                    aria-label="Search input"
                />

                {/* Filter Dropdown */}
                <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    <button
                        className="text-white text-xs uppercase px-3 py-2 border border-cyan-400 rounded-lg cursor-pointer transition-transform hover:scale-105"
                        type="button"
                        aria-haspopup="true"
                        aria-expanded={isHovered}
                    >
                        FILTERS
                    </button>

                    <div
                        className={`absolute right-0 top-full mt-2 transition-all duration-200 origin-top-right z-20 ${isHovered ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                            }`}
                    >
                        <div className="relative">
                            <div className="absolute right-4 w-4 h-4 bg-cyan-400 rotate-45 -top-2 shadow-lg z-0" />
                            <ul className="bg-[#021624] text-white text-sm border border-cyan-400 min-w-[12rem] max-w-xs shadow-xl rounded-md overflow-hidden">
                                {['User', 'Creds', 'Financial'].map(item => (
                                    <li key={item} className="border-b border-[#021624] last:border-none">
                                        <a
                                            href="#"
                                            className="block px-4 py-2 w-full h-full hover:bg-cyan-800 hover:shadow-[0_0_10px_#00ffff] transition duration-300 rounded-sm"
                                            onClick={e => e.preventDefault()}
                                        >
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Autocomplete Suggestions */}
            {showSuggestions &&
                suggestions.length > 0 &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 max-w-[600px] w-[90vw] z-[9999999] pointer-events-auto">
                        <ul className="bg-[#021624] text-white text-sm border border-cyan-400 rounded-md shadow-xl overflow-hidden backdrop-blur-md">
                            {suggestions.map(user => (
                                <li
                                    key={user.id}
                                    onClick={() => handleSuggestionClick(user.email)}
                                    className="px-4 py-2 cursor-pointer hover:bg-cyan-800 text-white text-sm border-b border-[#021624] last:border-none transition-colors duration-150"
                                    role="option"
                                >
                                    <div className="flex items-center gap-2">
                                        <svg
                                            className="h-4 w-4 text-cyan-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                        </svg>
                                        <span>{user.email}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>,
                    document.body
                )}

            {/* Login Confirmation Modal */}
            {showLoginConfirm && (
                <ConfirmationModal
                    title="Login Required"
                    message="To view full search details and access premium features, you need to login. Would you like to login now?"
                    onConfirm={handleLoginConfirm}
                    onCancel={handleLoginCancel}
                />
            )}
        </>
    );
};

// --- Enhanced AuthModal component ---
const AuthModal = ({ onClose, onLoginSuccess }) => {
    const { addNotification } = useNotification();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async e => {
        e.preventDefault();
        setErrorMsg('');
        if (!email || !password) {
            setErrorMsg('Email and password are required.');
            return;
        }
        if (!isLogin && password !== confirmPassword) {
            setErrorMsg('Passwords do not match.');
            return;
        }
        try {
            if (isLogin) {
                const res = await fetch(`${API}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || errData.message || 'Login failed');
                }
                const data = await res.json();
                onLoginSuccess(data);
                addNotification(`Welcome back, ${data.name || data.email}!`, 'success');
                onClose();
            } else {
                const res = await fetch(`${API}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, name }),
                });
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || errData.message || 'Signup failed');
                }
                await res.json();
                addNotification('Registration successful! Please login with your credentials.', 'success');
                setIsLogin(true);
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setName('');
            }
        } catch (err) {
            setErrorMsg(err.message || 'Error processing request');
        }
    };

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setName('');
        setErrorMsg('');
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999999] flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            style={{
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(8px)'
            }}
        >
            {/* Subtle background effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-gradient-to-br from-cyan-900/20 via-blue-900/10 to-transparent rounded-full blur-[150px] opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
            </div>

            <div
                className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl max-w-sm w-full p-6"
                onClick={e => e.stopPropagation()}
                style={{
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 40px 10px rgba(96, 170, 255, 0.1)'
                }}
            >
                {/* Glass shine effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-30 pointer-events-none"></div>

                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-white/70 hover:text-white text-2xl font-bold transition-colors z-10"
                    aria-label="Close modal"
                    type="button"
                >
                    ×
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-cyan-200/80 text-sm">
                        {isLogin ? 'Sign in to access your account' : 'Join us to protect your data'}
                    </p>
                </div>

                {errorMsg && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
                        <p className="text-red-200 text-sm text-center">{errorMsg}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            autoComplete="email"
                            onChange={e => setEmail(e.target.value)}
                            required
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all"
                        />
                    </div>

                    {!isLogin && (
                        <div>
                            <input
                                type="text"
                                placeholder="Full name (optional)"
                                value={name}
                                autoComplete="name"
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all"
                            />
                        </div>
                    )}

                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            autoComplete={isLogin ? 'current-password' : 'new-password'}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all"
                        />
                    </div>

                    {!isLogin && (
                        <div>
                            <input
                                type="password"
                                placeholder="Confirm password"
                                value={confirmPassword}
                                autoComplete="new-password"
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-3 rounded-lg font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                    >
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-white/70 text-sm">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button
                            type="button"
                            className="text-cyan-400 hover:text-cyan-300 ml-2 font-medium transition-colors"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                resetForm();
                            }}
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
};

// --- Enhanced ChangeUsernameForm component ---
const ChangeUsernameForm = ({ user, onUpdateUser }) => {
    const { addNotification } = useNotification();
    const [name, setName] = useState(user.name || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSave = async () => {
        setMessage('');
        if (!name.trim()) {
            addNotification('Username cannot be empty', 'warning');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API}/users/${encodeURIComponent(user.email)}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) throw new Error('Failed to update username');

            const data = await res.json();
            addNotification('Username updated successfully!', 'success');

            const updatedUser = { ...user, name: data.user.name };
            onUpdateUser(updatedUser);
        } catch (err) {
            addNotification(err.message || 'Error updating username', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-white/90 font-medium mb-2" htmlFor="usernameInput">
                    New Username
                </label>
                <input
                    id="usernameInput"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all"
                    placeholder="Enter new username"
                />
            </div>

            <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className={`w-full py-3 rounded-lg font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] ${loading
                    ? 'bg-gray-500/50 cursor-not-allowed text-white/50'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                    }`}
            >
                {loading ? 'Saving...' : 'Save Username'}
            </button>
        </div>
    );
};

// --- Enhanced ChangePasswordForm component ---
const ChangePasswordForm = ({ user }) => {
    const { addNotification } = useNotification();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            addNotification('Please fill in all password fields', 'warning');
            return;
        }
        if (newPassword !== confirmPassword) {
            addNotification('New passwords do not match', 'error');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API}/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
                body: JSON.stringify({
                    email: user.email,
                    currentPassword,
                    newPassword,
                }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to change password');
            }
            addNotification('Password changed successfully!', 'success');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            addNotification(err.message || 'Error changing password', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-white/90 font-medium mb-2" htmlFor="currentPasswordInput">
                    Current Password
                </label>
                <input
                    id="currentPasswordInput"
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all"
                    placeholder="Enter current password"
                />
            </div>

            <div>
                <label className="block text-white/90 font-medium mb-2" htmlFor="newPasswordInput">
                    New Password
                </label>
                <input
                    id="newPasswordInput"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all"
                    placeholder="Enter new password"
                />
            </div>

            <div>
                <label className="block text-white/90 font-medium mb-2" htmlFor="confirmPasswordInput">
                    Confirm New Password
                </label>
                <input
                    id="confirmPasswordInput"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all"
                    placeholder="Confirm new password"
                />
            </div>

            <button
                type="button"
                onClick={handleChangePassword}
                disabled={loading}
                className={`w-full py-3 rounded-lg font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] ${loading
                    ? 'bg-gray-500/50 cursor-not-allowed text-white/50'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
                    }`}
            >
                {loading ? 'Updating...' : 'Change Password'}
            </button>
        </div>
    );
};

// --- Enhanced SearchHistoryForm component ---
const SearchHistoryForm = ({ user }) => {
    const { addNotification } = useNotification();
    const [searchHistory, setSearchHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.id) {
            fetchSearchHistory();
        }
    }, [user]);

    const fetchSearchHistory = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API}/search-history/${user.id}`, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            });
            if (!res.ok) throw new Error('Failed to fetch search history');

            const data = await res.json();
            setSearchHistory(data);
        } catch (err) {
            addNotification('Error loading search history', 'error');
            console.error('Error fetching search history:', err);
        } finally {
            setLoading(false);
        }
    };

    const deleteHistoryItem = async (historyId) => {
        try {
            const res = await fetch(`${API}/search-history/${historyId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            });
            if (!res.ok) throw new Error('Failed to delete history item');

            setSearchHistory(prev => prev.filter(item => item.id !== historyId));
            addNotification('Search history item deleted', 'success', 3000);
        } catch (err) {
            addNotification('Error deleting history item', 'error');
            console.error('Error deleting history item:', err);
        }
    };

    const clearAllHistory = async () => {
        // Custom confirmation modal would be ideal here, but for now using native confirm
        if (!confirm('Are you sure you want to clear all search history?')) return;

        try {
            const res = await fetch(`${API}/search-history/user/${user.id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            });
            if (!res.ok) throw new Error('Failed to clear search history');

            setSearchHistory([]);
            addNotification('All search history cleared successfully!', 'success');
        } catch (err) {
            addNotification('Error clearing search history', 'error');
            console.error('Error clearing search history:', err);
        }
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Search History</h3>
                {searchHistory.length > 0 && (
                    <button
                        onClick={clearAllHistory}
                        className="text-red-400 hover:text-red-300 text-sm transition-colors flex items-center gap-1"
                    >
                        <FiTrash2 size={14} />
                        Clear All
                    </button>
                )}
            </div>

            <div className="overflow-y-auto max-h-[280px] space-y-2 pr-1 custom-scrollbar">
                {searchHistory.length === 0 ? (
                    <div className="text-center py-8 text-white/60">
                        <FiSearch size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No search history yet</p>
                        <p className="text-sm mt-1">Your searches will appear here</p>
                    </div>
                ) : (
                    searchHistory.map(item => (
                        <div
                            key={item.id}
                            className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FiSearch size={14} className="text-cyan-400" />
                                        <span className="text-white font-medium text-sm">{item.query}</span>
                                        <span className="text-cyan-300 text-xs bg-cyan-900/30 px-2 py-1 rounded">
                                            {item.resultsCount} results
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 text-xs">
                                        <FiClock size={12} />
                                        {formatTimestamp(item.timestamp)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteHistoryItem(item.id)}
                                    className="text-red-400 hover:text-red-300 transition-colors p-1"
                                    title="Delete this search"
                                >
                                    <FiTrash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(135deg, rgba(34, 211, 238, 0.6), rgba(59, 130, 246, 0.6));
                    border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(135deg, rgba(34, 211, 238, 0.8), rgba(59, 130, 246, 0.8));
                    box-shadow: 0 0 10px rgba(34, 211, 238, 0.3);
                }
                
                /* Firefox scrollbar */
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(34, 211, 238, 0.6) rgba(255, 255, 255, 0.05);
                }
            `}</style>
        </div>
    );
};

// --- Enhanced ProfileModal component ---
const ProfileModal = ({ user, onClose, onUpdateUser, onLogout }) => {
    const [activeTab, setActiveTab] = useState('username');

    const handleLogout = () => {
        onLogout();
        onClose();
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999999] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
            style={{
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(8px)'
            }}
        >
            {/* Subtle background effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-gradient-to-br from-cyan-900/20 via-blue-900/10 to-transparent rounded-full blur-[150px] opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
            </div>

            <div
                className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl w-full max-w-md mx-auto max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
                style={{
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 40px 10px rgba(96, 170, 255, 0.1)'
                }}
            >
                {/* Glass shine effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-30 pointer-events-none"></div>

                {/* Scrollable content with custom scrollbar */}
                <div className="overflow-y-auto max-h-[90vh] custom-scrollbar-modal">
                    <div className="p-6">
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 text-white/70 hover:text-white text-2xl font-bold transition-colors z-10"
                            aria-label="Close modal"
                            type="button"
                        >
                            ×
                        </button>

                        <div className="text-center mb-6">
                            <div className="flex items-center justify-center mb-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur opacity-60 animate-pulse"></div>
                                    <div className="relative w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-xl">
                                        <span className="text-white font-bold text-2xl">
                                            {(user?.name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Profile Settings</h2>
                            <p className="text-cyan-200/80 text-sm">Manage your account preferences</p>

                            {/* User Info */}
                            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                                <p className="text-white font-medium text-sm">{user?.name?.trim() || 'Anonymous'}</p>
                                <p className="text-cyan-200/80 text-xs">{user?.email || 'No email'}</p>
                            </div>
                        </div>

                        <div className="flex mb-6">
                            <button
                                type="button"
                                className={`flex-1 py-2 text-center font-medium rounded-l-lg transition-all text-xs ${activeTab === 'username'
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                                    }`}
                                onClick={() => setActiveTab('username')}
                            >
                                USERNAME
                            </button>
                            <button
                                type="button"
                                className={`flex-1 py-2 text-center font-medium transition-all text-xs ${activeTab === 'password'
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                                    }`}
                                onClick={() => setActiveTab('password')}
                            >
                                PASSWORD
                            </button>
                            <button
                                type="button"
                                className={`flex-1 py-2 text-center font-medium rounded-r-lg transition-all text-xs ${activeTab === 'history'
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                                    }`}
                                onClick={() => setActiveTab('history')}
                            >
                                HISTORY
                            </button>
                        </div>

                        <div className="min-h-[300px]">
                            {activeTab === 'username' && <ChangeUsernameForm user={user} onUpdateUser={onUpdateUser} />}
                            {activeTab === 'password' && <ChangePasswordForm user={user} />}
                            {activeTab === 'history' && <SearchHistoryForm user={user} />}
                        </div>

                        {/* Logout Button */}
                        <div className="mt-6 pt-4 border-t border-white/20">
                            <button
                                onClick={handleLogout}
                                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-lg font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                            >
                                <FiLogOut size={18} />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .custom-scrollbar-modal::-webkit-scrollbar {
                        width: 8px;
                    }
                    
                    .custom-scrollbar-modal::-webkit-scrollbar-track {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 12px;
                        margin: 8px;
                    }
                    
                    .custom-scrollbar-modal::-webkit-scrollbar-thumb {
                        background: linear-gradient(135deg, rgba(34, 211, 238, 0.7), rgba(59, 130, 246, 0.7));
                        border-radius: 12px;
                        border: 2px solid rgba(255, 255, 255, 0.1);
                        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
                    }
                    
                    .custom-scrollbar-modal::-webkit-scrollbar-thumb:hover {
                        background: linear-gradient(135deg, rgba(34, 211, 238, 0.9), rgba(59, 130, 246, 0.9));
                        box-shadow: 0 0 15px rgba(34, 211, 238, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3);
                        transform: scale(1.1);
                    }
                    
                    .custom-scrollbar-modal::-webkit-scrollbar-corner {
                        background: transparent;
                    }
                    
                    /* Firefox scrollbar */
                    .custom-scrollbar-modal {
                        scrollbar-width: thin;
                        scrollbar-color: rgba(34, 211, 238, 0.7) rgba(255, 255, 255, 0.05);
                    }
                `}</style>
            </div>
        </div>,
        document.body
    );
};

// --- Enhanced ProfileButton component ---
const ProfileButton = ({ user, onOpenProfileModal, onLogout }) => {
    const getUserInitial = () => {
        if (user?.name?.trim()) {
            return user.name.trim().charAt(0).toUpperCase();
        }
        if (user?.email) {
            return user.email.charAt(0).toUpperCase();
        }
        return 'U';
    };

    return (
        <div className="flex items-center space-x-2">
            {/* Profile Settings Button */}
            <div className="relative group">
                {/* Glowing ring effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-xl opacity-70 group-hover:opacity-100 blur-sm transition-all duration-500 animate-pulse"></div>

                {/* Main button */}
                <button
                    onClick={onOpenProfileModal}
                    className="relative inline-flex items-center rounded-xl border border-white/30 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-md px-4 py-2 text-sm font-medium text-white shadow-lg hover:shadow-xl focus:outline-none cursor-pointer transition-all duration-300 transform hover:scale-105 active:scale-95"
                    aria-label="Open profile settings"
                    type="button"
                    style={{
                        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                >
                    {/* User Avatar with initial */}
                    <div className="relative mr-2">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur opacity-60 animate-pulse"></div>
                        <div className="relative w-6 h-6 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                                {getUserInitial()}
                            </span>
                        </div>
                    </div>

                    {/* Username with gradient text */}
                    <span className="bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent font-semibold mr-2">
                        {user?.name?.trim() || user?.email || 'User'}
                    </span>

                    {/* Settings icon */}
                    <FiSettings size={16} className="text-cyan-300" />
                </button>
            </div>

            {/* Quick Logout Button */}
            <div className="relative group">
                {/* Glowing ring effect for logout */}
                <div className="absolute -inset-1 bg-gradient-to-r from-red-400 via-red-500 to-red-600 rounded-xl opacity-60 group-hover:opacity-100 blur-sm transition-all duration-500"></div>

                <button
                    onClick={onLogout}
                    className="relative inline-flex items-center justify-center rounded-xl border border-red-300/30 bg-gradient-to-r from-red-500/20 to-red-600/20 backdrop-blur-md p-2 text-red-300 hover:text-white shadow-lg hover:shadow-xl focus:outline-none cursor-pointer transition-all duration-300 transform hover:scale-110 active:scale-95 group"
                    aria-label="Quick logout"
                    title="Logout"
                    type="button"
                    style={{
                        boxShadow: '0 4px 16px 0 rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                >
                    <FiLogOut size={16} className="group-hover:animate-pulse" />
                </button>
            </div>
        </div>
    );
};

// --- AnimatedLoginButton (unchanged) ---
const AnimatedLoginButton = ({ onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="bg-white text-center w-32 h-10 rounded-xl relative text-black text-sm font-semibold group overflow-hidden"
        aria-label="Login"
    >
        <div className="bg-blue-400 rounded-lg h-8 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[118px] z-30 duration-500 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" height="18px" width="18px" aria-hidden="true">
                <path d="M160 480h640a32 32 0 1 1 0 64H160a32 32 0 1 1 0-64z" fill="#000000" />
                <path
                    d="M786.752 512 521.344 776.96a32 32 0 1 0 45.312 45.312l288-288a32 32 0 0 0 0-45.312l-288-288a32 32 0 1 0-45.312 45.312L786.752 512z"
                    fill="#000000"
                />
            </svg>
        </div>
        <p className="translate-x-2 relative z-20 transition-all duration-300 group-hover:text-white">LOGIN</p>
    </button>
);

// --- Header component ---
const Header = () => {
    const { addNotification } = useNotification();
    const [authenticatedUser, setAuthenticatedUser] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            const email = localStorage.getItem('email');
            const name = localStorage.getItem('userName');
            const id = localStorage.getItem('userId');
            if (token && email) {
                setAuthenticatedUser({ token, email, name, id });
            }
        }
    }, []);

    const openAuthModal = () => setShowAuthModal(true);
    const closeAuthModal = () => setShowAuthModal(false);

    const openProfileModal = () => setShowProfileModal(true);
    const closeProfileModal = () => setShowProfileModal(false);

    const handleLoginSuccess = userData => {
        setAuthenticatedUser(userData);
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', userData.token);
            localStorage.setItem('email', userData.email);
            localStorage.setItem('userName', userData.name || '');
            localStorage.setItem('userId', userData.id || '');
        }
        closeAuthModal();
    };

    const handleLogout = () => {
        setAuthenticatedUser(null);
        setShowProfileModal(false);
        addNotification('You have been logged out successfully', 'info', 3000);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('email');
            localStorage.removeItem('userName');
            localStorage.removeItem('userId');
        }
    };

    const handleUpdateUser = updatedUser => {
        setAuthenticatedUser(updatedUser);
        if (typeof window !== 'undefined') {
            localStorage.setItem('userName', updatedUser.name || '');
        }
    };

    return (
        <>
            <header className="py-4 px-6 bg-none backdrop-blur-md">
                <div className="flex items-center justify-between max-w-7xl mx-auto gap-6 w-full">
                    <a
                        href="https://deepcytes.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Deepcytes Homepage"
                    >
                        <img
                            src="/1.png"
                            alt="Deepcytes Logo"
                            className="h-12 rounded-lg transition-transform duration-300 hover:scale-105 p-1"
                            onError={e => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = 'https://placehold.co/100x40/333/fff?text=Logo';
                            }}
                            loading="lazy"
                        />
                    </a>

                    <div className="flex-1 flex justify-center">
                        <SearchInput
                            isAuthenticated={!!authenticatedUser}
                            promptLogin={openAuthModal}
                            user={authenticatedUser}
                        />
                    </div>

                    <div className="flex-shrink-0">
                        {authenticatedUser ? (
                            <ProfileButton
                                user={authenticatedUser}
                                onOpenProfileModal={openProfileModal}
                                onLogout={handleLogout}
                            />
                        ) : (
                            <AnimatedLoginButton onClick={openAuthModal} />
                        )}
                    </div>
                </div>
            </header>

            {showAuthModal && <AuthModal onClose={closeAuthModal} onLoginSuccess={handleLoginSuccess} />}

            {showProfileModal && authenticatedUser && (
                <ProfileModal
                    user={authenticatedUser}
                    onClose={closeProfileModal}
                    onUpdateUser={handleUpdateUser}
                    onLogout={handleLogout}
                />
            )}
        </>
    );
};

// --- Main exported component wrapped with NotificationProvider ---
const HeaderWithNotifications = () => {
    return (
        <NotificationProvider>
            <Header />
        </NotificationProvider>
    );
};

export default HeaderWithNotifications;