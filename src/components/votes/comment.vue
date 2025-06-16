<template>
	<article class="comment">
		<div class="comment-left">
			<router-link :to="user.address ? { name: 'profile', params: { id: user.address } } : {} ">
				<div class="avatar">
					<i
						v-if="!avatar?.startsWith('http')"
						:style="hslColor"
					>{{ shortName }}</i>
					
					<picture v-else>
						<img :src="avatar" :alt="user?.name">
					</picture>
				</div>
			</router-link>
		</div>

		<div class="comment-body">
			<div class="username-container">
				<strong class="username">
					<router-link 
						:to="user.address ? { name: 'profile', params: { id: user.address } } : {}"
					>{{ user.name }}</router-link>
				</strong>
				<i 
					v-if="item.relay" 
					class="comment-relay fa fa-spinner fa-spin"
					:title="$t('voteLabels.commentIsPublishing')"
				></i>
			</div>
			<time :datetime="datetime">{{ $d(item.time, 'middle', $i18n.locale) }}</time>
			<p>{{ item.message }}</p>
		</div>

		<div
			class="comment-right"
			v-if="score"
		>
			<div class="vote">
				<Score
					:rating="'behind'"
					:stars="1"
					:value="score"
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

		/* Get user's avatar */
		avatar() {
			const url = this.user?.i;
			return this.sdk.manageBastyonImageSrc(url);
		},

		/**
		 * Generate hsl background for user
		 * 
		 * @returns {String}
		 */
		hslColor() {
			return `--color: ${ this.color.generateHSL(this.user?.name || "User") }`
		},

		/**
		 * Get score
		 * 
		 * @returns {Number}
		 */
		score() {
			return parseFloat(this.item?.info);
		}
	}
}
</script>