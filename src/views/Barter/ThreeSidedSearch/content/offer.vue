<template>
	<li>
		<router-link :to="{ name: 'barterItem', params: { id: deal.hash } }">
			<img :src="deal.images?.[0]" :alt="deal.caption">
			<p>{{ deal.caption }}</p>
		</router-link>

		<router-link
			class="avatar"
			:to="{ name: 'profile', params: { id: deal.address } }"
		>
			<i
				v-if="!user?.i"
				:style="user?.hslColor"
			>{{ user?.shortName }}</i>
			
			<picture v-else>
				<img :src="user?.i" :alt="user?.name">
			</picture>
		</router-link>
	</li>
</template>

<script>
import NameToHSL from "@/js/nametohsl.js";
export default {
	name: "Offer",

	props: {
		deal: Object
	},

	data() {
		return {
			color: new NameToHSL()
		}
	},

	computed: {
		user() {
			const user = this.sdk.accounts[this.deal.address];

			return {
				address: this.deal.address,
				i: user?.i,
				name: user?.name,
				shortName: user?.name?.substring(0, 1).toUpperCase() || "U",
				hslColor: `--color: ${ this.color.generateHSL(user?.name || "User") }`
			}
		}
	}
}
</script>