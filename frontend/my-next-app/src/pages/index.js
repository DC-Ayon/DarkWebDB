// pages/index.js
import React, { useState, useEffect, useRef } from 'react';
import Header from './header';
import Footer from './footer';
import AnimatedCounter from './AnimatedCounter';

// --- Animated hacker terminal component ---
const hackerMessages = [
  { type: 'command', text: 'nmap -sS -O target.darknet.onion', color: 'text-cyan-400' },
  { type: 'code', text: 'import socket, threading, sys', color: 'text-green-300' },
  { type: 'code', text: 'def exploit_buffer_overflow(target, port):', color: 'text-green-300' },
  { type: 'code', text: '    payload = "A" * 1024 + struct.pack("<I", 0x08048abc)', color: 'text-green-300' },
  { type: 'scan', text: '[+] 192.168.1.1:22   SSH-2.0-OpenSSH_7.4 [VULNERABLE]', color: 'text-red-400' },
  { type: 'scan', text: '[+] 192.168.1.1:80   HTTP/1.1 Apache/2.4.41 [EXPLOIT FOUND]', color: 'text-orange-400' },
  { type: 'code', text: 'shell = subprocess.Popen(["/bin/bash"], stdin=PIPE)', color: 'text-green-300' },
  { type: 'command', text: 'sqlmap -u "http://target/login.php" --dbs', color: 'text-cyan-400' },
  { type: 'data', text: '[INFO] retrieved: information_schema', color: 'text-blue-400' },
  { type: 'data', text: '[INFO] retrieved: user_credentials', color: 'text-blue-400' },
  { type: 'exploit', text: '[!] ROOT SHELL OBTAINED on 10.0.0.5', color: 'text-red-500' },
  { type: 'scan', text: '[+] Port 443: SSL cert expired - MiTM possible', color: 'text-yellow-400' },
  { type: 'command', text: 'metasploit > use exploit/multi/handler', color: 'text-cyan-400' },
  { type: 'scan', text: '[+] 172.16.1.100:1433 MSSQL Server [DEFAULT CREDS]', color: 'text-orange-400' },
  { type: 'code', text: 'os.system("nc -lvnp 4444")', color: 'text-green-300' },
  { type: 'exploit', text: '[!] PRIVILEGE ESCALATION SUCCESSFUL', color: 'text-red-500' },
  { type: 'command', text: 'hashcat -m 1000 hashes.txt rockyou.txt', color: 'text-cyan-400' },
  { type: 'data', text: '$1$salt$5v5tMzrjX8la2BYzaUqoa.:password123', color: 'text-purple-400' },
  { type: 'scan', text: '[+] WiFi: NETGEAR_5G [WPS PIN: 12345670]', color: 'text-yellow-400' },
  { type: 'code', text: 'def create_backdoor(target_ip, port=4444):', color: 'text-green-300' },
  { type: 'exploit', text: '[!] PERSISTENCE ESTABLISHED - BACKDOOR ACTIVE', color: 'text-red-500' },
  { type: 'command', text: 'john --wordlist=/usr/share/wordlists/rockyou.txt shadow', color: 'text-cyan-400' }
];

const AnimatedTerminalScreen = () => {
  const [lines, setLines] = useState([]);  // lines fully typed out
  const [currentLine, setCurrentLine] = useState(''); // line currently being typed
  const [messageIndex, setMessageIndex] = useState(0); // position in hackerMessages
  const [charIndex, setCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanStats, setScanStats] = useState({
    portsScanned: 65535,
    hostsFound: 247,
    vulnerabilities: 18,
    exploits: 5
  });

  const [cpuUsage, setCpuUsage] = useState(0);
  const [ramUsage, setRamUsage] = useState(0);
  const [netUsage, setNetUsage] = useState(0);
  const [sessionNumber, setSessionNumber] = useState(null);

  const [lineTimestamps, setLineTimestamps] = useState([]);

  const scrollRef = useRef();

  const getTimeString = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: false });
  };

  // Initialize session number once on client only
  useEffect(() => {
    setSessionNumber(Math.floor(Math.random() * 999) + 1);
  }, []);

  // Infinite typing effect
  useEffect(() => {
    if (!isTyping) {
      setIsTyping(true);
      setCurrentLine('');
      setCharIndex(0);
    }
  }, [messageIndex, isTyping]);

  useEffect(() => {
    if (isTyping) {
      const msg = hackerMessages[messageIndex];
      const typeDelay = msg.type === 'command' ? 20 + Math.random() * 10 : 18 + Math.random() * 20;
      const timeout = setTimeout(() => {
        if (charIndex < msg.text.length) {
          setCurrentLine(prev => prev + msg.text[charIndex]);
          setCharIndex(prev => prev + 1);
        } else {
          setLines(prev => {
            const newLine = { ...msg, text: msg.text + (msg.type === 'exploit' ? ' ⚠' : '') };
            const newLines = [...prev, newLine];

            setLineTimestamps(prevTs => {
              const timestamp = (msg.type === 'scan' || msg.type === 'command') ? getTimeString() : null;
              const newTimestamps = [...prevTs, timestamp];
              return newTimestamps.length > 14 ? newTimestamps.slice(-14) : newTimestamps;
            });

            return newLines.length > 14 ? newLines.slice(-14) : newLines;
          });
          setCurrentLine('');
          setIsTyping(false);
          setTimeout(() => setMessageIndex(prev => (prev + 1) % hackerMessages.length), 140 + Math.random() * 180);
        }
      }, typeDelay);
      return () => clearTimeout(timeout);
    }
  }, [isTyping, charIndex, messageIndex, lines.length]);

  // Animate scan/progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        let speed = Math.random() * 2 + 1.5;
        if (prev > 100) return Math.random() * 10 + 18;
        return prev + speed;
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Animate system scan stats
  useEffect(() => {
    const interval = setInterval(() => {
      setScanStats(prev => ({
        portsScanned: prev.portsScanned + Math.floor(Math.random() * 40) + 9,
        hostsFound: prev.hostsFound + Math.floor(Math.random() * 2),
        vulnerabilities: prev.vulnerabilities + (Math.random() > 0.7 ? 1 : 0),
        exploits: prev.exploits + (Math.random() > 0.92 ? 1 : 0)
      }));
    }, 1700);
    return () => clearInterval(interval);
  }, []);

  // Animate CPU, RAM, NET usage on client only
  useEffect(() => {
    function updateUsage() {
      setCpuUsage(Math.floor(40 + Math.random() * 30));
      setRamUsage(Math.floor(60 + Math.random() * 25));
      setNetUsage(Math.floor(Math.random() * 100));
    }
    updateUsage();
    const interval = setInterval(updateUsage, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto scroll terminal window
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, currentLine]);

  return (
    <div
      className="relative w-96 h-72 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl border-4 border-gray-700"
      style={{ transform: 'rotateY(-8deg) rotateX(2deg)' }}
    >
      {/* Screen Glow */}
      <div className="absolute -inset-3 bg-cyan-500/30 blur-xl rounded-xl"></div>

      {/* Terminal */}
      <div className="relative w-full h-full bg-black rounded-lg overflow-hidden p-2">
        <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded text-xs font-mono overflow-hidden">
          {/* Terminal Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-3 py-1.5 flex items-center justify-between border-b border-gray-600">
            <span className="text-cyan-300 font-bold text-xs">root@kali:~# DeepSearch DarkWeb</span>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          {/* Terminal Content */}
          <div className="p-3 h-full flex flex-col">
            {/* Initial command */}
            <div className="text-xs mb-1">
              <span className="text-red-400">root@kali:~#</span>
              <span className="text-cyan-300 ml-1">./exploit_scan.py --target darknet.onion</span>
            </div>

            {/* Scanning Progress Section */}
            <div className="text-xs space-y-1 mb-2">
              <div className="text-yellow-300">[*] Network reconnaissance in progress...</div>
              <div className="flex items-center space-x-2">
                <div className="bg-gray-700 rounded h-1 flex-1 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-gray-400 text-xs">{Math.floor(progress)}%</span>
              </div>
              <div className="text-gray-400 text-xs">
                Ports: {scanStats.portsScanned} | Hosts: {scanStats.hostsFound} | Vulns: {scanStats.vulnerabilities}
              </div>
            </div>

            {/* Auto-scrolling Terminal */}
            <div className="flex-1 overflow-y-auto terminal-scroll scrollbar-hide" ref={scrollRef}>
              <div className="space-y-0.5 text-xs font-mono">
                {lines.map((line, index) => (
                  <div key={index} className={`${line.color} animate-slideUp`}>
                    {line.type === 'command' && <span className="text-red-400">root@kali:~# </span>}
                    {(line.type === 'scan' || line.type === 'command') && (
                      <span className="text-gray-500">
                        [{lineTimestamps[index] ?? ''}]
                      </span>
                    )}
                    {line.text}
                  </div>
                ))}
                {/* Current typing line */}
                {isTyping && (
                  <div className={`${hackerMessages[messageIndex]?.color || 'text-white'}`}>
                    {hackerMessages[messageIndex]?.type === 'command' && <span className="text-red-400">root@kali:~# </span>}
                    {hackerMessages[messageIndex]?.type === 'scan' && <span className="text-gray-500">[{getTimeString()}] </span>}
                    {currentLine}
                    <span className="animate-pulse bg-green-400 text-black">█</span>
                  </div>
                )}
              </div>
            </div>

            {/* Live System Status */}
            <div className="mt-1 space-y-0.5 text-xs border-t border-gray-700 pt-1">
              <div className="flex justify-between text-gray-400">
                <span>
                  CPU: <span className="text-red-400">{cpuUsage}%</span>
                </span>
                <span>
                  RAM: <span className="text-yellow-400">{ramUsage}%</span>
                </span>
                <span>
                  NET: <span className="text-green-400">{netUsage} KB/s</span>
                </span>
              </div>
              <div className="text-cyan-300 text-xs">
                Active exploits: {scanStats.exploits} | Session: {sessionNumber ?? '...'}
              </div>
            </div>

            {/* Command prompt - always visible */}
            <div className="flex items-center mt-1 border-t border-gray-700 pt-1">
              <span className="text-red-400 text-xs">root@kali:~#</span>
              <span className="ml-1 text-green-400 animate-pulse">█</span>
            </div>
          </div>

          {/* Critical Alert Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-red-900/60 border-t border-red-500/60 p-1.5">
            <div className="text-red-300 text-xs flex items-center justify-between">
              <span className="flex items-center">
                <span className="animate-bounce mr-1">🚨</span>
                SYSTEM COMPROMISED - {scanStats.vulnerabilities} active exploits
              </span>
              <span className="animate-pulse">UNAUTHORIZED ACCESS</span>
            </div>
          </div>
        </div>

        {/* Animated scan lines */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 animate-pulse" />
        <div className="absolute top-8 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-40 animate-bounce" />

        {/* Screen Reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-cyan-400/3 rounded-lg pointer-events-none" />
      </div>

      {/* Monitor Details */}
      <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gray-700 rounded-full shadow-xl" />
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-gradient-to-r from-gray-600 to-gray-700 rounded-b-xl" />
      <div className="absolute bottom-2 right-4 w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50">
        <div className="w-full h-full animate-pulse"></div>
      </div>
      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        /* Terminal custom scrollbar */
        .terminal-scroll::-webkit-scrollbar { width: 4px; }
        .terminal-scroll::-webkit-scrollbar-track { background: #1a1a1a; }
        .terminal-scroll::-webkit-scrollbar-thumb { background: #00ff00; border-radius: 2px; }
      `}</style>
    </div>
  );
};

// --- Main page ---
export default function HomePage() {
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

        <div className="absolute top-1/2 left-1/2 w-[900px] h-[900px] bg-gradient-to-br from-cyan-900 via-blue-900 to-black rounded-full blur-[200px] opacity-40 animate-pulse -translate-x-1/2 -translate-y-1/2 z-20"></div>
        <div className="absolute top-[-80px] left-[-80px] w-[300px] h-[300px] rounded-full bg-cyan-900 opacity-10 blur-3xl z-10 animate-pulse"></div>
        <div className="absolute top-[20%] right-[-100px] w-[250px] h-[250px] rounded-full bg-blue-900 opacity-10 blur-3xl z-10 animate-bounce"></div>
        <div className="absolute bottom-[-100px] left-[30%] w-[200px] h-[200px] rounded-full bg-cyan-800 opacity-10 blur-3xl z-10 animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[180px] h-[180px] rounded-full bg-blue-950 opacity-20 blur-2xl z-10"></div>
        <div className="absolute left-[60%] top-[15%] w-40 h-40 bg-cyan-800 rounded-full blur-2xl opacity-20 animate-pulse z-20"></div>

        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M200 600 Q400 500 600 600 T1000 600" stroke="#60aaff22" strokeWidth="2" fill="none" className="animate-pulse" />
          <rect x="1100" y="250" width="200" height="200" rx="50" stroke="#60aaff11" strokeWidth="2" fill="none" className="animate-pulse" />
        </svg>

        <div
          className="absolute inset-0 rounded-2xl border border-[#60aaff11] pointer-events-none z-30"
          style={{ boxShadow: '0 0 40px 10px #60aaff11' }}
        ></div>
      </div>

      {/* Header */}
      <Header />

      <main className="relative z-10 flex flex-col items-center justify-start w-full px-6 md:px-20 py-12 space-y-16 pt-30">
        {/* Hero Section - Animated 3D Computer */}
        <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 max-w-7xl">
          {/* Left side */}
          <div className="w-full lg:w-1/2 flex justify-start">
            <div className="glass-shine-container w-full max-w-xl bg-white/10 backdrop-blur-md rounded-2xl shadow-lg p-8 border border-white/20">
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight mb-4 text-white drop-shadow-lg">
                <span className="text-cyan-400">Check</span> If Your Data <br /> Is Exposed
              </h1>
              <p className="text-base text-cyan-100 max-w-lg mb-6">
                Our modern Security Service keeps your systems & business healthy. Try it free today.
              </p>
              <div className="flex space-x-4">
                <button className="px-6 py-2 bg-cyan-600/60 text-white/90 rounded-lg font-semibold hover:bg-cyan-700/70 backdrop-blur-md border border-cyan-300/20 shadow-md transition-all transform hover:scale-105">
                  Get Started
                </button>
                <button className="px-6 py-2 bg-white/10 border border-cyan-300/20 text-cyan-100 rounded-lg font-semibold hover:bg-white/20 backdrop-blur-md shadow-md transition-all transform hover:scale-105">
                  Learn more
                </button>
              </div>
            </div>
          </div>

          {/* Right side - Animated 3D Computer */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-start lg:pl-8">
            <div className="relative" style={{ perspective: '1200px' }}>
              {/* Computer Base/Stand */}
              <div
                className="absolute bottom-0 left-1/2 w-36 h-10 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg shadow-xl"
                style={{ transform: 'translateX(-50%) rotateX(75deg)' }}
              ></div>
              {/* Animated Terminal Screen */}
              <AnimatedTerminalScreen />
              {/* Floating Animated Elements */}
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full">
                <div className="w-full h-full animate-ping"></div>
              </div>
              <div className="absolute top-1/4 -right-4 w-1.5 h-1.5 bg-orange-400 rounded-full">
                <div className="w-full h-full animate-bounce"></div>
              </div>
              <div className="absolute top-1/2 -right-6 w-2 h-2 bg-yellow-400 rounded-full">
                <div className="w-full h-full animate-pulse"></div>
              </div>
              {/* Holographic Rings */}
              <div className="absolute -top-8 -right-8 w-32 h-32 border border-red-400/15 rounded-full animate-spin" style={{ animationDuration: '8s' }}></div>
              <div className="absolute -top-4 -right-4 w-20 h-20 border border-cyan-400/20 rounded-full animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}></div>
            </div>
          </div>
        </div>

        {/* Section: Status Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-6xl">
          {[
            { label: 'Security Status', value: 'Secure', color: 'text-green-400' },
            { label: 'Current Threat Level', value: 'Low', color: 'text-yellow-400' },
            { label: 'Total Monitored', value: <AnimatedCounter value={1256} />, color: 'text-blue-400' },
            { label: 'Alerts Active', value: <AnimatedCounter value={110} />, color: 'text-red-500' },
          ].map((item, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-md rounded-2xl shadow-lg p-6 border border-white/20 text-center hover:bg-white/15 transition-all transform hover:scale-105">
              <p className={`${item.color} font-bold text-xl animate-pulse`}>{item.value}</p>
              <p className="text-sm text-white/80">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Why Choose Us */}
        <div className="w-full max-w-3xl bg-white/10 backdrop-blur-md rounded-2xl shadow-lg p-8 border border-white/20 hover:bg-white/15 transition-all">
          <h2 className="text-2xl font-bold text-white mb-4 drop-shadow-sm">Why Choose Us?</h2>
          <ul className="list-disc list-inside text-cyan-100 space-y-2 text-sm leading-relaxed">
            <li className="hover:text-cyan-200 transition-colors">AI-powered breach detection engine</li>
            <li className="hover:text-cyan-200 transition-colors">Real-time alert system for leaked credentials</li>
            <li className="hover:text-cyan-200 transition-colors">Weekly security audit reports sent to your inbox</li>
            <li className="hover:text-cyan-200 transition-colors">Simple dashboard to monitor data exposure</li>
            <li className="hover:text-cyan-200 transition-colors">GDPR and HIPAA compliant systems</li>
          </ul>
        </div>

        {/* Digital Protection */}
        <div className="w-full max-w-3xl bg-white/10 backdrop-blur-md rounded-2xl shadow-lg p-8 text-center border border-white/20 hover:bg-white/15 transition-all">
          <h3 className="text-white text-xl mb-4">Deepcytes is your shield in the digital world.</h3>
          <p className="text-cyan-100 mb-4">With DeepCytes, you can ensure your personal data is safe from cyber threats and breaches.</p>
          <button className="px-6 py-2 bg-fuchsia-600 text-white rounded-lg shadow hover:bg-fuchsia-700 transition-all transform hover:scale-105">
            Join Dataguard
          </button>
        </div>

        {/* User Rating */}
        <div className="w-full max-w-3xl bg-white/10 backdrop-blur-md rounded-2xl shadow-lg p-8 text-center border border-white/20 hover:bg-white/15 transition-all">
          <h3 className="text-white text-2xl mb-2 font-semibold">User Satisfaction Rating</h3>
          <p className="text-cyan-100 mb-4">DeepCytes protects your data with advanced encryption and monitoring.</p>
          <div className="text-5xl font-bold text-purple-400 mb-2 animate-pulse">4.9</div>
          <div className="flex justify-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-yellow-400 text-xl animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
                ★
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="w-full max-w-3xl bg-white/10 backdrop-blur-md rounded-2xl shadow-lg p-8 text-center border border-white/20 hover:bg-white/15 transition-all">
          <h3 className="text-white text-2xl mb-4 font-semibold">
            DeepCytes is the leading solution for protecting your online presence and personal information.
          </h3>
          <button className="px-6 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition-all transform hover:scale-105">
            Get Started
          </button>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
