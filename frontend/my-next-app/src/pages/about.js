import React from 'react';
import Header from './header'; 
import Footer from './footer'; 

// Main App component
const App = () => {
  return (
    <div className="min-h-screen bg-black text-gray-100 font-inter relative overflow-hidden">
      {/* Moving Gradient Background Effect (behind stars) */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="animate-gradient-xy w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-gray-900"></div>
      </div>

      {/* Starry Background Effect */}
      <div className="absolute inset-0 z-[1]"> {/* Z-index to place stars above gradient but below content */}
        {Array.from({ length: 150 }).map((_, i) => (
          <div
            key={i}
            className="star absolute bg-white rounded-full"
            style={{
              width: `${Math.random() * 2 + 1}px`, // Random size from 1px to 3px
              height: `${Math.random() * 2 + 1}px`,
              top: `${Math.random() * 100}%`, // Random vertical position
              left: `${Math.random() * 100}%`, // Random horizontal position
              animationDelay: `${Math.random() * 5}s`, // Random delay for twinkling effect
              animationDuration: `${Math.random() * 3 + 2}s`, // Random duration for twinkling effect
            }}
          ></div>
        ))}
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10"> {/* Ensures content is above background effects */}
        <Header /> {/* Render the Header component */}

        <main className="container mx-auto px-4 py-12">
          {/* About Section */}
          <section className="text-center py-16">
            <h1 className="text-4xl font-bold mb-4 text-gray-50">About</h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
              Deepcytes is experienced and secure cyber solutions provider, protecting your critical data.
            </p>
            {/* Placeholder for shield icon with enhanced styling */}
            <div className="w-48 h-48 mx-auto relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-gray-400 rounded-full blur-xl opacity-70 animate-pulse"></div>
              <div className="relative w-full h-full bg-gradient-to-br from-blue-600 to-gray-500 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-500">
                <svg className="w-32 h-32 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4zm0 10.99V20c-3.73-1.29-6.5-5.07-6.5-9.99V7.07l6.5-2.93 6.5 2.93V11c0 4.92-2.77 8.7-6.5 9.99z"/>
                </svg>
              </div>
            </div>
          </section>

          {/* Our Mission Section */}
          <section className="text-center py-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-50">Our mission</h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              At Deepcytes, we strive to protect your personal information and enhance your digital privacy. Our mission is to empower individuals and businesses with cutting-edge cybersecurity solutions that safeguard their data from evolving threats. We are committed to fostering a secure online environment where trust and confidentiality are paramount.
            </p>
          </section>

          {/* Protect Your Data Section */}
<section className="flex flex-col items-center justify-center py-16 space-y-10">
  <h2 className="text-4xl font-bold text-gray-50 text-center whitespace-nowrap">
    Protect your data today!
  </h2>

  {/* Shield Icon */}
  <div className="w-48 h-48 relative">
    <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-blue-500 rounded-full blur-xl opacity-70 animate-pulse-slow"></div>
    <div className="relative w-full h-full bg-gradient-to-br from-gray-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-500">
      <svg className="w-32 h-32 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4zm0 10.99V20c-3.73-1.29-6.5-5.07-6.5-9.99V7.07l6.5-2.93 6.5 2.93V11c0 4.92-2.77 8.7-6.5 9.99z"/>
      </svg>
    </div>
  </div>
</section>


          {/* Team Section */}
          <section className="text-center py-16">
            <h2 className="text-3xl font-bold mb-2 text-gray-50">Team</h2>
            <p className="text-gray-400 mb-12">Meet the experts safeguarding your information</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
              {/* Team Member 1 */}
              <div className="flex flex-col items-center group transform hover:scale-105 transition-transform duration-300">
                <img src="https://placehold.co/100x100/333/fff?text=AJ" alt="Alex Johnson" className="w-24 h-24 rounded-full object-cover mb-2 border-2 border-purple-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300" />
                <p className="font-semibold text-gray-50">Alex Johnson</p>
                <p className="text-gray-400 text-sm">CEO & Founder</p>
              </div>
              {/* Team Member 2 */}
              <div className="flex flex-col items-center group transform hover:scale-105 transition-transform duration-300">
                <img src="https://placehold.co/100x100/333/fff?text=JS" alt="Jordan Smith" className="w-24 h-24 rounded-full object-cover mb-2 border-2 border-blue-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300" />
                <p className="font-semibold text-gray-50">Jordan Smith</p>
                <p className="text-gray-400 text-sm">Chief Technology Officer</p>
              </div>
              {/* Team Member 3 */}
              <div className="flex flex-col items-center group transform hover:scale-105 transition-transform duration-300">
                <img src="https://placehold.co/100x100/333/fff?text=UL" alt="Emily Chen" className="w-24 h-24 rounded-full object-cover mb-2 border-2 border-purple-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300" />
                <p className="font-semibold text-gray-50">Emily Chen</p>
                <p className="text-gray-400 text-sm">Lead Security Analyst</p>
              </div>
              {/* Team Member 4 */}
              <div className="flex flex-col items-center group transform hover:scale-105 transition-transform duration-300">
                <img src="https://placehold.co/100x100/333/fff?text=UM" alt="Megan Black" className="w-24 h-24 rounded-full object-cover mb-2 border-2 border-blue-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300" />
                <p className="font-semibold text-gray-50">Megan Black</p>
                <p className="text-gray-400 text-sm">Product Development</p>
              </div>
              {/* Team Member 5 */}
              <div className="flex flex-col items-center group transform hover:scale-105 transition-transform duration-300">
                <img src="https://placehold.co/100x100/333/fff?text=CB" alt="Chris Brown" className="w-24 h-24 rounded-full object-cover mb-2 border-2 border-purple-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300" />
                <p className="font-semibold text-gray-50">Chris Brown</p>
                <p className="text-gray-400 text-sm">Head of Support</p>
              </div>
              {/* Team Member 6 */}
              <div className="flex flex-col items-center group transform hover:scale-105 transition-transform duration-300">
                <img src="https://placehold.co/100x100/333/fff?text=TS" alt="Taylor Green" className="w-24 h-24 rounded-full object-cover mb-2 border-2 border-blue-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300" />
                <p className="font-semibold text-gray-50">Taylor Green</p>
                <p className="text-gray-400 text-sm">Customer Support</p>
              </div>
              {/* Team Member 7 */}
              <div className="flex flex-col items-center group transform hover:scale-105 transition-transform duration-300">
                <img src="https://placehold.co/100x100/333/fff?text=JW" alt="Jamie White" className="w-24 h-24 rounded-full object-cover mb-2 border-2 border-purple-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300" />
                <p className="font-semibold text-gray-50">Jamie White</p>
                <p className="text-gray-400 text-sm">Account Manager</p>
              </div>
              {/* Team Member 8 */}
              <div className="flex flex-col items-center group transform hover:scale-105 transition-transform duration-300">
                <img src="https://placehold.co/100x100/333/fff?text=MB" alt="Marcus Bell" className="w-24 h-24 rounded-full object-cover mb-2 border-2 border-blue-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300" />
                <p className="font-semibold text-gray-50">Marcus Bell</p>
                <p className="text-gray-400 text-sm">Security Consultant</p>
              </div>
            </div>
          </section>

          {/* Join Deepcytes Section */}
          <section className="bg-gray-800 rounded-lg p-8 flex flex-col lg:flex-row items-center justify-between space-y-8 lg:space-y-0 lg:space-x-8 my-12 shadow-xl border border-gray-700">
            <div className="text-center lg:text-left max-w-md">
              <h2 className="text-3xl font-bold mb-4 text-gray-50">Join Deepcytes</h2>
              <p className="text-gray-300 mb-6">
                Start securing your data now. Join thousands of satisfied customers.
              </p>
              <button className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg shadow-lg transition duration-300 transform hover:scale-105" onClick={() => window.location.href = "https://learn.deepcytes.io/"}>
                Get Started Now
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 text-xl shadow-md transform hover:scale-110 transition-transform duration-300">
                  {/* Placeholder for icons/avatars */}
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              ))}
            </div>
          </section>
        </main>

        <Footer /> {/* Render the Footer component */}
      </div>

      {/* Tailwind CSS Customizations (add this to your global CSS, e.g., globals.css) */}
      <style global>{`
        @keyframes gradient-xy {
          0% {
            background-position: 0% 0%;
          }
          50% {
            background-position: 100% 100%;
          }
          100% {
            background-position: 0% 0%;
          }
        }

        .animate-gradient-xy {
          background-size: 400% 400%;
          animation: gradient-xy 30s ease infinite;
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.5; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        .star {
          animation: twinkle infinite ease-in-out;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
          }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes glowing {
          0% { background-position: 0 0; }
          100% { background-position: 400% 0; }
        }
      `}</style>
    </div>
  );
};

export default App; 