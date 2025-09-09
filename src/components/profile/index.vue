<template>
	<div class="profile">
		<div class="row author">
			<div class="col">
				<router-link
					v-if="hash"
					class="avatar"
					:to="{ name: 'profile', params: { id: hash } }"
				>
					<i
						v-if="!avatar?.startsWith('http')"
						:style="hslColor"
					>{{ shortName }}</i>
					
					<picture v-else>
						<img :src="avatar" :alt="user.name">
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
						<span>{{ ratingInfo }}</span>
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
				<template v-if="account?.regdate">
					<dt><i class="fa fa-calendar-day"></i></dt>
					<dd>{{
					$t('profileLabels.on_barteron_from', { date: $d(account.regdate, 'middle', $i18n.locale) })
					}}</dd>
				</template>
				
				<template v-if="geohash">
					<dt><i class="fa fa-map-marker-alt"></i></dt>
					<dd>{{ geopos }}</dd>
				</template>
			</dl>
		</div>

		<!-- Account state -->
		<div class="row state" v-if="$slots.state">
			<slot name="state"></slot>
		</div>

		<!-- Validation conditions -->
		<div 
			v-if="showValidationConditions"
			class="row validation-conditions"
		>
			<span>
				<i class="fa fa-info-circle"></i>
				{{ validationConditions }}
			</span>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>