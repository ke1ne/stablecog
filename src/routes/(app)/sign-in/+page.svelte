<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import MetaTag from '$components/MetaTag.svelte';
	import PageWrapper from '$components/PageWrapper.svelte';
	import SignInCard from '$components/SignInCard.svelte';
	import { canonicalUrl } from '$ts/constants/main';
	import { previewImageVersion } from '$ts/constants/previewImageVersion';
	import { searchParamsString } from '$ts/stores/searchParamsString';

	export let data;

	$: $page.data.session?.user.id, redirect();

	async function redirect() {
		if (!browser) return;
		if (!$page.data.session?.user.id) return;
		await goto('/');
	}
</script>

<MetaTag
	title="Sign In | Stablecog"
	description="Sign in to Stablecog. Create amazing art in seconds with AI. Free, multilingual and open-source AI image generator using Stable Diffusion and Kandinsky."
	image_url="{canonicalUrl}/previews{$page.url.pathname}-{previewImageVersion}.png"
/>

<PageWrapper>
	<div class="w-[100%+1rem] flex justify-center items-center my-auto -mx-2">
		<SignInCard redirectTo={data.redirect_to + $searchParamsString} />
	</div>
</PageWrapper>
