import React from 'react';

// Footer component
const Footer = () => {
  return (
    <footer className="py-8 px-8 border-t border-gray-800 text-gray-400 text-sm backdrop-blur-sm bg-black">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center md:items-start space-y-8 md:space-y-0">
        <div className="text-center md:text-left">
          <div className="text-xl font-bold text-gray-50 mb-2">Deepcytes</div>
          <p>&copy; 2024 Deepcytes. All rights reserved.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <h3 className="font-semibold text-gray-200 mb-2">Company</h3>
            <ul>
              <li><a href="#" className="hover:text-purple-400 transition-colors duration-200">About Us</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors duration-200">Careers</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors duration-200">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-200 mb-2">Resources</h3>
            <ul>
              <li><a href="#" className="hover:text-blue-400 transition-colors duration-200">Blog</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors duration-200">Support</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors duration-200">FAQs</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-200 mb-2">Legal</h3>
            <ul>
              <li><a href="#" className="hover:text-purple-400 transition-colors duration-200">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors duration-200">Terms of Service</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
