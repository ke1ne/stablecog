<script lang="ts">
	import TabBarWrapper from '$components/tabBars/TabBarWrapper.svelte';
	import ToggleIndicator from '$components/ToggleIndicator.svelte';

	export let isToggled: boolean;
	export let onClick: () => void;
	export { classes as class };
	export let disabled = false;
	export let hasTitle = false;
	export let text: string | undefined;
	let classes = '';
</script>

<TabBarWrapper class={classes}>
	{#if hasTitle}
		<div class="self-stretch flex text-c-on-bg/50">
			<slot name="title" />
		</div>
		<div class="w-2px -ml-px self-stretch">
			<div class="w-full h-full bg-c-bg-secondary" />
		</div>
	{/if}
	<button
		class="flex-1 min-w-0 flex items-center justify-between touch-manipulation self-stretch p-3.5 relative group rounded-xl gap-2"
		type="button"
		on:click={onClick}
		{disabled}
	>
		<div
			class="w-full h-full absolute left-0 top-0 overflow-hidden z-0 transition-all duration-150 rounded-xl"
		>
			<div class="w-[200%] h-full absolute left-0 top-0 flex items-center justify-center">
				<div
					class="w-full aspect-square origin-left rounded-full transition transform -translate-x-full opacity-0
					bg-c-primary/10 not-touch:group-hover:translate-x-[-45%] not-touch:group-hover:opacity-100"
				/>
			</div>
		</div>
		{#if text}
			<p
				class="break-words flex-shrink overflow-hidden
				text-base transition not-touch:group-hover:text-c-primary
				font-medium text-left relative pr-4"
			>
				{text}
			</p>
		{/if}
		<ToggleIndicator {isToggled} color="on-bg" />
	</button>
</TabBarWrapper>
