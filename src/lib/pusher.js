import Pusher from 'pusher';
import PusherClient from 'pusher-js';
import { getSetting } from './settings';

/**
 * Gets the Pusher Server instance with dynamic credentials
 */
export async function getPusherServer() {
    return new Pusher({
        appId: await getSetting('PUSHER_APP_ID'),
        key: await getSetting('NEXT_PUBLIC_PUSHER_KEY'),
        secret: await getSetting('PUSHER_SECRET'),
        cluster: await getSetting('NEXT_PUBLIC_PUSHER_CLUSTER'),
        useTLS: true,
    });
}

/**
 * Gets the Pusher Client instance
 * Note: For client-side, we still prefer env vars or a public settings API
 */
export const getPusherClient = (key, cluster) => {
    const pusherKey = key || process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = cluster || process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    
    if (!pusherKey || !pusherCluster) return null;
    
    return new PusherClient(pusherKey, {
        cluster: pusherCluster,
    });
};
