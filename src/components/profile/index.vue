<template>
	<div class="profile">
		<div class="row author">
			<div class="col">
				<router-link class="avatar" :to="{ name: 'profile', params: { id: address } }" v-if="address">
					<i
						v-if="!user.i"
						:style="hslColor"
					>{{ shortName }}</i>
					
					<picture class="status-online" v-else>
						<img :src="user.i" :alt="user.name">
					</picture>
				</router-link>
			</div>

			<div class="col user">
				<ul class="list">
					<li>
						<strong class="label">{{ user?.name }}</strong>
					</li>

					<li>
						<Score :value="account?.rating || 0" />
					</li>

					<li>
						<span>
							{{ (account?.rating || 0).toFixed(1) }} {{ $t('ratingLabels.label').toLowerCase() }} 
							(0 {{ $t('ratingLabels.reviews').toLowerCase() }})</span>
					</li>
				</ul>
			</div>
		</div>

		<!-- Profile edit -->
		<div class="row edit" v-if="$slots.edit">
			<slot name="edit"></slot>
		</div>

		<!-- Profile info -->
		<div class="row info">
			<dl class="list">
				<dt><i class="fa fa-calendar-day"></i></dt>
				<dd>{{
				$t('profileLabels.on_barteron_from', { date: $d(account.regdate, 'middle', $i18n.locale) })
				}}</dd>
				<dt><i class="fa fa-map-marker-alt"></i></dt>
				<dd>Astana, Kazakhstan</dd>
			</dl>
		</div>

		<!-- Account state -->
		<div class="row state" v-if="$slots.state">
			<slot name="state"></slot>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>