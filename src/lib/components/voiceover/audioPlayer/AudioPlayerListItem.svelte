<script lang="ts">
	import IconSpeaker from '$components/icons/IconVoiceoverSpeaker.svelte';
	import MuteButton from '$components/voiceover/audioPlayer/MuteButton.svelte';
	import PlayPauseButton from '$components/voiceover/audioPlayer/PlayPauseButton.svelte';
	import Slider from '$components/voiceover/audioPlayer/Slider.svelte';
	import {
		areValuesTooClose,
		convertSecondsToTimestamp,
		toggleMute,
		togglePlay
	} from '$components/voiceover/audioPlayer/helpers';
	import { voiceoverSpeakerIdToDisplayName } from '$ts/constants/voiceover/models';
	import { allAudioPlayers } from '$ts/stores/allPlayers';
	import { onDestroy, onMount } from 'svelte';
	import type { TVoiceoverFullOutput } from '$ts/stores/user/voiceovers';
	import DownloadButton from '$components/voiceover/audioPlayer/DownloadButton.svelte';
	import IconAnimatedSpinner from '$components/icons/IconAnimatedSpinner.svelte';
	import IconSadFaceOutline from '$components/icons/IconSadFaceOutline.svelte';
	import { quadOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	import { timestampPlaceholder } from '$components/voiceover/audioPlayer/constants';

	export let output: TVoiceoverFullOutput;
	export let hasMute = false;
	export let inHorizontal = false;
	export { classes as class };
	export let noLayoutChange = false;
	let classes = '';

	let playButton: HTMLButtonElement;
	let muteButton: HTMLButtonElement;

	let currentTime = 0;
	let duration: number;
	let sliderValue = 0;
	let audioElement: HTMLAudioElement;
	let isPaused = true;
	let isPlaying = false;
	let isMuted = false;
	let buffered: TimeRanges;

	$: totalTimestamp = duration
		? convertSecondsToTimestamp(duration)
		: output.audio_duration
		? convertSecondsToTimestamp(output.audio_duration)
		: undefined;
	$: currentTimestamp = currentTime ? convertSecondsToTimestamp(currentTime) : undefined;

	$: [currentTime], onCurrentTimeChanged();
	$: [sliderValue], onSliderValueChanged();

	$: isOutputLoadingOrFailed =
		output.voiceover.status === 'failed' ||
		output.voiceover.status === 'to-be-submitted' ||
		output.voiceover.status === 'server-received' ||
		output.voiceover.status === 'server-processing';

	function onCurrentTimeChanged() {
		sliderValue = Math.floor(currentTime * 1000);
	}

	let sliderStoppedAudio = false;
	function onSliderValueChanged() {
		const toBeTime = sliderValue / 1000;
		if (areValuesTooClose(toBeTime, currentTime)) return;
		if (!audioElement.paused) {
			audioElement.pause();
			sliderStoppedAudio = true;
		}
		currentTime = toBeTime;
	}

	function sliderOnPointerUp() {
		if (sliderStoppedAudio && audioElement.paused) {
			audioElement.play();
		}
		sliderStoppedAudio = false;
	}

	onMount(() => {
		$allAudioPlayers.add(audioElement);
	});

	onDestroy(async () => {
		audioElement?.pause();
		$allAudioPlayers.delete(audioElement);
	});
</script>

<div
	on:keydown={(e) => {
		if (e.target === playButton || e.target === muteButton) return;
		if (e.key === ' ') {
			togglePlay({ audioElement });
		}
	}}
	class="{inHorizontal ? 'h-full' : ''} w-full bg-c-bg-secondary {noLayoutChange
		? 'flex flex-col items-start px-3 pt-1.5 pb-1 rounded-xl'
		: 'flex flex-row md:flex-col items-center md:items-start px-1 py-1 md:px-3 md:pt-1.5 md:pb-1 rounded-lg md:rounded-xl'}
		shadow-lg shadow-c-shadow/[var(--o-shadow-normal)]
		overflow-hidden relative z-0 group/audio-player-list-item {classes}"
>
	<div
		class="{noLayoutChange
			? 'w-full pb-1'
			: 'md:w-full pl-0.5 md:pl-0 pr-1 md:pr-0 md:pb-1'} flex justify-between items-center gap-2"
	>
		<div class="flex-shrink min-w-0 w-full flex justify-start items-center py-0.5">
			<div
				class="rounded-md bg-c-bg-tertiary overflow-hidden
					flex items-center justify-start relative z-0 ring-2 ring-c-bg-tertiary"
			>
				<div
					class="{noLayoutChange
						? 'w-7 h-7'
						: 'w-10 h-10 md:w-7 md:h-7'} flex-shrink-0 shadow-lg overflow-hidden relative z-0"
				>
					<IconSpeaker
						class="w-full h-full"
						type={output.voiceover.speaker.id}
						sizes={noLayoutChange ? '28px' : '(min-width: 768px) 28px, 40px'}
					/>
				</div>
				<p
					class="{noLayoutChange ? 'block' : 'hidden md:block'} text-c-on-bg flex-shrink min-w-0
					whitespace-nowrap overflow-hidden overflow-ellipsis text-sm font-medium
					px-2.5 py-1 h-full"
				>
					{$voiceoverSpeakerIdToDisplayName[output.voiceover.speaker.id]}
				</p>
			</div>
		</div>
		<div class="{noLayoutChange ? 'flex' : 'hidden md:flex lg:hidden xl:flex'} -mr-2 items-center">
			<DownloadButton {output} faded disabled={isOutputLoadingOrFailed} />
		</div>
	</div>
	{#if !noLayoutChange}
		<p
			class="hidden lg:block xl:hidden text-sm text-c-on-bg py-1 max-w-full whitespace-nowrap overflow-hidden overflow-ellipsis"
		>
			{output.voiceover.prompt.text}
		</p>
	{/if}
	<div
		class="{inHorizontal ? 'h-full' : ''} {noLayoutChange
			? 'w-full'
			: 'md:w-full'} flex-1 min-w-0 flex items-center justify-center"
	>
		<audio
			src={output.audio_file_url}
			aria-label={output.voiceover.prompt.text}
			bind:currentTime
			bind:duration
			bind:this={audioElement}
			bind:muted={isMuted}
			bind:buffered
			preload="none"
			on:playing={() => {
				isPlaying = true;
			}}
			on:play={() => (isPaused = false)}
			on:pause={() => {
				isPaused = true;
				isPlaying = false;
			}}
		/>
		<div class="flex items-center {noLayoutChange ? '-ml-2' : 'md:-ml-2'}">
			<PlayPauseButton
				bind:element={playButton}
				onClick={() => {
					togglePlay({ audioElement });
				}}
				{isPaused}
				{isPlaying}
				disabled={isOutputLoadingOrFailed}
			/>
			{#if hasMute}
				<MuteButton
					bind:element={muteButton}
					onClick={() => toggleMute(audioElement)}
					{isMuted}
					disabled={isOutputLoadingOrFailed}
				/>
			{/if}
		</div>
		<div
			class="flex-1 min-w-0 flex flex-col {noLayoutChange
				? 'pl-2 pr-0.5'
				: '-mb-2.5 md:mb-0 pl-1 md:pl-2 pr-0.5'}"
		>
			<p
				class="{noLayoutChange
					? 'block py-1'
					: 'lg:hidden xl:block md:py-1'} text-xs md:text-sm text-c-on-bg max-w-full
				whitespace-nowrap overflow-hidden overflow-ellipsis"
			>
				{output.voiceover.prompt.text}
			</p>
			<div
				class="w-full flex items-center {noLayoutChange
					? '-mt-1'
					: '-mt-1.5 md:-mt-1 lg:mt-0 xl:-mt-1'}"
			>
				<div class="flex-1 self-stretch h-8">
					<div class="w-full h-full flex items-center relative">
						<Slider
							{buffered}
							disabled={isOutputLoadingOrFailed}
							{duration}
							min={0}
							max={Math.floor((duration || output.audio_duration) * 1000)}
							name="Audio Player"
							bind:value={sliderValue}
							step={1}
							onPointerUp={sliderOnPointerUp}
						/>
					</div>
				</div>
				<p
					class="{noLayoutChange
						? 'block'
						: 'hidden md:block lg:hidden xl:block'} pl-3 text-xs text-c-on-bg/50"
				>
					{currentTime && currentTimestamp ? currentTimestamp : timestampPlaceholder}
					<span class="text-c-on-bg/25">/</span>
					{(duration || output.audio_duration) && totalTimestamp
						? totalTimestamp
						: timestampPlaceholder}
				</p>
			</div>
		</div>
	</div>
	{#if !noLayoutChange}
		<div
			class="w-auto md:w-full flex md:hidden lg:flex items-center justify-between xl:hidden lg:pb-0.5"
		>
			<div class="-mr-0.5 lg:mr-0 lg:-ml-2 flex items-center">
				<DownloadButton {output} faded disabled={isOutputLoadingOrFailed} />
			</div>
			<div
				class="order-first lg:order-last flex-shrink min-w-0 pl-2 lg:pl-3 text-xs text-c-on-bg/50 text-right"
			>
				<p class="px-0.25 flex-shrink min-w-0 overflow-hidden overflow-ellipsis">
					{currentTime && currentTimestamp ? currentTimestamp : timestampPlaceholder}
				</p>
				<p class="px-0.25 flex-shrink min-w-0 overflow-hidden overflow-ellipsis">
					{(duration || output.audio_duration) && totalTimestamp
						? totalTimestamp
						: timestampPlaceholder}
				</p>
			</div>
		</div>
	{/if}
	<!-- If loading or failed -->
	{#if isOutputLoadingOrFailed}
		<div
			transition:fade|local={{ duration: 1000, easing: quadOut }}
			class="w-full h-full absolute left-0 top-0 flex items-center justify-center {output.voiceover
				.status === 'failed'
				? 'bg-c-bg-secondary'
				: 'bg-c-bg-secondary/90'}"
		>
			{#if output.voiceover.status === 'failed'}
				<IconSadFaceOutline class="w-7 h-7 md:w-9 md:h-9 text-c-on-bg/50" />
			{:else}
				<IconAnimatedSpinner class="w-7 h-7 md:w-9 md:h-9 text-c-on-bg/50" loading={true} />
			{/if}
		</div>
	{/if}
</div>
