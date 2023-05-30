import {
	getGalleryInfiniteQueryKey,
	getGalleryInfiniteQueryProps
} from '$routes/(app)/gallery/constants';
import {
	availableGenerationModelIds,
	type TAvailableGenerationModelId
} from '$ts/constants/generationModels';
import { apiUrl } from '$ts/constants/main';
import type { TAvailableSchedulerId } from '$ts/constants/schedulers';
import { convertToDBTimeString } from '$ts/helpers/convertToDBTimeString';
import type { TGalleryGenerationFullOutputPageRes } from '$ts/queries/galleryGenerations';
import type { TGenerationFullOutput, TGenerationOutput } from '$ts/stores/user/generation';
import type { QueryClient } from '@tanstack/svelte-query';
import type { PageLoad } from './$types';
import { isHydrated } from '$ts/helpers/isHydrated';
import { redirect } from '@sveltejs/kit';

interface TParent {
	queryClient: QueryClient;
	globalSeed: number;
}

export const load: PageLoad = async ({ url, parent }) => {
	const { queryClient, globalSeed } = (await parent()) as TParent;
	const hasInitialData = queryClient.getQueryData(getGalleryInfiniteQueryKey({})) !== undefined;
	if (!hasInitialData) {
		try {
			await queryClient.prefetchInfiniteQuery(getGalleryInfiniteQueryProps({ seed: globalSeed }));
		} catch (error) {
			console.log(error);
		}
	}
	const searchQuery = url.searchParams.get('q');
	const modelIdQuery = url.searchParams.get('mi');
	const modelIds = modelIdQuery ? modelIdQuery.split(',') : [];
	const filteredModelIds = modelIds.filter((modelId) =>
		availableGenerationModelIds.includes(modelId as TAvailableGenerationModelId)
	);
	const outputId = url.searchParams.get('output');
	if (outputId) {
		throw redirect(302, `/gallery/o/${outputId}`);
	}
	return {
		searchQuery,
		modelIds: filteredModelIds
	};
};
