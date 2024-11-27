<template>
	<section :class="{
		'row block t-sep': form,
		'votes': true
	}">

		<header v-if="offerInfo">
			<h1 class="title">
				<router-link :to="{ name: 'barterItem', params: { id: this.item.hash } }">
					{{ item.caption }}
				</router-link>
			</h1>
		</header>

		<header v-if="detailsAreLoading">
			<h1>{{ $t('voteLabels.label') }}</h1>
			<loader type="circular" />
		</header>

		<header v-if="header && !detailsAreLoading">
			<h1 v-if="!compact">{{ $t('voteLabels.title') }} - </h1>
			<Score
				:rating="true"
				:stars="5"
				:value="offerScoresAverage()"
				:starsValue="hasRelayOfferScore() ? score : null"
				:delimeter="','"
				:relayMode="true"
				:voteable="voteable()"
				@change="vote"
			/>
			<i 
				v-if="hasRelayOfferScore()" 
				class="vote-relay fa fa-spinner fa-spin"
				:title="$t('voteLabels.voteIsPublishing')"
			></i>
			<span>{{ $tc('voteLabels.votes', offerScoresCount()) }}</span>
			<div v-if="hasRejectedOfferScore()" class="vote-rejected">{{ $t('voteLabels.voteNotPublished') }}</div>
			<div v-if="hasRejectedComment()" class="comment-rejected">{{ $t('voteLabels.commentNotPublished') }}</div>
		</header>

		<main v-if="!detailsAreLoading">
			<ul class="comments">
				<template v-if="comments.length">
					<li
						v-for="(comment, i) in comments"
						:key="i"
					>
						<Comment :item="comment" />
					</li>
				</template>

				<template v-else>
					<li>{{ $t('voteLabels.empty') }}</li>
				</template>
			</ul>

			<v-form
				ref="form"
				v-if="commentable()"
			>
				<v-textarea
					ref="vote"
					class="field"
					name="vote"
					length="9000"
					:placeholder="$t('voteLabels.placeholder')"
				>
					<template #after>
						<Score
							:rating="'behind'"
							:stars="1"
							:value="score"
							v-if="score"
						/>
						<div class="buttons">
							<v-button
								vType="transparent"
								vSize="sm"
								class="submit"
								:disabled="isLoading"
								@click="submit"
							>
								<i
									class="fa fa-spinner fa-spin"
									v-if="isLoading"
								></i>
								<i
									class="fa fa-paper-plane"
									v-else
								></i>
							</v-button>
						</div>
					</template>
				</v-textarea>
			</v-form>
		</main>
	</section>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>