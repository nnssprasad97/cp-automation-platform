import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUserProfile();
    fetchContests();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/api/users/profile');
      setUser(response.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchContests = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/contests');
      setContests(response.data);
    } catch (err) {
      console.error('Error fetching contests:', err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black">
      <nav className="bg-gray-800 text-white p-4">
        <h1 className="text-3xl font-bold">⚡ CP Automation Platform</h1>
      </nav>
      <main className="max-w-6xl mx-auto p-6">
        {user && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 text-white">
            <h2 className="text-2xl font-bold">Welcome, {user.username}!</h2>
            <p className="text-cyan-400">CodeForces: {user.codeforceHandle || 'Not connected'}</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <p className="text-white text-center col-span-full">Loading contests...</p>
          ) : (
            contests.map((contest) => (
              <div key={contest.id} className="bg-gray-700 rounded-lg p-4 text-white hover:bg-gray-600 transition">
                <h3 className="text-xl font-bold text-cyan-400">{contest.name}</h3>
                <p className="text-sm text-gray-300">{contest.platform.toUpperCase()}</p>
                <p className="text-yellow-400 mt-2">📅 {new Date(contest.startTime).toLocaleString()}</p>
                <button className="mt-4 bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded font-bold">
                  ✅ Set Alert
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
