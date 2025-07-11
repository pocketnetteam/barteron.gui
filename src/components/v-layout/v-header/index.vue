<template>
	<header id="header">
		<div class="bottom">
			<div class="bar">
				
				<!-- regular -->
				<div class="inner">					
					<h1 class="logo">
						<router-link to="/">Barteron</router-link>
					</h1>

					<Location />
					<SearchBar />
					<UserBar />
				</div>

				<!-- compact -->
				<div class="inner-compact">
					<div class="first-row">
						<h1 class="logo">
							<router-link to="/">Barteron</router-link>
						</h1>
						<UserBar />
					</div>
					<div class="second-row">
						<Location />
						<SearchBar />
					</div>
				</div>

				<!-- small -->
				<div class="inner-small">
					<div class="first-row">
						<h1 class="logo">
							<router-link to="/">Barteron</router-link>
						</h1>
					</div>
					<div class="second-row">
						<SmallMenuBar />
					</div>
				</div>

			</div>
		</div>
	</header>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>