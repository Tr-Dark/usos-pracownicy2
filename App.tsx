// App.tsx
import React from 'react';
import { StatusBar } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { PrefsProvider } from './src/context/PrefsContext';
import { GroupsProvider } from './src/context/GroupsContext';
import { MessagesProvider } from './src/context/MessagesContext';
import { TasksProvider } from './src/context/TasksContext';
import { NetworkProvider } from './src/context/NetworkContext';

export default function App() {
  return (
    <>
      <StatusBar hidden />
      <NetworkProvider>
        <PrefsProvider>
          <AuthProvider>
            <GroupsProvider>
              <TasksProvider>
                <MessagesProvider>
                  <RootNavigator />
                </MessagesProvider>
              </TasksProvider>
            </GroupsProvider>
          </AuthProvider>
        </PrefsProvider>
      </NetworkProvider>
    </>
  );
}
