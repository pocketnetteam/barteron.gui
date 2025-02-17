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
						v-if="!avatar?.startsWith('http')"
						:style="hslColor"
					>{{ shortName }}</i>
					
					<picture v-else>
						<img :src="avatar" :alt="user?.name">
					</picture>
				</a>
			</li>

			<li>
				<v-button 
					id="create-offer-button"
					vType="light"
					@click="$event => requestPermissions($event, { path: '/barter/create' })"
				>
					<i class="fa fa-plus"></i>
					<span>{{ $t('pageLabels.createBarter') }}</span>
				</v-button>
			</li>
		</ul>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>