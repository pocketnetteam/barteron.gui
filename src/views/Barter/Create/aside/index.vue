<template>
	<v-aside>
		<menu class="box steps">
			<menuitem
				v-for="(step, key) in steps"
				:key="key"
				:class="getClass(step)"
			>
				<i :class="'fa fa-circle'" v-if="!step.hasOwnProperty('valid')"></i>
				<i :class="`fa fa-${ step.valid ? 'check' : 'times' }`" v-else></i>

				<a @click="scrollTo(`#${ step.value }`)">
					{{ $t(`stepsLabels.${ step.value }`) }}
				</a>
			</menuitem>
		</menu>
	</v-aside>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>