<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import BatchEditBar from '$components/BatchEditBar.svelte';
	import Button from '$components/buttons/Button.svelte';
	import {
		lgBreakpoint,
		mdBreakpoint,
		xlBreakpoint,
		xxlBreakpoint
	} from '$components/generationFullScreen/constants';
	import GenerationFullScreen from '$components/generationFullScreen/GenerationFullScreen.svelte';
	import GenerationGridInfinite2 from '$components/grids/GenerationGridInfinite2.svelte';
	import IconFolderOutlined from '$components/icons/IconFolderOutlined.svelte';
	import IconSadFace from '$components/icons/IconSadFace.svelte';
	import IconStarOutlined from '$components/icons/IconStarOutlined.svelte';
	import MetaTag from '$components/MetaTag.svelte';
	import SearchAndFilterBar from '$components/SearchAndFilterBar.svelte';
	import SignInCard from '$components/SignInCard.svelte';
	import TabBar from '$components/tabBars/TabBar.svelte';
	import LL, { locale } from '$i18n/i18n-svelte';
	import { getHistoryInfiniteQueryProps } from '$routes/(app)/history/constants';
	import type { TAvailableGenerationModelId } from '$ts/constants/generationModels';
	import { canonicalUrl } from '$ts/constants/main';
	import { previewImageVersion } from '$ts/constants/previewImageVersion';
	import { setActiveGenerationToOutputIndex } from '$ts/helpers/goToOutputIndex';
	import { logBatchEditActived, logBatchEditDeactivated } from '$ts/helpers/loggers';
	import type { TUserGenerationFullOutputsPage } from '$ts/queries/userGenerations';
	import { advancedModeApp } from '$ts/stores/advancedMode';
	import { appVersion } from '$ts/stores/appVersion';
	import { searchParamsString } from '$ts/stores/searchParamsString';
	import {
		isUserGalleryEditActive,
		userGalleryCurrentView,
		type TUserGalleryView
	} from '$ts/stores/user/gallery';
	import { userGenerationFullOutputsQueryKey } from '$ts/stores/user/keys';
	import { userSummary } from '$ts/stores/user/summary';
	import { windowWidth } from '$ts/stores/window';
	import type { TTab } from '$ts/types/main';
	import { activeGeneration } from '$userStores/generation';
	import { createInfiniteQuery, type CreateInfiniteQueryResult } from '@tanstack/svelte-query';

	let totalOutputs: number;
	let modelIdFilters: TAvailableGenerationModelId[];

	let userGenerationFullOutputsQuery:
		| CreateInfiniteQueryResult<TUserGenerationFullOutputsPage, unknown>
		| undefined;

	let searchString: string;
	let searchInputIsFocused = false;

	$: userGenerationFullOutputsQueryKey.set([
		'user_generation_full_outputs',
		$userGalleryCurrentView,
		searchString ? searchString : '',
		modelIdFilters ? modelIdFilters.join(',') : ''
	]);

	$: userGenerationFullOutputsQuery =
		browser && $page.data.session?.user.id && $userSummary
			? createInfiniteQuery(
					getHistoryInfiniteQueryProps({
						userGalleryCurrentView: $userGalleryCurrentView,
						searchString,
						modelIdFilters,
						session: $page.data.session
					})
			  )
			: undefined;

	$: $userGenerationFullOutputsQuery?.data?.pages, onPagesChanged();

	let userGalleryTabs: TTab<TUserGalleryView>[];
	$: userGalleryTabs = [
		{
			label: $LL.History.Views.AllTitle(),
			value: 'all',
			icon: IconFolderOutlined
		},
		{
			label: $LL.History.Views.FavoritesTitle(),
			value: 'favorites',
			icon: IconStarOutlined
		}
	];

	let userGalleryEditActivatedOnce = false;
	$: $isUserGalleryEditActive, onUserGalleryEditActiveChanged();

	$: outputs = $userGenerationFullOutputsQuery?.data?.pages.flatMap((page) => page.outputs);
	$: outputIndex = outputs
		? outputs.findIndex((g) => g.id === $activeGeneration?.selected_output.id)
		: -1;
	$: leftIndex = outputIndex > 0 ? outputIndex - 1 : -1;
	$: rightIndex = outputs && outputIndex < outputs?.length - 1 ? outputIndex + 1 : -1;

	function onUserGalleryEditActiveChanged() {
		if (!userGalleryEditActivatedOnce && !$isUserGalleryEditActive) return;
		const props = {
			'SC - Advanced Mode': $advancedModeApp,
			'SC - Locale': $locale,
			'SC - Page': `${$page.url.pathname}${$page.url.search}`,
			'SC - User Id': $page.data.session?.user.id,
			'SC - Stripe Product Id': $userSummary?.product_id,
			'SC - App Version': $appVersion
		};
		if ($isUserGalleryEditActive) {
			logBatchEditActived(props);
			userGalleryEditActivatedOnce = true;
		} else {
			logBatchEditDeactivated(props);
		}
	}

	const onPagesChanged = () => {
		if (!$page.data.session?.user.id || !$userGenerationFullOutputsQuery) return;
		if (!$userGenerationFullOutputsQuery.data?.pages) return;
		for (let i = 0; i < $userGenerationFullOutputsQuery.data.pages.length; i++) {
			let page = $userGenerationFullOutputsQuery.data.pages[i];
			if (page.total_count !== undefined) {
				totalOutputs = page.total_count;
			}
		}
	};

	function onKeyDown({ key }: KeyboardEvent) {
		if (key === 'e' && !searchInputIsFocused) {
			isUserGalleryEditActive.set(!$isUserGalleryEditActive);
			return;
		}
		if (!$activeGeneration) return;
		if (key === 'Escape') {
			activeGeneration.set(undefined);
			return;
		}
		if (key === 'ArrowLeft' && leftIndex !== -1) {
			setActiveGenerationToOutputIndex(outputs, leftIndex);
			return;
		}
		if (key === 'ArrowRight' && rightIndex !== -1) {
			setActiveGenerationToOutputIndex(outputs, rightIndex);
			return;
		}
	}
</script>

<MetaTag
	title="History | Stablecog"
	description="See your generation history on Stablecog. Free, multilingual and open-source AI image generator using Stable Diffusion and Kandinsky."
	image_url="{canonicalUrl}/previews{$page.url.pathname}-{previewImageVersion}.png"
/>

<svelte:window on:keydown={onKeyDown} />

<div class="w-full flex-1 flex flex-col items-center px-1 md:pt-3 md:pb-6">
	{#if !$page.data.session?.user.id || !$userSummary}
		<div class="w-full flex-1 max-w-7xl flex justify-center px-2 py-4 md:py-2 md:px-8">
			<div class="my-auto flex flex-col">
				<SignInCard redirectTo={'/history' + $searchParamsString} />
				<div class="w-full h-[1vh]" />
			</div>
		</div>
	{:else}
		<div class="w-full max-w-5xl flex justify-center px-1 pt-2">
			<div class="w-full flex flex-wrap gap-4 items-center justify-between rounded-xl">
				<div
					class="w-full flex flex-col md:flex-row gap-4 md:gap-5 items-start md:items-center justify-start md:justify-between"
				>
					<div class="flex gap-2 items-center px-3 md:px-3">
						<p class="font-bold text-1.5xl md:text-2xl">
							{$userGalleryCurrentView === 'favorites'
								? $LL.History.Views.FavoritesTitle()
								: $LL.History.GenerationsTitle()}
						</p>
						<p class="text-sm md:text-base text-c-on-bg/50 font-semibold">
							({totalOutputs !== undefined ? totalOutputs.toLocaleString($locale) : '...'})
						</p>
					</div>
					<div class="w-full md:w-auto flex flex-1 items-center justify-end gap-4">
						<TabBar
							dontScale
							fontWeight={600}
							hasTitle={false}
							name="Tabs"
							tabs={userGalleryTabs}
							bind:value={$userGalleryCurrentView}
							class="flex-1 md:max-w-[19rem]"
						/>
					</div>
				</div>
			</div>
		</div>
		<div class="w-full flex max-w-5xl mt-3 px-1">
			<SearchAndFilterBar bind:searchString bind:modelIdFilters bind:searchInputIsFocused />
		</div>
		{#if $isUserGalleryEditActive}
			<div
				class="w-full top-1 max-w-5xl px-1 sticky z-30 {$isUserGalleryEditActive ? 'mt-3' : 'mt-0'}"
			>
				<BatchEditBar type="history" />
			</div>
		{/if}
		<div class="w-full flex-1 flex flex-col mt-5">
			{#if userGenerationFullOutputsQuery !== undefined}
				{#if $userGenerationFullOutputsQuery?.isError || ($userGenerationFullOutputsQuery?.data && !$userGenerationFullOutputsQuery?.data?.pages)}
					<div class="w-full flex-1 flex flex-col items-center py-8 px-5">
						<div class="flex flex-col my-auto items-center gap-2">
							<IconSadFace class="w-16 h-16 text-c-on-bg/50" />
							<p class="text-c-on-bg/50">{$LL.Error.SomethingWentWrong()}</p>
						</div>
					</div>
				{:else if $userGalleryCurrentView === 'favorites' && $userGenerationFullOutputsQuery?.data?.pages.length === 1 && $userGenerationFullOutputsQuery.data.pages[0].outputs.length === 0}
					<div class="w-full flex-1 flex flex-col items-center py-8 px-5">
						<div class="flex flex-col my-auto items-center gap-4">
							<IconStarOutlined class="w-16 h-16 text-c-on-bg/50" />
							<p class="text-c-on-bg/50 text-center">{$LL.History.NoFavoritesYet()}</p>
							<div class="h-[1vh]" />
						</div>
					</div>
				{:else if $userGenerationFullOutputsQuery?.data?.pages.length === 1 && $userGenerationFullOutputsQuery.data.pages[0].outputs.length === 0}
					<div class="w-full flex-1 flex flex-col items-center py-8 px-5">
						<div class="flex flex-col my-auto items-center gap-6">
							<p class="text-c-on-bg/50 text-center">{$LL.History.NoGenerationsYet()}</p>
							<Button href="/generate">{$LL.Shared.StartGeneratingButton()}</Button>
							<div class="h-[1vh]" />
						</div>
					</div>
				{:else if $windowWidth}
					<div class="w-full flex-1 flex flex-col">
						{#key $userGalleryCurrentView}
							<GenerationGridInfinite2
								generationsQuery={userGenerationFullOutputsQuery}
								cardType="history"
								cols={$windowWidth > xxlBreakpoint
									? 6
									: $windowWidth > xlBreakpoint
									? 5
									: $windowWidth > lgBreakpoint
									? 4
									: $windowWidth > mdBreakpoint
									? 3
									: 2}
							/>
						{/key}
					</div>
				{/if}
			{/if}
		</div>
	{/if}
</div>

{#if $activeGeneration}
	<GenerationFullScreen
		onLeftButtonClicked={leftIndex !== -1
			? () => setActiveGenerationToOutputIndex(outputs, leftIndex)
			: undefined}
		onRightButtonClicked={rightIndex !== -1
			? () => setActiveGenerationToOutputIndex(outputs, rightIndex)
			: undefined}
		generation={$activeGeneration}
		modalType="history"
	/>
{/if}
