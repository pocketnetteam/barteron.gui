<template>
	<section :class="{
		'row block t-sep': form,
		'feedbacks': true
	}">
		<header v-if="header">
			<h1>{{ $t('feedbackLabels.title') }} - </h1>
			<Score
				:rating="true"
				:stars="5"
				:value="votesAverage"
				:delimeter="','"
				:voteable="voteable"
				@change="vote"
			/>
			<span>{{ $tc('feedbackLabels.votes', votes?.length || 0) }}</span>
		</header>

		<main>
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
					<li>{{ $t('feedbackLabels.empty') }}</li>
				</template>
			</ul>

			<v-form
				ref="form"
				v-if="form && commentable"
			>
				<v-textarea
					ref="feedback"
					class="field"
					name="feedback"
					length="9000"
					:placeholder="$t('feedbackLabels.placeholder')"
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
								:disabled="loading"
								@click="submit"
							>
								<i
									class="fa fa-spinner fa-spin"
									v-if="loading"
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