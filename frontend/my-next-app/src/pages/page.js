export default function Home() {
  return (
    <main className="bg-black text-white font-sans">
    {/* Header Section */}
      <header className="flex items-center justify-between px-10 py-5 bg-black text-white border-b border-gray-800">
        {/* Logo / Brand */}
        <div className="font-bold text-xl">🔒 DeepCytes</div>

        {/* Navigation */}
        <nav className="hidden md:flex gap-6 text-sm">
          <a href="#" className="hover:text-purple-400">How it works</a>
          <a href="#" className="hover:text-purple-400">Blog</a>
          <a href="#" className="hover:text-purple-400">About</a>
          <a href="#" className="hover:text-purple-400">Contact</a>
        </nav>

        {/* Get Started Button */}
        <div>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-md text-sm">
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
    
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between px-30 py-15">
        <div>
          <h1 className="text-4xl font-bold mb-4">Check if your data is exposed</h1>
          <p className="mb-6 max-w-md">DeepCytes provides real-time monitoring for data leaks and breaches.</p>
          <div className="flex gap-4">
            <button className="bg-purple-600 text-white px-6 py-3 rounded-md">Start Now</button>
            <button className="border border-gray-400 text-white px-6 py-3 rounded-md">Check Data</button>
          </div>
        </div>
        <img src="/image.png" alt="Lock" className="max-w-xs mt-10 md:mt-0" />
      </section>

      {/* Status Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 text-center py-10 bg-[#121212]">
        <div>
          <h2 className="text-xl font-bold">Secure</h2>
          <p className="text-sm text-gray-400">Security Status</p>
        </div>
        <div>
          <h2 className="text-xl font-bold">Low</h2>
          <p className="text-sm text-gray-400">Current Threat Level</p>
        </div>
        <div>
          <h2 className="text-xl font-bold">1,256</h2>
          <p className="text-sm text-gray-400">Total Monitored</p>
        </div>
        <div>
          <h2 className="text-xl font-bold">5</h2>
          <p className="text-sm text-gray-400">Alerts Active</p>
        </div>
      </section>

      {/* Shield Section */}
      <section className="flex flex-col md:flex-row items-center justify-between px-10 py-20 bg-[#1a1a1a]">
        <img src="/hacker.png" alt="Hacker" className="max-w-xs mb-10 md:mb-0" />
        <div>
          <h2 className="text-2xl font-bold mb-4">Deepcytes is your shield in the digital world.</h2>
          <p className="mb-6 max-w-md text-sm text-gray-400">
            With DeepCytes, you can ensure your personal data is safe from cyber threats and breaches.
          </p>
          <button className="bg-purple-600 text-white px-6 py-3 rounded-md">Join DataGuard</button>
        </div>
      </section>

      {/* Rating Section */}
      <section className="text-center py-20 bg-[#121212]">
        <h2 className="text-2xl font-bold mb-2">User Satisfaction Rating</h2>
        <p className="mb-4 text-gray-400">DeepCytes protects your data with advanced encryption and monitoring.</p>
        <div className="text-6xl font-bold text-purple-500">4.9</div>
      </section>

      {/* Testimonial / Call to Action */}
      <section className="flex flex-col md:flex-row items-center justify-between px-10 py-20 bg-[#1a1a1a]">
        <img src="/analyst.png" alt="Analyst" className="max-w-xs mb-10 md:mb-0" />
        <div>
          <p className="mb-6 max-w-md text-sm text-gray-400">
            DeepCytes is the leading solution for protecting your online presence and personal information.
          </p>
          <button className="bg-purple-600 text-white px-6 py-3 rounded-md">Get Started</button>
        </div>
      </section>

      {/* Logos */}
      <section className="py-10 text-center bg-black">
        <h2 className="text-xl font-bold mb-6">Trusted by</h2>
        <div className="flex flex-wrap justify-center gap-8">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="text-white opacity-40">Logo</div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-black text-sm text-gray-500 px-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-white font-bold mb-2">deepcytes</h3>
          <p>2025 © Deepcytes. All rights reserved.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-2">Company</h4>
          <ul>
            <li>Home</li>
            <li>Feature</li>
            <li>About us</li>
            <li>Contact</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-2">Social</h4>
          <ul>
            <li>Facebook</li>
            <li>Twitter</li>
            <li>Instagram</li>
            <li>LinkedIn</li>
          </ul>
        </div>
      </footer>
    </main>
  );
}
