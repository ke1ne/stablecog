import { apiUrl } from '$ts/constants/main';
import type { TStripeSupportedPriceIdSubscriptionsMo } from '$ts/constants/stripePublic';
import type { TUserSummary } from '$ts/stores/user/summary';

export async function getUserSummary(
	access_token: string | undefined
): Promise<TUserSummary | null> {
	if (!access_token) return null;
	console.log('getting user summary');
	let userSummary: TUserSummary | null = null;
	const userRes = await fetch(`${apiUrl.origin}/v1/user`, {
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${access_token}`
		}
	});
	if (userRes.ok) {
		const userResJson: TUserSummary = await userRes.json();
		userSummary = userResJson;
	}
	return userSummary;
}

export async function downgradeSubscription(
	price_id: TStripeSupportedPriceIdSubscriptionsMo,
	access_token: string
) {
	const res = await fetch(`${apiUrl.origin}/v1/user/subscription/downgrade`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${access_token}`
		},
		body: JSON.stringify({
			target_price_id: price_id
		})
	});
	const resJson = await res.json();
	console.log(resJson);
}
