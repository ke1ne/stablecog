---
title: Upscale Defaults
description: Learn how to retrive the defaults for the upscale operation using the Stablecog API.
author: M. Yekta Güngör
author_url: https://twitter.com/ngyekta
date: 2023-05-26T15:00:00.000Z
preview_image_url: https://ba.stablecog.com/docs/previews/defaults.jpg
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

# Upscale Defaults

<RequestLine method='GET'>
	/v1/image/upscale/defaults
</RequestLine>

This endpoint is for retrieving the defaults for the upscale operation.

## Request Example

Below is an example for retrieving the defaults for the upscale operation.

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

## Response Body

<Property name="model_id" type="TUpscaleModelID" typeModifier="enum">
  The ID of the upscale model.
	<Expandible title="TUpscaleModelID" yPadding>
		You can get the list of available upscale model IDs from the <Code href='/docs/v1/api-reference/image/upscale/models'>/v1/image/upscale/models</Code> endpoint.
	</Expandible>
</Property>
