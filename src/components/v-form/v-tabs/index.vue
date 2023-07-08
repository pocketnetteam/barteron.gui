<template>
	<div :class="{
		'tabs': true,
		[vType]: vType
	}">
		<div class="tabset">
			<div class="tabset-before" v-if="$slots.before">
				<slot name="before"></slot>
			</div>

			<ul>
				<li
					v-for="(tab, i) in tabset"
					:key="i"
					:class="{ 'active': active === tab.tabId }"
				>
					<a
						:href="`#${ tab.tabId }`"
						v-html="tab.title"
						@click="$event => change($event, i)"
					></a>
				</li>
			</ul>

			<div class="tabset-after" v-if="$slots.after">
				<slot name="after"></slot>
			</div>
		</div>
		
		<div :id="active" class="tabcontent">
			<template
				v-for="tab in tabset"
			>
				<slot
					:name="tab.tabId"
					v-if="active === tab.tabId"
				></slot>
			</template>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>