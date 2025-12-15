<script lang="ts">
	import Time from '$lib/components/journey/time.svelte';
	import { Accordion } from 'bits-ui';
	import dayjs from 'dayjs';
	import { Footprints } from 'lucide-svelte';

	let { data } = $props();
</script>

{#await data.journey}
	...
{:then plans}
	<Accordion.Root type="single" class="flex flex-col gap-4 p-4">
		{#each plans as plan, i (i)}
			<Accordion.Item
				value={`plan-${i}`}
				class="border-border bg-background rounded-md border p-2 drop-shadow-sm"
			>
				<Accordion.Header>
					<Accordion.Trigger class="group w-full">
						{@const noWalking = plan.legs.filter((leg) => leg.mode !== 'walking')}
						<div class="flex w-full flex-col gap-2 px-2 py-4">
							<div class="flex items-center gap-2">
								<div class="text-xl font-semibold">
									{plan.duration >= 60 ? Math.floor(plan.duration / 60) + 'h' : null}
									{plan.duration % 60}m
								</div>
								<div>
									<div class="text-xs/3">
										{dayjs(plan.departureTime).format('HH:mm')}
									</div>
									<div class="text-sm/4 font-medium">
										{dayjs(plan.arrivalTime).format('HH:mm')}
									</div>
								</div>
							</div>
							<div
								class="flex w-full items-center overflow-hidden px-2 py-2 group-data-[state=open]:hidden"
							>
								{#each noWalking as leg, i (i)}
									{#if leg.mode === 'tube'}
										{#if noWalking[i - 1]?.mode !== 'tube'}
											{#if i === 0}
												<div
													class="flex h-7 min-w-7 scale-125 items-center justify-center rounded-full bg-black text-[10px] text-white"
												>
													{leg.from?.crs ?? data.from}
												</div>
											{/if}
											<div class={['h-2 min-w-4 bg-black']}></div>
											<div
												class="flex h-7 min-w-7 scale-125 items-center justify-center rounded-full border border-black bg-white"
											>
												<img
													src="https://upload.wikimedia.org/wikipedia/commons/c/ca/Underground_%28no_text%29.svg"
													class="h-4 w-4"
													alt=""
												/>
											</div>
										{/if}
										<div
											style:width="{leg.duration * 1.2 + 16}px"
											class={[
												'flex h-5 min-w-4 items-center justify-center text-[10px] text-white/80'
											]}
											style:background={leg.operatorColor}
										>
											{leg.duration}
										</div>
										{#if i === noWalking.length - 1}
											<div
												class="flex h-7 min-w-7 scale-125 items-center justify-center rounded-full bg-black text-[10px] text-white"
											>
												{leg.to?.crs ?? data.to}
											</div>
										{/if}
									{:else}
										<div
											class="flex h-7 min-w-7 scale-125 items-center justify-center rounded-full bg-black text-[10px] text-white"
										>
											{leg.from?.crs ?? noWalking[i - 1]?.to?.crs ?? data.from}
										</div>
										<div
											style:width="{leg.duration * 1.2 + 16}px"
											class={[
												'min-w- flex h-5 items-center justify-center text-[10px] text-white/80'
											]}
											style:background={leg.operatorColor}
										>
											{leg.duration}
										</div>

										{#if i === noWalking.length - 1 || noWalking[i + 1]?.mode === 'tube'}
											<div
												class="flex h-7 min-w-7 scale-125 items-center justify-center rounded-full bg-black text-[10px] text-white"
											>
												{leg.to?.crs ?? data.to}
											</div>
										{/if}
									{/if}
								{/each}
							</div>
						</div>
					</Accordion.Trigger>
				</Accordion.Header>
				<Accordion.Content>
					<div class="flex flex-col gap-0 p-4">
						{#each plan.legs as leg, i (i)}
							{#if leg.mode === 'walking'}
								<div class="flex flex-col">
									<div class="flex h-14 min-h-14 items-center gap-3">
										<div class="min-w-10"></div>
										<div class="flex h-full min-w-4 flex-col items-center px-1">
											<div class="w-1 grow" style:background={leg.operatorColor}></div>
										</div>
										<div class="flex min-w-0 grow flex-col justify-end gap-3 pt-6">
											<div class="flex items-center gap-1 text-sm">
												<Footprints size={14} />
												{leg.duration}m
											</div>
											<div class={['truncate pt-1 text-lg/5 font-semibold']}>
												{leg.to?.name}
											</div>
										</div>
									</div>
								</div>
							{:else}
								<div class="flex flex-col">
									<div class="flex items-center gap-3">
										<div
											class={[
												'flex h-4 w-10 flex-col items-end justify-center',
												i === 0 ? '-translate-y-1' : ''
											]}
										>
											<Time scheduled={leg.scheduledDeparture} estimated={leg.estimatedDeparture} />
										</div>
										<div
											class={[
												'flex w-4 flex-col items-center px-1',
												leg.mode === 'tube' ? 'h-10' : 'h-14'
											]}
										>
											<div class="grow"></div>
											<div class="h-1.5 w-4" style:background={leg.operatorColor}></div>
											<div class="w-1.5 grow" style:background={leg.operatorColor}></div>
										</div>

										<div class={['flex grow flex-col justify-center']}>
											<!-- <div class={['text-lg/4 font-semibold']}>
										{leg.from?.name}
									</div> -->
											{#if leg.mode === 'tube'}
												<div class="flex w-full items-center gap-1 text-xs">
													{#if i !== 0}Change to{:else}Take{/if}
													<img
														class="h-3 min-w-3"
														src="https://upload.wikimedia.org/wikipedia/commons/c/ca/Underground_%28no_text%29.svg"
														alt=""
													/>
													<div class="text-sm">
														{leg.operator}
													</div>
												</div>
											{:else if leg.mode !== 'walking'}
												<div class="flex gap-1 text-xs">
													{#if i !== 0}Change to{:else}Take{/if}
													<div
														class="w-max rounded px-1.5 py-0.5 text-[10px]/3 text-white"
														style:background={leg.operatorColor}
													>
														{leg.operator}
													</div>
												</div>

												<div class="text-sm/4">
													towards <span class="font-semibold">{leg.destination}</span>
												</div>
											{/if}
										</div>
									</div>
									{#if leg.mode === 'tube'}
										<div class="flex flex-col">
											<div class="flex h-4 items-center gap-3">
												<div class="w-10"></div>
												<div class="flex h-full w-4 flex-col items-center justify-center px-1">
													<div class="h-full w-1.5" style:background={leg.operatorColor}></div>
												</div>

												<div class="text-sm font-medium">
													{leg.duration}m
												</div>
											</div>
										</div>
									{:else if leg.callingPoints}
										{#each leg.callingPoints as cp, i (cp.crs + i)}
											<div class="flex h-8 items-center gap-3">
												<div class="flex w-10 flex-col items-end">
													<Time scheduled={cp.scheduled} estimated={cp.estimated} small />
												</div>
												<div class="flex h-full w-4 flex-col items-center justify-center px-1">
													<div class="w-1.5 grow" style:background={leg.operatorColor}></div>
													<div class="flex h-1.5 w-4 items-center">
														<div class="w-[5px]"></div>
														<div class="h-1.5 grow" style:background={leg.operatorColor}></div>
													</div>
													<div class="w-1.5 grow" style:background={leg.operatorColor}></div>
												</div>
												<div class="text-muted-foreground text-xs">{cp.name}</div>
											</div>
										{/each}
									{/if}
									<div class="flex h-10 items-center gap-3">
										<div class="flex w-10 flex-col items-end">
											<Time scheduled={leg.scheduledArrival} estimated={leg.estimatedArrival} />
										</div>
										<div class="flex h-10 w-4 flex-col items-center px-1">
											<div class="w-1.5 grow" style:background={leg.operatorColor}></div>

											<div class="h-1.5 w-4" style:background={leg.operatorColor}></div>
											<div class="grow"></div>
										</div>

										<div class="flex flex-col">
											<div class={['text-lg/3 font-semibold']}>
												{leg.to?.name}
											</div>
										</div>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				</Accordion.Content>
			</Accordion.Item>
		{/each}
	</Accordion.Root>
{/await}
