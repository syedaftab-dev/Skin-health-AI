import React from 'react';
import { useAuth } from '../../context/AuthContext';

const TestProfile = () => {
  const { user } = useAuth();
  
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">TEST_PROFILE_PAGE</h1>
      <p>User: {user ? JSON.stringify(user) : 'NOT_LOGGED_IN'}</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
};

export default TestProfile;
