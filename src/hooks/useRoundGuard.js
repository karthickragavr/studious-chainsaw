import { useEffect } from 'react';
import { useWallet } from './useWallet';

// Reports the stake a game is holding off the wallet and hands it back if the
// game unmounts before the round settles (player navigates away mid-round).
// Wallet providers without an at-risk ledger (the main app's) are tolerated:
// the optional calls make this a no-op there.
export const useRoundGuard = (game, amount) => {
    const { setAtRisk, refundAtRisk } = useWallet();

    useEffect(() => {
        setAtRisk?.(amount, game);
    }, [setAtRisk, amount, game]);

    useEffect(() => () => refundAtRisk?.(), [refundAtRisk]);
};
