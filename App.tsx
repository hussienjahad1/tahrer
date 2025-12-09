
import React from 'react';
import UserView from './components/UserView';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-white p-4 sm:p-8 font-sans">
      <header className="mb-8">
        <div className="container mx-auto flex justify-center items-center p-4 bg-slate-800/50 rounded-xl shadow-lg">
            <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
              محرر المستندات
            </h1>
        </div>
      </header>
      
      <main>
          <UserView />
      </main>
    </div>
  );
};

export default App;
