<template>
	<v-content>
		<ul
			class="group-exchange-holder"
			v-if="/* deals.length */true"
		>
			<li
				class="row"
				v-for="(deal, index) in /* deals */[1]"
				:key="index"
			>
				<div class="col">
					<ul class="offers">
						<li>
							<router-link :to="{ name: 'barterItem', params: { id: source.hash } }">
								<img :src="source.images?.[0]" :alt="source.caption">
								<p>{{ source.caption }}</p>
							</router-link>

							<a
								class="avatar"
								@click="$event => requestPermissions($event, { path: `/profile/${ sourceUser?.address }` })"
							>
								<i
									v-if="!sourceUser?.i"
									:style="sourceUser?.hslColor"
								>{{ sourceUser?.shortName }}</i>
								
								<picture v-else>
									<img :src="sourceUser?.i" :alt="sourceUser?.name">
								</picture>
							</a>
						</li>

						<li>
							<router-link :to="{ name: 'barterItem', params: { id: target.hash } }">
								<img :src="target.images?.[0]" :alt="target.caption">
								<p>{{ target.caption }}</p>
							</router-link>

							<a
								class="avatar"
								@click="$event => requestPermissions($event, { path: `/profile/${ targetUser?.address }` })"
							>
								<i
									v-if="!targetUser?.i"
									:style="targetUser?.hslColor"
								>{{ targetUser?.shortName }}</i>
								
								<picture v-else>
									<img :src="targetUser?.i" :alt="targetUser?.name">
								</picture>
							</a>
						</li>
					</ul>
				</div>
				<div class="col">
					<v-button>{{ $t('buttonLabels.propose_exchange') }}</v-button>
				</div>
			</li>
		</ul>

		<p v-else></p>
	</v-content>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>