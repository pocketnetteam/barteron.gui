<template>
	<div
		:class="{
			'v-button-holder': true,
			'has-dropdown': hasDropdown,
			'dropdown-open': active
		}"
	>
		<slot name="before"></slot>

		<component
			:is="type"
			:to="to"
			:class="{
				'v-button': true,
				'v-button-right': vAlign === 'right',
				[prefix(vType ?? 'primary', 'v-button')]: true,
				[prefix(vSize ?? 'md', 'v-button')]: true,
				active
			}"
			:disabled="disabled"
			ref="button"
			@mousedown="animateRipple"
			@mousedown.native="animateRipple"
			@touch:start="animateRipple"
			@touch:start.native="animateRipple"
			@click="clickButton"
		>
			<span
				class="text"
				ref="text"
			>
				<slot v-if="$slots.default"></slot>
				<template v-if="vHtml || vText">{{ rawHTML }}</template>

				<i class="fa fa-angle-down v-dropdown-arrow" v-if="hasDropdown"></i>
			</span>

			<transition-group
				class="ripples"
				v-if="ripples.filter(r => r.show).length"
			>
				<template
					v-for="(ripple, index) in ripples"
				>
					<span
						class="ripple"
						v-if="ripple.show"
						:ref="`ripple-${ index }`"
						:key="`ripple-${ index }`"
						:style="{'top': `${ ripple.y }px`, 'left': `${ ripple.x }px`}"
						@animationend="rippleEnd(index)"></span>
				</template>
			</transition-group>
		</component>

		<div class="v-button-dropdown" v-if="hasDropdown">
			<slot name="dropdown" v-if="$slots.dropdown"></slot>
			
			<ul v-else>
				<li
					v-for="(item, index) in dropdown"
					:key="index"
					@click="$event => clickItem($event, item, index)"
				>
					<span>{{ item[dropdownItemKey] || item.text || item }}</span>
				</li>
			</ul>
		</div>

		<slot name="after"></slot>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>