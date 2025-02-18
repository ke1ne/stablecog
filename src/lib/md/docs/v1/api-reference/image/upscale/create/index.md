---
title: Upscale Image
description: Learn how to upscale images using the Stablecog API.
author: M. Yekta Güngör
author_url: https://twitter.com/ngyekta
date: 2023-05-26T15:00:00.000Z
preview_image_url: https://ba.stablecog.com/docs/previews/create.jpg
---

<script>
	import TypescriptRequest from './request/typescript.md';
	import PythonRequest from './request/python.md';
	import CurlRequest from './request/curl.md';
	import Response from './request/response.json';
	import Tabs from '$components/docs/tabs/Tabs.svelte';
	import Tab from '$components/docs/tabs/Tab.svelte';
	import RequestLine from '$components/docs/RequestLine.svelte';
	import Spacer from '$components/docs/Spacer.svelte';
	import Property from '$components/docs/Property.svelte';
	import Expandible from '$components/docs/Expandible.svelte';
	import CollapsibleJSON from '$components/docs/collapsibleJSON/CollapsibleJSON.svelte';
	import Code from '$components/docs/Code.svelte';
</script>

# Create Upscale

<RequestLine method='POST'>
	/v1/image/upscale/create
</RequestLine>

This endpoint is for upscaling images. You can upscale the result of your generations or an arbitrary image.

## Request Example

Below is an example for an upscale. You can just send an output ID that belongs to your account or an arbitrary image url and the system will use the defaults for the rest.

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

<CollapsibleJSON json={Response} title="Response"/>

<Spacer/>

## Request Headers

<Property name="Authorization" required type="string">
	Send your API key as the value of this header in the following form:<br>
	<Code>{"Authorization: Bearer <YOUR_STABLECOG_API_KEY>"}</Code>.
</Property>

<Spacer/>

## Request Body

<Property name="input" type="string" required>
	The input for the upscale. An output ID belonging to your account or any image URL.<br>
	Here are the constraints for the input image:<br>
	<ul>
		<li>Maximum width: <Code>1024</Code>.</li>
		<li>Maximum height: <Code>1024</Code>.</li>
		<li>Formats: <Code>JPG</Code>, <Code>PNG</Code>, <Code>WebP</Code>.</li>
</Property>
<Property name="model_id" type="TUpscaleModelID" typeModifier="enum">
	The ID of the upscale model.
	<Expandible title="TUpscaleModelID" yPadding>
		You can get the list of available upscale model IDs from the <Code href='/docs/v1/api-reference/image/upscale/models'>/v1/image/upscale/models</Code> endpoint.
	</Expandible>
</Property>

<Spacer/>

## Response Body

<Property name="outputs" type="TOutput" typeModifier="array">
	Upscaled verions of the images.
	<Expandible title="TOutput">
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
<Property name="settings" type="TUpscaleSettings" typeModifier="object">
	Settings for the upscale. Useful if you are using the defaults and want to know what they are.
	<Expandible title="TUpscaleSettings">
		<Property name="model_id" type="TUpscaleModelID" typeModifier="enum">
			The model ID for the upscaler that was used.
			<Expandible title="TUpscaleModelID" yPadding>
				You can get the list of available upscale model IDs from the <Code href='/docs/v1/api-reference/image/upscale/models'>/v1/image/upscale/models</Code> endpoint.
			</Expandible>
		</Property>
		<Property name="input" type="string">
			The input that was used for the upscale.
		</Property>
	</Expandible>
</Property>
