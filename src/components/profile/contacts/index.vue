<template>
	<v-form
		class="contacts"
		ref="form"
		:rules="{
			'input[name^=\'email\']': { empty: true, regex: '^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', prop: 'value' },
			'input[name^=\'telegram\']': { empty: true, regex: '.*\B@(?=\w{5,64}\b)[a-zA-Z0-9]+(?:_[a-zA-Z0-9]+)*.*', prop: 'value' },
			'input[name^=\'phone\'],input[name^=\'viber\'],input[name^=\'whatsapp\']': { empty: true, regex: '^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$', prop: 'value' },
		}"
	>
		<ul
			:class="{
				fields: true,
				scroll: hasScrollbar
			}"
			ref="list"
		>
			<li
				v-for="(contact, i) in contacts"
				:key="i"
			>
				<i :class="`icon ${ contact?.icon || getIcon(contact?.type) }`"></i>
				<v-input
					class="field"
					ref="field"
					:name="`${ contact?.type }[${ i }]`"
					:value="contact?.value"
					:vEvents="{
						input: e => fill(e, i),
						change: e => fill(e, i)
					}"
				/>
				<a
					class="remove"
					v-if="editable"
					@click.prevent="remove(i)"
				><i class="fa fa-times"></i></a>
			</li>
		</ul>
		
		<v-button
			v-if="editable"
			vType="bulma-stroke"
			vSize="md"
			@selected="add"
		>
			{{ $t('contacts.add') }}
			<template #dropdown>
				<ul>
					<li
						v-for="(icon, type) in types"
						:key="type"
						:class="{ 'disabled': isFilled(type) }"
						@click.prevent="add(type)"
					>
						<i :class="`icon ${ icon }`"></i>
						{{ $t(`contacts.${ type }`) }}
					</li>
				</ul>
			</template>
		</v-button>

		<v-button
			vType="bulma-stroke"
			vSize="md"
			@click="submit"
		>
		{{ $t('buttonLabels.save') }}
		</v-button>
	</v-form>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>