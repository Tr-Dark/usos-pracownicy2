// App.tsx
import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { PrefsProvider } from './src/context/PrefsContext';
import { GroupsProvider } from './src/context/GroupsContext';
import { MessagesProvider } from './src/context/MessagesContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <PrefsProvider>
      <AuthProvider>
        <GroupsProvider>
          <MessagesProvider>
            <RootNavigator />
          </MessagesProvider>
        </GroupsProvider>
      </AuthProvider>
    </PrefsProvider>
  );
}

