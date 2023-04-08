<template>
	<div id="footer">
		<div class="footer-holder">
			<div class="links">
				<nav>
					<strong class="title">Empresa</strong>
					<ul>
						<li><a href="#">About</a></li>
						<li><a href="#">Contacts</a></li>
						<li><a href="#">Vacancy</a></li>
					</ul>
				</nav>

				<nav>
					<strong class="title">Help</strong>
					<ul>
						<li><a href="#">How's exchange going</a></li>
						<li><a href="#">Coins</a></li>
						<li><a href="#">Delivery</a></li>
						<li><a href="#">Safety</a></li>
						<li><a href="#">F.A.Q</a></li>
					</ul>
				</nav>

				<nav>
					<strong class="title">Stuff</strong>
					<ul>
						<li><a href="#">Privacy policy</a></li>
						<li><a href="#">Terms and conditions</a></li>
						<li><a href="#">Site map</a></li>
					</ul>
				</nav>

				<nav>
					<strong class="title">Something</strong>
					<ul>
						<li><a href="#">Item #1</a></li>
						<li><a href="#">Item #2</a></li>
						<li><a href="#">Item #3</a></li>
					</ul>
				</nav>
			</div>

			<div class="bottom">
				<strong class="logo"><router-link to="/">Barteron</router-link></strong>
				<p class="copyright">&copy; 2023 Barteron. All rights reserved.</p>

				<nav>
					<ul>
						<li>
							<a href="#" class="twitter">
								<svg><use href="@/assets/images/social.svg#twitter" /></svg>
							</a>
						</li>
						<li>
							<a href="#" class="linkedin">
								<svg><use href="@/assets/images/social.svg#linkedin" /></svg>
							</a>
						</li>
						<li>
							<a href="#" class="facebook">
								<svg><use href="@/assets/images/social.svg#facebook" /></svg>
							</a>
						</li>
					</ul>

					<a href="#" class="scroll-top">
						<i class="fa fa-angle-up"></i>
					</a>
				</nav>
			</div>
		</div>
	</div>
</template>

<style lang="sass" src="./index.sass"></style>
<script src="./index.js"></script>