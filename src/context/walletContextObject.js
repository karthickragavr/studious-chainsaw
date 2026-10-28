import { createContext } from 'react';

// The bare context object, kept free of provider imports so consumers (and
// the public arcade's play-money provider) don't pull in Supabase/User state.
export const WalletContext = createContext();
