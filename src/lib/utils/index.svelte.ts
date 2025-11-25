import { untrack } from 'svelte';

export function explicitEffect(fn: () => void, depsFn: () => void) {
	$effect(() => {
		depsFn();
		untrack(fn);
	});
}
