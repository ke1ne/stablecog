---
title: Generate Image
description: Learn how to generate images using the Stablecog API.
author: M. Yekta Güngör
author_url: https://twitter.com/ngyekta
date: 2023-05-26T15:00:00.000Z
preview_image_url: https://ba.stablecog.com/docs/previews/create.jpg
---

<script>
	import TypescriptRequest from './request/typescript.md';
	import PythonRequest from './request/python.md';
	import CurlRequest from './request/curl.md';
	import Tabs from '$components/docs/tabs/Tabs.svelte';
	import Tab from '$components/docs/tabs/Tab.svelte';
	import RequestLine from '$components/docs/RequestLine.svelte';
	import Spacer from '$components/docs/Spacer.svelte';
	import Property from '$components/docs/Property.svelte';
	import Expandible from '$components/docs/Expandible.svelte';
	import Code from '$components/docs/Code.svelte';
	import CollapsibleJSON from '$components/docs/collapsibleJSON/CollapsibleJSON.svelte';
	import response from '$md/docs/v1/api-reference/image/generation/create/request/response.json';
</script>

# Create Generation

<RequestLine method='POST'>
	/v1/image/generation/create
</RequestLine>

This endpoint is for generating images. Although it supports many parameters, in its simplest form, you just need to send a prompt and the system will use the defaults for the rest.

## Request Example

Below is the simplest example of generating an image. You just send a prompt and the system will use the defaults for the rest.

<Tabs>
	<Tab value="cURL">
		<CurlRequest />
	</Tab>
	<Tab value="TypeScript">
		<TypescriptRequest />
	</Tab>
	<Tab value="Python">
		<PythonRequest />
	</Tab>
</Tabs>

<CollapsibleJSON json={response} title="Response" />

<Spacer/>

## Request Headers

<Property name="Authorization" required type="string">
	Send your API key as the value of this header in the following form:<br>
	<Code>{"Authorization: Bearer <YOUR_STABLECOG_API_KEY>"}</Code>.
</Property>

<Spacer/>

## Request Body

<Property name="prompt" required type="string">
	Tell the model what image to generate.
</Property>
<Property name="model_id" type="TGenerationModelID" typeModifier="enum">
	The model that will be used for generating the image.
  <Expandible title="TGenerationModelID" yPadding>
		You can get the list of available models from the <Code href='/docs/v1/api-reference/image/generation/models'>/v1/image/generation/models</Code> endpoint.
	</Expandible>
</Property>
<Property name="width" type="int" min={256} max={1024}>
	The width of the image. The value should be a multiple of <Code>8</Code> and follow this formula:
  <br><Code>{"width * height * inference steps < 640 * 640 * 50"}</Code>.
</Property>
<Property name="height" type="int" min={256} max={1024}>
	The height of the image. The value should be a multiple of <Code>8</Code> and follow this formula:
  <br><Code>{"height * width * inference steps < 640 * 640 * 50"}</Code>.
</Property>
<Property name="negative_prompt" type="string">
	Tell the model what to avoid or exclude when generating the image. The opposite of the <Code>prompt</Code>.
</Property>
<Property name="num_outputs" type="int" min={1} max={4}>
	The number of images to generate.
</Property>
<Property name="guidance_scale" type="float" min={1} max={20}>
	How similar the image will be to your prompt. Higher values make the image closer to your prompt and provides less creative freedom to the model.
</Property>
<Property name="inference_steps" type="int" min={10} max={50}>
	How many steps will be taken to generate the image. Higher values usually provide more details (which isn't always a good thing) but take longer to generate. The value should follow this formula:
	<br><Code>{"inference steps * width * height < 50 * 640 * 640"}</Code>.
</Property>
<Property name="scheduler_id" type="TGenerationSchedulerID" typeModifier="enum">
	Schedulers define the entire denoising process during diffusion.
	<Expandible title="TGenerationSchedulerID" yPadding>
		You can get the list of available scheduler IDs for a given model from the <Code href='/docs/v1/api-reference/image/generation/models'>/v1/image/generation/models</Code> endpoint.
	</Expandible>
</Property>
<Property name="seed" type="int">
	To get repeatable results. Same seed combined with same settings will generate the same image.
</Property>
<Property name="init_image_url" type="string">
	An image URL to base the generation on. The generations using this parameter are often called <Code>img2img</Code> or <Code>image to image</Code> generations.
</Property>
<Property name="prompt_strength" type="float" min={0} max={1}>
	How the model should prioritize <Code>init_image_url</Code> and <Code>prompt</Code>. Higher value will follow the <Code>prompt</Code> more closely, lower value will follow the <Code>init_image_url</Code> more closely.
</Property>

<Spacer/>

## Response Body

<Property name="outputs" type="TOutput" typeModifier="array">
	Generated images.
	<Expandible title="TOutput" >
		<Property name="id" type="string">
			The ID of the output.
		</Property>
		<Property name="url" type="string">
			The URL of the output image.
		</Property>
	</Expandible>
</Property>
<Property name="remaining_credits" type="float">
	Your remaining credits after this request.
</Property>
<Property name="settings" type="TGenerationSettings" typeModifier="object">
	Settings for the generation. Useful if you are using the defaults and want to know what they are.
	<Expandible title="TGenerationSettings">
		<Property name="model_id" type="TGenerationModelID" typeModifier="enum">
			The ID of the model.
			<Expandible title="TGenerationModelID" yPadding>
				You can get the list of available models from the <Code href='/docs/v1/api-reference/image/generation/models'>/v1/image/generation/models</Code> endpoint.
			</Expandible>
		</Property>
		<Property name="width" type="int" min={256} max={1024}>
			The width of the image.
		</Property>
		<Property name="height" type="int" min={256} max={1024}>
			The height of the image.
		</Property>
		<Property name="num_outputs" type="int" min={1} max={4}>
			The number of images.
		</Property>
		<Property name="guidance_scale" type="float" min={1} max={20}>
			The guidance scale for the generation.
		</Property>
		<Property name="inference_steps" type="int" min={10} max={50}>
			The number of inference steps for the generation.
		</Property>
		<Property name="scheduler_id" type="TGenerationSchedulerID" typeModifier="enum">
			The ID of the scheduler.
			<Expandible title="TGenerationSchedulerID" yPadding>
				You can get the list of available scheduler IDs for a given model from the <Code href='/docs/v1/api-reference/image/generation/models'>/v1/image/generation/models</Code> endpoint.
			</Expandible>
		</Property>
		<Property name="seed" type="int">
			The seed for the generation.
		</Property>
	</Expandible>
</Property>
