<script lang="ts">
	import PlayPauseButton from '../PlayPauseButton.svelte';
	import {
		areValuesTooClose,
		convertSecondsToTimestamp,
		drawWaveform,
		toggleMute,
		togglePlay
	} from '$components/voiceover/audioPlayer/helpers';
	import MuteButton from '$components/voiceover/audioPlayer/MuteButton.svelte';
	import IconSpeaker from '$components/icons/IconVoiceoverSpeaker.svelte';
	import { voiceoverSpeakerIdToDisplayName } from '$ts/constants/voiceover/models';
	import SliderForWaveform from '$components/voiceover/audioPlayer/SliderForWaveform.svelte';
	import type { TVoiceoverFullOutput } from '$ts/stores/user/voiceovers';
	import { onDestroy } from 'svelte';
	import DownloadButton from '$components/voiceover/audioPlayer/DownloadButton.svelte';
	import { timestampPlaceholder } from '$components/voiceover/audioPlayer/constants';

	export let output: TVoiceoverFullOutput;
	export let audioElement: HTMLAudioElement;
	export let isMuted: boolean;
	export let isPaused: boolean;
	export let isPlaying: boolean;
	export let playButton: HTMLButtonElement;
	export let muteButton: HTMLButtonElement;
	export let currentTime: number;
	export let duration: number;
	export let pointCount: number | undefined;
	export let audioArray: number[] | undefined;

	let sliderValue = 0;
	let waveformContainer: HTMLDivElement;
	let waveformContainerWidth: number | undefined = undefined;
	let waveformContainerHeight: number | undefined = undefined;
	let currentTimestamp: string | undefined = undefined;
	let totalTimestamp: string | undefined = undefined;

	$: status = output.status;
	$: audioStatus =
		output.status === 'to-be-submitted' ||
		output.status === 'server-received' ||
		output.status === 'server-processing'
			? 'being-created'
			: output.status === 'succeeded'
			? 'created'
			: 'idle';

	$: progress =
		(duration === 0 || duration) && (currentTime === 0 || currentTime) ? currentTime / duration : 0;
	$: currentTimestamp =
		currentTime !== undefined
			? convertSecondsToTimestamp(currentTime)
			: convertSecondsToTimestamp(0);
	$: totalTimestamp = duration ? convertSecondsToTimestamp(duration) : undefined;

	$: [currentTime], onCurrentTimeChanged();
	$: [sliderValue], onSliderValueChanged();

	$: [
		progress,
		audioArray,
		waveformContainer,
		waveformContainerWidth,
		waveformContainerHeight,
		status,
		audioStatus !== 'created'
	],
		drawWaveformWithCheck();

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
		progress = currentTime / duration;
	}

	function sliderOnPointerUp() {
		if (sliderStoppedAudio && audioElement.paused) {
			audioElement.play();
		}
		sliderStoppedAudio = false;
	}

	async function drawWaveformWithCheck() {
		if (progress !== 0 && !progress) return;
		if (!waveformContainer) return;
		if (!waveformContainerWidth) return;
		if (!waveformContainerHeight) return;
		if (!pointCount) return;
		if (!audioArray) return;
		drawWaveform({
			element: waveformContainer,
			width: waveformContainerWidth,
			height: waveformContainerHeight,
			margin: { top: 0, left: 0, bottom: 0, right: 0 },
			progress,
			gradientStops1: [
				{
					color: 'rgba(var(--c-primary) / 1)',
					offset: '0%'
				},
				{
					color: 'rgba(var(--c-primary) / 0)',
					offset: '100%'
				}
			],
			gradientStops2: [
				{
					color: 'rgba(var(--c-on-bg) / 0.2)',
					offset: '0%'
				},
				{
					color: 'rgba(var(--c-on-bg) / 0)',
					offset: '100%'
				}
			],
			values: audioArray
		});
	}

	onDestroy(() => {
		audioElement?.pause();
		isPlaying = false;
		isPaused = true;
		audioArray = undefined;
		currentTime = 0;
	});
</script>

<div class="w-full flex flex-col px-4 md:px-5">
	<div class="w-full -ml-1 pt-3 md:pt-4 pb-1.5 md:pb-3 flex items-center gap-3 md:gap-4">
		<div
			class="flex-shrink-0 rounded-md ring-2 ring-c-bg-tertiary bg-c-bg-tertiary overflow-hidden
			flex items-center justify-start relative z-0"
		>
			<div
				class="w-8 h-8 md:w-9 md:h-9 flex-shrink-0 ring-2 ring-c-bg-tertiary shadow-lg
				shadow-c-shadow/[var(--o-shadow-strong)] overflow-hidden relative z-0"
			>
				<IconSpeaker
					class="w-full h-full"
					type={output.voiceover.speaker.id}
					sizes="(min-width: 768px) 36px, 32px"
				/>
			</div>
			<p
				class="flex-shrink min-w-0 overflow-hidden overflow-ellipsis font-medium px-2.5 md:px-3.5 py-0.5 md:py-1 h-full"
			>
				{$voiceoverSpeakerIdToDisplayName[output.voiceover.speaker.id]}
			</p>
		</div>
		<p
			class="flex-shrink min-w-0 text-c-on-bg max-w-full whitespace-nowrap overflow-hidden overflow-ellipsis"
		>
			{output.voiceover.prompt.text}
		</p>
	</div>
	<div class="w-full flex items-center justify-center">
		<div class="flex items-center -ml-3">
			<PlayPauseButton
				bind:element={playButton}
				onClick={() => togglePlay({ audioElement })}
				{isPaused}
				{isPlaying}
				size="lg"
			/>
			<MuteButton
				bind:element={muteButton}
				onClick={() => toggleMute(audioElement)}
				{isMuted}
				size="lg"
			/>
			{#if output}
				<DownloadButton size="lg" {output} />
			{/if}
		</div>
		<div class="flex-1" />
		<p class="text-c-on-bg/75">
			{currentTime ? currentTimestamp : timestampPlaceholder}<span
				class="text-c-on-bg/35 px-[0.5ch]">/</span
			>{duration ? totalTimestamp : timestampPlaceholder}
		</p>
	</div>
</div>
<div class="w-full flex-1 flex relative overflow-hidden pt-2">
	<div class="w-full h-full relative">
		<div
			bind:clientWidth={waveformContainerWidth}
			bind:clientHeight={waveformContainerHeight}
			class="w-full h-full"
		>
			{#if waveformContainerWidth && waveformContainerHeight}
				<div class="w-full h-0" bind:this={waveformContainer} />
			{/if}
		</div>
		<div class="w-full h-full flex items-center z-10 absolute left-0 bottom-0">
			<div class="w-full h-full flex flex-col overflow-hidden relative opacity-100">
				<SliderForWaveform
					min={0}
					max={Math.floor(duration * 1000)}
					name="Audio Player"
					bind:value={sliderValue}
					step={1}
					onPointerUp={sliderOnPointerUp}
				/>
			</div>
		</div>
	</div>
</div>
