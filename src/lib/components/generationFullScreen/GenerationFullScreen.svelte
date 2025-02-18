<script lang="ts">
	import IconChatBubbleCancel from '$components/icons/IconChatBubbleCancel.svelte';
	import ModalWrapper from '$components/ModalWrapper.svelte';
	import { windowWidth } from '$ts/stores/window';
	import { onDestroy, onMount } from 'svelte';
	import { quadOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { tooltip } from '$ts/actions/tooltip';
	import { getGenerationUrlFromParams } from '$ts/helpers/getGenerationUrlFromParams';
	import { page } from '$app/stores';
	import {
		lgBreakpoint,
		mdBreakpoint,
		sidebarWidth
	} from '$components/generationFullScreen/constants';
	import ParamsSection from '$components/generationFullScreen/ParamsSection.svelte';
	import Button from '$components/buttons/Button.svelte';
	import IconUpscale from '$components/icons/IconUpscale.svelte';
	import TabBar from '$components/tabBars/TabBar.svelte';
	import LL from '$i18n/i18n-svelte';
	import { negativePromptTooltipAlt } from '$ts/constants/tooltips/image';
	import Container from '$components/generationFullScreen/Container.svelte';
	import { activeGeneration, type TGenerationWithSelectedOutput } from '$userStores/generation';
	import { sseId } from '$userStores/sse';
	import {
		queueInitialUpscaleRequest,
		upscales,
		type TInitialUpscaleRequest,
		maxOngoingUpscalesCountReached
	} from '$ts/stores/user/upscale';
	import { upscaleModelIdDefault } from '$ts/constants/upscaleModels';
	import { generateSSEId } from '$ts/helpers/generateSSEId';
	import ButtonsSection from '$components/generationFullScreen/ButtonsSection.svelte';
	import SidebarChevron from '$components/generationFullScreen/SidebarChevron.svelte';
	import type {
		TButtonObjectsWithState,
		TGenerationFullScreenModalType,
		TSetButtonObjectWithState
	} from '$components/generationFullScreen/types';
	import Divider from '$components/generationFullScreen/Divider.svelte';
	import { userSummary } from '$ts/stores/user/summary';
	import InsufficientCreditsBadge from '$components/badges/InsufficientCreditsBadge.svelte';
	import IconNoImage from '$components/icons/IconNoImage.svelte';
	import { lastClickedOutputId } from '$ts/stores/lastClickedOutputId';
	import FavoriteButton from '$components/buttons/FavoriteButton.svelte';
	import { browser } from '$app/environment';
	import GenerationFullScreenImageSet from '$components/generationFullScreen/GenerationFullScreenImageSet.svelte';
	import UpscaleAnimation from '$components/generate/UpscaleAnimation.svelte';
	import SideButton from '$components/generationFullScreen/SideButton.svelte';
	import { removeFromRecentlyUpdatedOutputIds } from '$ts/stores/user/recentlyUpdatedOutputIds';
	import SrcsetProvider from '$components/generationImage/SrcsetProvider.svelte';

	export let generation: TGenerationWithSelectedOutput;
	export let modalType: TGenerationFullScreenModalType;
	export let onLeftButtonClicked: (() => void) | undefined = undefined;
	export let onRightButtonClicked: (() => void) | undefined = undefined;
	export let setSearchQuery: ((query: string) => void) | undefined = undefined;

	let buttonLeft: HTMLButtonElement;
	let buttonRight: HTMLButtonElement;
	let buttonLeftMobile: HTMLButtonElement;
	let buttonRightMobile: HTMLButtonElement;

	$: upscaleFromStore = $upscales.find(
		(upscale) => upscale.type === 'from_output' && upscale.input === generation.selected_output.id
	);

	$: upscaledImageUrlFromStore =
		upscaleFromStore &&
		upscaleFromStore.outputs &&
		upscaleFromStore.outputs.length > 0 &&
		upscaleFromStore.outputs[0].image_url
			? upscaleFromStore.outputs[0].image_url
			: undefined;

	$: [upscaleFromStore], onUpscaleFromStoreChanged();

	function setUpscaleFromStore() {
		upscaleFromStore = $upscales.find(
			(upscale) => upscale.type === 'from_output' && upscale.input === generation.selected_output.id
		);
	}
	function onUpscaleFromStoreChanged() {
		if (upscaledImageUrlFromStore !== undefined && !generation.selected_output.upscaled_image_url) {
			generation.selected_output.upscaled_image_url = upscaledImageUrlFromStore;
		}
	}

	$: currentImageUrl = generation.selected_output.upscaled_image_url
		? generation.selected_output.upscaled_image_url
		: generation.selected_output.image_url;

	let upscaledImageWidth: number | undefined;
	let upscaledImageHeight: number | undefined;

	$: generation.selected_output, onGenerationChanged();
	let initialGenerationChange = true;
	$: upscaleBeingProcessed = upscaleFromStore
		? upscaleFromStore.status !== 'succeeded' &&
		  upscaleFromStore.status !== 'failed' &&
		  !generation.selected_output.upscaled_image_url
		: false;

	let sidebarWrapper: HTMLDivElement;
	let sidebarWrapperHeight: number;
	let sidebarWrapperScrollHeight: number;
	let sidebarWrapperScrollTop: number;
	let sidebarInnerContainerHeight: number;

	let generateSimilarUrl: string;
	let linkUrl: string;

	$: exploreSimilarUrl = `/gallery?q=${generation.selected_output.id}`;

	let upscaledTabValue: TUpscaleTabValue = 'upscaled';
	type TUpscaleTabValue = 'original' | 'upscaled';
	let upscaledOrDefaultTabs: { label: string; value: TUpscaleTabValue }[];

	$: upscaledOrDefaultTabs = [
		{
			label: $LL.GenerationFullscreen.UpscaleTabBar.UpscaledTitle(),
			value: 'upscaled'
		},
		{
			label: $LL.GenerationFullscreen.UpscaleTabBar.OriginalTitle(),
			value: 'original'
		}
	];

	const upscaleCreditCost = 1;
	$: doesntHaveEnoughCredits =
		$userSummary && $page.data.session?.user.id
			? $userSummary.total_remaining_credits < upscaleCreditCost
			: false;

	const onGenerationChanged = () => {
		removeFromRecentlyUpdatedOutputIds(generation.selected_output.id);
		setUpscaleFromStore();
		currentImageUrl =
			generation.selected_output.upscaled_image_url ?? generation.selected_output.image_url;
		if (generation.selected_output.upscaled_image_url) upscaledTabValue = 'upscaled';
		upscaledImageWidth = undefined;
		upscaledImageHeight = undefined;
		buttonObjectsWithState = { ...initialButtonObjectsWithState };
		const { seed, selected_output, ...rest } = generation;
		generateSimilarUrl = getGenerationUrlFromParams(rest);
		linkUrl = `${$page.url.origin}/gallery/o/${generation.selected_output.id}`;
		if (browser && window && !initialGenerationChange) {
			if (modalType !== 'gallery') {
				const searchParams = new URLSearchParams(window.location.search);
				searchParams.set('o', generation.selected_output.id);
				const params = searchParams.toString();
				window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
			} else {
				window.history.replaceState({}, '', `/gallery/o/${generation.selected_output.id}`);
			}
		}
		resetAllButtonObjectWithState();
		initialGenerationChange = false;
	};

	const initialButtonObjectsWithState: TButtonObjectsWithState = {
		prompt: {
			state: 'idle'
		},
		seed: {
			state: 'idle'
		},
		link: {
			state: 'idle'
		},
		download: {
			state: 'idle'
		}
	};

	let buttonObjectsWithState = { ...initialButtonObjectsWithState };

	const setButtonObjectWithState: TSetButtonObjectWithState = (key, state) => {
		buttonObjectsWithState[key].state = state;
		if (state === 'success') {
			if (buttonObjectsWithState[key].timeout) {
				clearTimeout(buttonObjectsWithState[key].timeout);
			}
			buttonObjectsWithState[key].timeout = setTimeout(() => {
				buttonObjectsWithState[key].state = 'idle';
			}, 2000);
			for (const buttonKey in buttonObjectsWithState) {
				if (buttonKey !== key) {
					buttonObjectsWithState[buttonKey].state = 'idle';
					if (buttonObjectsWithState[buttonKey].timeout) {
						clearTimeout(buttonObjectsWithState[buttonKey].timeout);
					}
				}
			}
		}
		buttonObjectsWithState = { ...buttonObjectsWithState };
	};

	const resetAllButtonObjectWithState = () => {
		for (const key in buttonObjectsWithState) {
			if (buttonObjectsWithState[key].timeout) {
				clearTimeout(buttonObjectsWithState[key].timeout);
			}
			buttonObjectsWithState[key].state = 'idle';
		}
	};

	const setSidebarWrapperVars = () => {
		if (!sidebarWrapper) return;
		sidebarWrapperScrollTop = sidebarWrapper.scrollTop;
		sidebarWrapperScrollHeight = sidebarWrapper.scrollHeight;
	};

	async function onUpscaleClicked() {
		if (!$sseId) {
			console.log('No SSE ID, cannot upscale');
			return;
		}
		const initialRequestProps: TInitialUpscaleRequest = {
			input: generation.selected_output.id,
			model_id: upscaleModelIdDefault,
			type: 'from_output',
			stream_id: $sseId,
			ui_id: generateSSEId()
		};
		queueInitialUpscaleRequest(initialRequestProps);
	}

	$: upscaledTabValue, setCurrentImageUrl();

	$: backgroundImageUrl =
		modalType !== 'stage' && generation.selected_output.upscaled_image_url
			? generation.selected_output.upscaled_image_url
			: generation.selected_output.image_url;

	function setCurrentImageUrl() {
		if (
			upscaledTabValue === 'upscaled' &&
			generation.selected_output.upscaled_image_url !== undefined
		) {
			currentImageUrl = generation.selected_output.upscaled_image_url;
		} else {
			currentImageUrl = generation.selected_output.image_url;
		}
	}

	const onImageLoad = (e: Event) => {
		const target = e.target as HTMLImageElement;
		if (generation.width !== target.naturalWidth && generation.selected_output.upscaled_image_url) {
			upscaledImageWidth = target.naturalWidth;
		}
		if (
			generation.height !== target.naturalHeight &&
			generation.selected_output.upscaled_image_url
		) {
			upscaledImageHeight = target.naturalHeight;
		}
	};

	const onPopState: svelte.JSX.EventHandler<PopStateEvent, Window> | null | undefined = (e) => {
		const searchParams = new URLSearchParams(e.currentTarget.location.search);
		const hasOutputParam = searchParams.has('o');
		if (!hasOutputParam) {
			activeGeneration.set(undefined);
		}
	};

	onMount(() => {
		setSidebarWrapperVars();
		lastClickedOutputId.set(undefined);
	});

	onDestroy(() => {
		const searchParams = new URLSearchParams(window.location.search);
		if (modalType === 'gallery') {
			window.history.pushState({}, '', `/gallery`);
		} else if (searchParams.has('o')) {
			searchParams.delete('o');
			const newSearch = searchParams.toString();
			window.history.pushState({}, '', `${$page.url.pathname}${newSearch ? `?${newSearch}` : ''}`);
		}
	});
</script>

<svelte:window on:popstate={onPopState} />

<ModalWrapper
	hasPadding={false}
	onClose={$windowWidth < mdBreakpoint
		? () => {
				if ($activeGeneration !== undefined) {
					activeGeneration.set(undefined);
				}
		  }
		: undefined}
>
	<Container
		clickoutsideExceptions={[buttonLeft, buttonRight]}
		{generation}
		let:imageContainerWidth
		let:imageContainerHeight
		let:modalMinHeight
	>
		<div class="relative self-stretch flex items-center">
			{#if generation.selected_output.image_url}
				{#key generation.selected_output.id}
					<SrcsetProvider src={backgroundImageUrl} cardType={modalType} let:sizes let:srcset>
						<img
							class="w-full h-full absolute left-0 top-0 transform scale-125 blur-xl translate-3d-0"
							{sizes}
							src={generation.selected_output.image_url}
							{srcset}
							alt="Blurred background for: {generation.prompt.text}"
							width={generation.width}
							height={generation.height}
						/>
					</SrcsetProvider>
				{/key}
			{/if}
			<div class="w-full h-full absolute left-0 top-0 bg-c-bg/50" />
			<div
				style={$windowWidth >= lgBreakpoint
					? `width: ${imageContainerWidth}px; height: ${imageContainerHeight}px;`
					: ''}
				class="w-full lg:h-full relative"
			>
				{#if generation.selected_output.image_url.includes('placeholder')}
					<svg
						class="w-full h-auto text-c-bg-secondary"
						width={generation.width}
						height={generation.height}
						viewBox="0 0 {generation.width} {generation.height}"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect width={generation.width} height={generation.height} fill="currentColor" />
					</svg>
					<div class="w-full h-full absolute left-0 top-0 p-5 flex items-center justify-center">
						<IconNoImage class="w-16 h-16 text-c-on-bg/40" />
					</div>
				{:else}
					{#key generation.selected_output.id}
						<GenerationFullScreenImageSet
							prompt={generation.prompt.text}
							{backgroundImageUrl}
							backgroundImageWidth={generation.width}
							backgroundImageHeight={generation.height}
							imageUrl={currentImageUrl}
							imageWidth={upscaledTabValue === 'upscaled' && upscaledImageWidth
								? upscaledImageWidth
								: generation.width}
							imageHeight={upscaledTabValue === 'upscaled' && upscaledImageHeight
								? upscaledImageHeight
								: generation.height}
							{onImageLoad}
							cardType={modalType}
						/>
					{/key}
					{#if $upscales && $upscales.length > 0 && upscaleFromStore?.status === 'failed'}
						<div
							transition:fly|local={{ duration: 200, easing: quadOut, y: -50 }}
							class="w-full absolute left-0 top-0 flex items-center justify-center p-3 pointer-events-none"
						>
							<p
								class="text-center font-medium text-xs md:text-sm shadow-lg shadow-c-shadow/[var(--o-shadow-stronger)] bg-c-bg-secondary px-4 py-3 rounded-xl"
							>
								{upscaleFromStore?.error ?? $LL.Error.SomethingWentWrong()}
							</p>
						</div>
					{/if}
					{#if upscaleFromStore?.animation}
						<UpscaleAnimation
							animation={upscaleFromStore.animation}
							isProcessing={upscaleBeingProcessed}
						/>
					{/if}
				{/if}
			</div>
			<div class="w-full h-full overflow-hidden z-0 absolute left-0 top-0 pointer-events-none">
				{#if onLeftButtonClicked || onRightButtonClicked}
					<SideButton
						name="Go Left"
						hasAnimation={false}
						iconClass="w-6 h-6"
						class="flex md:hidden absolute w-1/6 left-0 top-1/2 transform -translate-y-1/2 h-full pointer-events-auto"
						wrapperClass="w-full h-full relative flex items-center rounded-xl justify-start pl-1.5"
						side="left"
						bind:element={buttonLeftMobile}
						onClick={onLeftButtonClicked}
					/>
					<SideButton
						name="Go Right"
						hasAnimation={false}
						iconClass="w-6 h-6"
						class="flex md:hidden absolute w-1/6 right-0 top-1/2 transform -translate-y-1/2 h-full pointer-events-auto"
						wrapperClass="w-full h-full relative flex items-center rounded-xl justify-end pr-1.5"
						side="right"
						bind:element={buttonRightMobile}
						onClick={onRightButtonClicked}
					/>
				{/if}
				{#if modalType === 'history' || modalType === 'generate'}
					<div class="absolute right-1.5 top-1.5 pointer-events-auto z-10">
						<FavoriteButton {generation} {modalType} />
					</div>
				{/if}
			</div>
		</div>
		<!-- Right side of the panel -->
		<div
			style={$windowWidth >= lgBreakpoint
				? `width: ${sidebarWidth}px; height: ${imageContainerHeight}px; min-height: ${modalMinHeight}px;`
				: ``}
			class="w-full shadow-generation-sidebar shadow-c-shadow/[var(--o-shadow-stronger)] flex
				flex-col items-start justify-start bg-c-bg-secondary lg:border-l-2 border-c-bg-tertiary relative"
		>
			<div
				on:scroll={setSidebarWrapperVars}
				bind:this={sidebarWrapper}
				bind:clientHeight={sidebarWrapperHeight}
				class="w-full overflow-auto lg-list-fade relative"
			>
				<div
					bind:clientHeight={sidebarInnerContainerHeight}
					class="w-full flex flex-col items-start justify-start"
				>
					<div class="w-full flex flex-col gap-4 md:gap-5 px-5 py-4 md:px-7 md:py-5">
						{#if (modalType === 'generate' || modalType === 'history') && !generation.selected_output.image_url.includes('placeholder')}
							<div class="w-full pt-1.5">
								{#if !generation.selected_output.upscaled_image_url || upscaleBeingProcessed}
									<div class="w-full relative">
										<Button
											onClick={onUpscaleClicked}
											loading={upscaleBeingProcessed || $maxOngoingUpscalesCountReached}
											disabled={doesntHaveEnoughCredits}
											fadeOnDisabled={doesntHaveEnoughCredits}
											withSpinner
											class="w-full"
											size="sm"
										>
											<div class="flex items-center gap-2">
												<IconUpscale class="w-5 h-5" />
												<p>{$LL.GenerationFullscreen.UpscaleButton()}</p>
											</div>
										</Button>
										{#if doesntHaveEnoughCredits && !upscaleBeingProcessed && $userSummary && $page.data.session?.user.id}
											<InsufficientCreditsBadge
												neededCredits={upscaleCreditCost}
												remainingCredits={$userSummary.total_remaining_credits}
											/>
										{/if}
									</div>
								{:else}
									<TabBar
										bind:value={upscaledTabValue}
										fontWeight={600}
										tabs={upscaledOrDefaultTabs}
										hasTitle={false}
										dontScale={true}
										name="Upscaled or Default Image"
									/>
								{/if}
							</div>
						{/if}
						<!-- Prompt and Negative Prompt -->
						<div class="w-full break-words flex flex-col items-start gap-3">
							<p class="w-full leading-normal">{generation.prompt.text}</p>
							{#if generation.negative_prompt}
								<div class="w-full flex items-start text-c-danger gap-2">
									<div use:tooltip={$negativePromptTooltipAlt}>
										<IconChatBubbleCancel class="w-5 h-5" />
									</div>
									<p class="flex-shrink min-w-0 leading-normal -mt-0.75">
										{generation.negative_prompt.text}
									</p>
								</div>
							{/if}
						</div>
						{#key generation.selected_output.id}
							<ButtonsSection
								{generation}
								{generateSimilarUrl}
								{exploreSimilarUrl}
								{linkUrl}
								{currentImageUrl}
								{setSearchQuery}
								{modalType}
								{setButtonObjectWithState}
								bind:buttonObjectsWithState
							/>
						{/key}
					</div>
					<Divider />
					<ParamsSection
						class="flex flex-col px-5 py-4 md:px-7 md:py-5 lg:pb-8 gap-6"
						currentImageWidth={upscaledTabValue === 'upscaled' && upscaledImageWidth
							? upscaledImageWidth
							: generation.width}
						currentImageHeight={upscaledTabValue === 'upscaled' && upscaledImageHeight
							? upscaledImageHeight
							: generation.height}
						{generation}
						{setButtonObjectWithState}
						bind:buttonObjectsWithState
						{modalType}
					/>
				</div>
			</div>
			<SidebarChevron
				bind:sidebarInnerContainerHeight
				bind:sidebarWrapper
				bind:sidebarWrapperHeight
				bind:sidebarWrapperScrollHeight
				bind:sidebarWrapperScrollTop
			/>
		</div>
	</Container>
	{#if onLeftButtonClicked || onRightButtonClicked}
		<SideButton
			name="Go Left"
			class="hidden md:flex absolute left-0 top-1/2 transform -translate-y-1/2 w-20 h-56"
			side="left"
			bind:element={buttonLeft}
			onClick={onLeftButtonClicked}
		/>
		<SideButton
			name="Go Right"
			class="hidden md:flex absolute right-0 top-1/2 transform -translate-y-1/2 w-20 h-56"
			side="right"
			bind:element={buttonRight}
			onClick={onRightButtonClicked}
		/>
	{/if}
</ModalWrapper>
