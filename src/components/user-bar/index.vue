<template>
	<div class="user-bar">
		<ul>
			<li>
				<CurrencySwitcher />
			</li>

			<li>
				<a
					class="avatar"
					@click="$event => requestPermissions($event, { path: `/profile/${ address }` })"
				>
					<i
						v-if="!user?.i?.startsWith('http')"
						:style="hslColor"
					>{{ shortName }}</i>
					
					<picture v-else>
						<img :src="user?.i" :alt="user?.name">
					</picture>
				</a>
			</li>

			<li>
				<v-button @click="$event => requestPermissions($event, { name: 'createBarter' })">
					<i class="fa fa-plus"></i>
					<span>{{ $t('pageLabels.createBarter') }}</span>
				</v-button>
			</li>
		</ul>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>