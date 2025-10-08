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

		<header v-if="header">
			<h1 v-if="!compact">{{ $t('voteLabels.offer_rating') }} - </h1>
			<Score
				ref="offerScore"
				:rating="true"
				:stars="5"
				:value="completedOfferScoresAverage()"
				:starsValue="starsValue()"
				:delimeter="','"
				:relayMode="true"
				:voteable="voteable()"
				:rejected="hasRejectedOfferScore()"
				@change="vote"
			/>
			<span>{{ $tc('voteLabels.votes', offerScoresCount()) }}</span>
			<div v-if="hasRejectedOfferScore()" class="vote-rejected">{{ $t('voteLabels.voteNotPublished') }}</div>
			<div v-if="hasRejectedComment()" class="comment-rejected">{{ $t('voteLabels.reviewNotPublished') }}</div>
		</header>

		<main>
			<ul class="comments">
				<template v-if="validComments().length">
					<li
						v-for="(comment, i) in validComments()"
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
					:readonly="isCommentLoading"
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
								:disabled="isCommentLoading"
								@click="submitComment"
							>
								<i
									class="fa fa-spinner fa-spin"
									v-if="isCommentLoading"
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