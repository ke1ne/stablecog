<script lang="ts">
	import { isTouchscreen } from '$ts/stores/isTouchscreen';
	import { themeApp } from '$ts/stores/theme';
	import { windowHeight } from '$ts/stores/window';

	export let isAppRoute = false;
</script>

<div
	style="
		background-image: url({$themeApp === 'light'
		? '/illustrations/grid-on-light.svg'
		: '/illustrations/grid-on-dark.svg'});
				background-size: 24px;
        {isAppRoute
		? 'width: 100vw; width: 100svw;height: 100vh; height: 100svh;'
		: `min-height: 100vh;min-height: ${$windowHeight ? `${$windowHeight}px` : '100svh'};`}
	"
	class="w-full bg-c-bg text-c-on-bg flex flex-col {$themeApp === 'light'
		? 'theme-light'
		: 'theme-dark'} {isAppRoute ? 'overflow-hidden' : ''} {!$isTouchscreen ? 'not-touch' : ''}"
>
	<slot />
</div>
