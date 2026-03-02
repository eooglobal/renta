'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function Tracker() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const ref = searchParams.get('ref');
        if (ref) {
            // Save the referral code in localStorage for 30 days
            localStorage.setItem('renta_referral_code', ref);
            // Also save the timestamp
            localStorage.setItem('renta_referral_time', Date.now().toString());
        }
    }, [searchParams]);

    return null;
}

export default function ReferralTracker() {
    return (
        <Suspense fallback={null}>
            <Tracker />
        </Suspense>
    );
}
