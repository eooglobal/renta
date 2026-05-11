import { WebApi } from 'smile-identity-core';
import { getSetting } from './settings';

/**
 * Verifies a NIN (National Identity Number)
 */
export async function verifyNIN(userId, nin, userInfo = {}) {
    const partnerId = await getSetting('SMILE_ID_PARTNER_ID');
    const apiKey = await getSetting('SMILE_ID_API_KEY');
    const sidServer = await getSetting('SMILE_ID_SID_SERVER', '0');

    if (!partnerId || !apiKey) {
        console.error('Smile ID credentials missing');
        throw new Error('Verification service unavailable');
    }

    const smileId = new WebApi(partnerId, apiKey, sidServer);

    const timestamp = Math.floor(Date.now() / 1000);
    const jobId = `kyc-${userId}-${timestamp}`;

    const params = {
        partner_params: {
            user_id: `user-${userId}`,
            job_id: jobId,
            job_type: 5, // Enhanced KYC
        },
        id_info: {
            id_number: nin,
            id_type: 'NIN_V2',
            country: 'NG',
            first_name: userInfo.firstName,
            last_name: userInfo.lastName,
            dob: userInfo.dob // YYYY-MM-DD
        }
    };

    try {
        const response = await smileId.submit_job(params);
        return {
            success: response.result_code === '1012', // Typical success code for KYC
            raw: response,
            jobId
        };
    } catch (error) {
        console.error('Smile ID Verification Error:', error);
        throw error;
    }
}
