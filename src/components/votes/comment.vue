<template>
	<article class="comment">
		<div class="comment-left">
			<div class="avatar">
				<i
					v-if="!user?.i?.startsWith('http')"
					:style="hslColor"
				>{{ shortName }}</i>
				
				<picture v-else>
					<img :src="user?.i" :alt="user?.name">
				</picture>
			</div>
		</div>

		<div class="comment-body">
			<strong class="username">{{ user.name }}</strong>
			<time :datetime="datetime">{{ $d(item.time, 'middle', $i18n.locale) }}</time>
			<p>{{ item.message }}</p>
		</div>

		<div
			class="comment-right"
			v-if="item.info"
		>
			<div class="vote">
				<Score
					rating="behind"
					:stars="1"
					:value="parseFloat(item.info)"
				/>
			</div>
		</div>
	</article>
</template>

<style lang="sass" src="./index.sass"></style>
<script>
import Score from "@/components/score/index.vue";
import NameToHSL from "@/js/nametohsl.js";

export default {
	name: "Comment",

	components: {
		Score
	},

	props: {
		item: {
			type: Object,
			default: () => ({})
		}
	},

	data() {
		return {
			color: new NameToHSL()
		}
	},

	computed: {
		/**
		 * Get basyon user
		 * 
		 * @returns {Object}
		 */
		user() {
			return this.sdk.accounts[this.item?.address];
		},

		/**
		 * Get comment date
		 * 
		 * @returns {String}
		 */
		datetime() {
			return new Date(this.item?.time).toJSON().substring(0, 10);
		},

		/**
		 * Get first name from account name
		 * 
		 * @returns {String}
		 */
		 shortName() {
			return this.user?.name?.substring(0, 1).toUpperCase() || "?";
		},

		/**
		 * Generate hsl background for user
		 * 
		 * @returns {String}
		 */
		hslColor() {
			return `--color: ${ this.color.generateHSL(this.user?.name || "User") }`
		}
	}
}
</script>