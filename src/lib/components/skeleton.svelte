<script lang="ts">
    let {class: className, style = ""} = $props();
</script>

<div {style} class={["bg-zinc-200 animate-pulse rounded-md", className]}></div>