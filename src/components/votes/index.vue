<template>
	<section :class="{
		'row block t-sep': form,
		'feedbacks': true
	}">
		<header v-if="header">
			<h1>{{ $t('feedbacks.title') }} - </h1>
			<Score
				:rating="true"
				:stars="1"
				:value="3.5"
			/>
			<span>{{ $t('feedbacks.votes', { count: 207 }) }}</span>
		</header>

		<main>
			<v-form v-if="form">
				<v-textarea
					ref="feedback"
					class="field"
					name="feedback"
					length="9000"
					:placeholder="$t('feedbacks.placeholder')"
				>
					<template #after>
						<div class="buttons">
							<v-button
								vType="transparent"
								vSize="sm"
								class="submit"
							>
								<i class="fa fa-paper-plane"></i>
							</v-button>
						</div>
					</template>
				</v-textarea>
			</v-form>

			<ul class="votes">
				<template v-if="items.length">
					<li>
						
					</li>
				</template>

				<template v-else>
					<li>{{ $t('feedbacks.empty') }}</li>
				</template>
			</ul>
		</main>
	</section>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>