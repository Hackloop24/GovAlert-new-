import React from 'react';

const Submain = () => {
  return (
    <>
      {/* Top Navigation Bar - Full Width */}
      <nav className="w-screen bg-gray-800 px-6 py-4 shadow-lg">
        <div className="flex justify-start">
          <a href="/" className="text-gray-300 hover:text-blue-400 mr-8">Home</a>
          <a href="/login" className="text-gray-300 hover:text-blue-400 mr-8">Report</a>
          <a href="#phone" className="text-gray-300 hover:text-blue-400 mr-8">Contact</a>
          <a href="#help" className="text-gray-300 hover:text-blue-400 mr-8">Help</a>
          <a href="#about" className="text-gray-300 hover:text-blue-400">About Us</a>
        </div>
      </nav>

      <div className="min-h-screen bg-gray-900 text-gray-200">
        {/* Website Header */}
        <header className="text-center py-8">
          <h1 className="text-4xl font-bold text-blue-400">Grievance Redressal Platform</h1>
          <p className="text-gray-400 mt-2">
            A transparent platform for residents to report issues and monitor their resolution.
          </p>
        </header>

        {/* Image Gallery */}
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-semibold text-center mb-6">Reported Grievances</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <img 
                src="/api/placeholder/400/160" 
                alt="Grievance 1" 
                className="w-full h-40 object-cover rounded-md"
              />
              <p className="mt-2">Grievance 1 Description</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <img 
                src="/api/placeholder/400/160" 
                alt="Grievance 2" 
                className="w-full h-40 object-cover rounded-md"
              />
              <p className="mt-2">Grievance 2 Description</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <img 
                src="/api/placeholder/400/160" 
                alt="Grievance 3" 
                className="w-full h-40 object-cover rounded-md"
              />
              <p className="mt-2">Grievance 3 Description</p>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about" className="bg-gray-800 p-8 mt-8 rounded-lg container mx-auto text-center">
          <h2 className="text-2xl font-semibold text-blue-400 mb-4">About Us</h2>
          <p className="text-gray-400">
            This platform allows residents to report grievances and track the status of their complaints. 
            Our goal is to create a transparent system that keeps everyone informed of the status and 
            resolution time of grievances.
          </p>
        </section>

        {/* Footer - Full Width */}
        <footer className="w-screen bg-gray-800 py-4 mt-8 text-gray-400 text-center">
          &copy; 2024 Grievance Redressal Platform. All Rights Reserved.
        </footer>
      </div>
    </>
  );
};

export default Submain;