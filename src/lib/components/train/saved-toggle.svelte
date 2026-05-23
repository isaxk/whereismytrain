<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import dayjs from 'dayjs';
	import { Bell, BellOff, BellRing, BookmarkIcon, GitCompareArrowsIcon, X } from 'lucide-svelte';

	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';

	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { getFCMToken } from '$lib/notifications';
	import { parseSavedInfo } from '$lib/shared/service';
	import { localStore, pwa, saved, setSavedTrainData } from '$lib/state/saved.svelte';
	import type { TrainService, SavedTrain as SavedTrainType } from '$lib/types';
	import { cn, iOS } from '$lib/utils';

	import { api } from '../../../convex/_generated/api';
	import Install from '../home/install.svelte';
	import SubscriptionProvider from '../providers/subscription-provider.svelte';
	import Button, { buttonVariants } from '../ui/button/button.svelte';
	import { Spinner } from '../ui/spinner/index';
	import { PUBLIC_NOTIFICATIONS_ENABLED } from '$env/static/public';

	const convex = useConvexClient();

	let {
		service,
		crs,
		rid,
		filter,
		focus
	}: {
		service: TrainService;
		crs: string;
		rid: string;
		filter: string | null;
		focus: string;
	} = $props();

	const afterCallingPoints = $derived.by(() => {
		const withArrivals = service.callingPoints.filter((cp) => cp.times.plan.arr);
		const focus = withArrivals.findIndex((cp) => cp.crs === crs);
		return focus >= 0 ? withArrivals.slice(focus + 1) : withArrivals;
	});

	const firstAfterCallingPointCrs = $derived.by(() => afterCallingPoints[0]?.crs);

	const promptDismissed = localStore<boolean>('saved-prompt-dismissed', false);

	let alertOpen = $state(false);
</script>

{#if !pwa.value && iOS()}
	<Install
		description="You need to install the app to track your trains and receive notifications on them. Don't worry, it doesn't take long!"
	>
		{#snippet trigger()}
			<Button size="icon" class="bg-input/30 hover:bg-input/50" variant="outline">
				<Bell />
			</Button>
		{/snippet}
	</Install>
{:else}
	<SubscriptionProvider serviceId={rid} {crs} {filter} serviceData={service}>
		{#snippet children({
			subscribed,
			loading,
			notificationsFailed,
			existingOnRoute,
			onUnsubscribe,
			onSwitchFrom,
			onSubscribe
		})}
			{#if subscribed}
				<Button
					size="icon"
					class="relative bg-input/30 hover:bg-input/50"
					variant="outline"
					onclick={() => onUnsubscribe()}
				>
					{#if !notificationsFailed}
						<BellRing fill="currentColor" />
					{:else}
						<BookmarkIcon fill="currentColor" />
						<div
							class="absolute right-0 bottom-0 scale-60 rounded-full p-0.5"
							style:background={service.operator.color}
						>
							<BellOff size={5} fill="currentColor" />
						</div>
					{/if}
				</Button>
				{#if notificationsFailed && PUBLIC_NOTIFICATIONS_ENABLED}
					<div
						class="absolute top-14 right-4 z-20 flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground drop-shadow"
					>
						Failed to setup notifications
						<button onclick={() => {}}><X size={14} /></button>
					</div>
				{/if}
			{:else if existingOnRoute}
				<AlertDialog.Root bind:open={alertOpen}>
					<AlertDialog.Trigger
						class={cn(
							buttonVariants({ variant: 'outline' }),
							'relative w-8 bg-input/30 hover:bg-input/50'
						)}
					>
						<GitCompareArrowsIcon />
					</AlertDialog.Trigger>
					<AlertDialog.Content>
						<AlertDialog.Header>
							<AlertDialog.Title>Replace existing train?</AlertDialog.Title>
							<AlertDialog.Description
								>You already have a train saved for this route on this date. Do you want to replace
								it?</AlertDialog.Description
							>
						</AlertDialog.Header>
						<AlertDialog.Footer>
							<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
							<AlertDialog.Action
								class="sm:w-20"
								onclick={async () => {
									await onSwitchFrom(existingOnRoute.id);
									alertOpen = false;
								}}
							>
								{#if loading}
									<Spinner class="size-4" />
								{:else}
									Replace
								{/if}
							</AlertDialog.Action>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			{:else if filter || (afterCallingPoints.length === 1 && firstAfterCallingPointCrs)}
				<Button
					size="icon"
					variant="outline"
					class="bg-input/30 hover:bg-input/50"
					onclick={() => onSubscribe(filter ?? firstAfterCallingPointCrs!)}
				>
					{#if loading}
						<Spinner class="size-6" />
					{:else}
						<Bell />
					{/if}
				</Button>
				<!-- {/if} -->
				{#if !promptDismissed.value}
					<div
						class="absolute top-14 right-4 z-20 flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground drop-shadow"
					>
						Receive notifications for this train?
						<button onclick={() => (promptDismissed.value = true)}><X size={14} /></button>
					</div>
				{/if}
			{:else}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<Button size="icon" class="bg-input/30 hover:bg-input/50" variant="outline">
							{#if loading}
								<Spinner size="size-6" />
							{:else}
								<Bell />
							{/if}
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						<DropdownMenu.Group>
							<DropdownMenu.Label>Subscribe until when?</DropdownMenu.Label>
							<DropdownMenu.Separator />
							{#each afterCallingPoints as item, i (i)}
								<DropdownMenu.Item onclick={() => onSubscribe(item.crs)}
									>{item.name}</DropdownMenu.Item
								>
							{/each}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
				{#if !promptDismissed.value}
					<div
						class="absolute top-14 right-4 z-20 flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground drop-shadow"
					>
						Receive notifications for this train?
						<button onclick={() => (promptDismissed.value = true)}><X size={14} /></button>
					</div>
				{/if}
			{/if}
		{/snippet}
	</SubscriptionProvider>
{/if}
