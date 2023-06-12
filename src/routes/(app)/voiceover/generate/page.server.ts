import { supabaseAdmin } from '$ts/constants/supabaseAdmin';

export async function load() {
	const { data } = await supabaseAdmin
		.from('voiceover_speakers')
		.select('*')
		.like('name_in_worker', 'v2/es%%');
	console.log(data);
}
