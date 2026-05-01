import { getConfig, getConfigError } from '$lib/server/config';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => {
	const config = getConfig();
	return {
		config,
		configError: getConfigError()
	};
};
