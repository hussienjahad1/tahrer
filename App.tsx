
import React from 'react';
import UserView from './components/UserView';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black text-slate-100 font-sans">
      <header className="sticky top-0 z-40 w-full backdrop-blur-lg bg-slate-900/75 border-b border-slate-700/50 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-sky-500 to-cyan-400 p-2 rounded-lg shadow-lg shadow-sky-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-200">
                محرر المستندات المدرسية
              </h1>
            </div>
            {/* Future nav items could go here */}
        </div>
      </header>
      
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
          <UserView />
      </main>

      <footer className="mt-12 py-6 text-center text-slate-500 text-sm border-t border-slate-800">
        <p>جميع الحقوق محفوظة &copy; {new Date().getFullYear()} مراسل المعلم</p>
      </footer>
    </div>
  );
};

export default App;