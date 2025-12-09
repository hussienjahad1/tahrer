
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { ImageConfig } from '../types';
import { getDatabase, ref, onValue, off } from "firebase/database";
import { firebaseApp } from '../firebase';

interface AppContextType {
  imageTemplates: ImageConfig[];
  loadTemplates: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [imageTemplates, setImageTemplates] = useState<ImageConfig[]>([]);

  const loadTemplates = useCallback(() => {
    const db = getDatabase(firebaseApp);
    const templatesRef = ref(db, 'imageTemplates');
    
    off(templatesRef); 

    onValue(templatesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedTemplates: ImageConfig[] = Object.entries(data).map(([key, value]) => ({
          ...(value as Omit<ImageConfig, 'id'>), 
          id: key, 
        }));
        setImageTemplates(loadedTemplates);
      } else {
        setImageTemplates([]);
      }
    }, (error) => {
      console.error("Error loading templates from Firebase:", error);
      alert(`فشل تحميل القوالب من Firebase: ${error.message}`);
      setImageTemplates([]); 
    });
  }, []);
  
  useEffect(() => {
    loadTemplates();
    
    return () => {
      const db = getDatabase(firebaseApp);
      const templatesRef = ref(db, 'imageTemplates');
      off(templatesRef);
    };
  }, [loadTemplates]);

  return (
    <AppContext.Provider
      value={{
        imageTemplates,
        loadTemplates,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
