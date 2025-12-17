import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import NetInfo, { NetInfoStateType } from '@react-native-community/netinfo';

type NetworkState = {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: NetInfoStateType | 'unknown';
};

const NetworkContext = createContext<NetworkState | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  });

  useEffect(() => {
    const unsub = NetInfo.addEventListener(s => {
      setState({
        isConnected: Boolean(s.isConnected),
        isInternetReachable: s.isInternetReachable ?? Boolean(s.isConnected),
        type: s.type ?? 'unknown',
      });
    });
    return () => unsub();
  }, []);

  const value = useMemo(() => state, [state]);
  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};

export const useNetwork = () => {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork must be used within NetworkProvider');
  return ctx;
};
