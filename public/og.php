<?php
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

require_once('rpc.php');
require_once('api.php');

class OG {
	private $rpc = NULL;
	private $api = NULL;

	private $domain = NULL;
	private $project = NULL;

	private $defaultOg = NULL;

	public $currentOg = array();
	public $manifest = array();

	public function __construct($get, $proxypath, $domain = NULL, $project = NULL) {
		$this->rpc = new RPC($proxypath);
		$this->api = new API($proxypath);

		$this->manifest = json_decode(file_get_contents('b_manifest.json'), true);
		$this->project = $project ?? $this->manifest['name'];
		$this->domain = $domain ?? $this->manifest['id'];

		$this->defaultOg = array(
			'title' => $this->project,
			'site_name' => $this->project, 
			'type' => 'website',
			'image' => "https://{$this->manifest['scope']}/{$this->manifest['icon']}",
			'description' => $this->manifest['description'],
		);
	}

	public function __destruct() {

	}

	public function check() {
		/* if (!$this->is_bot()) return; */

		$uri = trim($_SERVER['REQUEST_URI'], '/');

		if (isset($uri)) {
			@list($page, $id) = explode('/', $uri);

			if ($id && substr($id, 0, strlen('search')) == 'search') {
				@list($page, $id) = explode('?', $id);
				parse_str($id, $id);
			}

			switch(@$page) {
				case 'barter': {
					$title = false;
					$description = false;
					$images = false;
					$result = $this->rpc->brtoffersbyhashes(array($this->clean($id)));

					if ($result != false){
						$offer = $result[0];

						$title = urldecode($offer->p->s2);
						$description = urldecode($offer->p->s3);
						$images = json_decode($offer->p->s5);

						if($title) $this->currentOg['title'] = $title;
						if($description) $this->currentOg['description'] = $description;
						if($images) $this->currentOg['image'] = urldecode($images[0]);
					}

					break;
				}

				case 'search': {
					$title = false;
					$description = false;
					$images = false;
					$offers = $this->rpc->brtoffersbyhashes(array_filter([
						@$id['source'] ? $id['source'] : null,
						@$id['target'] ? $id['target'] : null
					]));

					if ($offers != false){
						$source = @$offers[0];
						$target = @$offers[1];

						if (@$source) {
							$srcTitle = urldecode($source->p->s2);
							$srcImage = json_decode($source->p->s5);
						}

						if (@$target) {
							$trgTitle = urldecode($target->p->s2);
						}

						if (@$srcTitle && @$trgTitle) {
							$this->currentOg['title'] = "Exchange {$srcTitle} to {$trgTitle}";
							$this->currentOg['description'] = "I proposing exchange {$srcTitle} to {$trgTitle}";
						} else if (@$srcTitle) {
							$this->currentOg['title'] = "Exchange proposals of {$srcTitle}";
							$this->currentOg['description'] = "Exchange list of {$srcTitle}";
						}

						if (@$srcImage) $this->currentOg['image'] = urldecode($srcImage[0]);
					}

					break;
				}

				case 'profile': {
					$title = false;
					$description = false;
					$image = false;
					$result = $this->rpc->getuserprofile($this->clean($id));

					if ($result != false){
						$profile = $result[0];

						$title = urldecode($profile->name);
						$description = urldecode("$title's profile on {$this->project}");
						$image = urldecode($profile->i);
						
						if($title) $this->currentOg['title'] = $title;
						if($description) $this->currentOg['description'] = $description;
						if($image) $this->currentOg['image'] = $image;
					}
				}
			}
		}
	}

	public function is_bot() {

		if (isset($_SERVER['HTTP_USER_AGENT'])){
			if(preg_match('/mozila|gekko|safari|chrome|khtml|webkit|bastyon/i', $_SERVER['HTTP_USER_AGENT'])){
				if(preg_match('/vkshare|whatsapp|viber|instagram|bastyon/i', $_SERVER['HTTP_USER_AGENT'])){
					return true;
				}

				return false;
			}

			return true;
		}
		
		return true;

	}

	public function clean($value) {
		$value = trim($value);
		$value = stripslashes($value);
		$value = strip_tags($value);
		$value = htmlspecialchars($value);
		
		return $value;
	}

	public function echotags() {
		$tags = array_merge($this->defaultOg, $this->currentOg);

		echo join(
			"\n\t",
			array_map(function($key, $value) {
				$prefix = 'og:';
	
				if(strpos($key, 'twitter') !== false) $prefix = '';
	
				return "<meta property=\"$prefix$key\" content=\"$value\">";
			}, array_keys($tags), array_values($tags))
		) . "\n";
	}
}