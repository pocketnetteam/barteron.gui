<?php

/**
 * Link previews for barteron.club: OG tags for an offer, an exchange
 * proposal, a safe deal, a rating moderation request and a profile.
 *
 * Bastyon builds the preview of an app link (bastyon.com/application?id=…&p=…)
 * from these tags: its server opens https://barteron.club/<path> and reads
 * them. index.php (made by build/index-php.ts) prints them into <head>.
 *
 * Ported from the old app (barteron.gui/public/og.php): the same link formats
 * and texts. What changed:
 * - values are escaped: an offer title with a quote no longer breaks out of
 *   the attribute and puts its own markup into the page;
 * - texts from the network are shown as they are, like the app shows them
 *   (the old file ran them through urldecode, so "C++" became "C  ");
 * - errors are logged, not printed into the page;
 * - ids that cannot be an offer or an address are not sent to the node;
 * - a picture only from an http(s) address; the three names of a deal in one call;
 * - /barter/exchange/<id> gets the preview of its offer;
 * - Russian defaults for a deal or a request the node does not know.
 *
 * Works on PHP 7.0 and newer.
 */

require_once __DIR__ . '/rpc.php';

class OG
{
    /** @var RPC */
    private $rpc;
    private $project;
    private $scope;
    private $defaults;
    private $current = array();

    public function __construct($proxypath)
    {
        $this->rpc = new RPC($proxypath);

        $manifest = json_decode((string) @file_get_contents(__DIR__ . '/b_manifest.json'), true);
        if (!is_array($manifest)) {
            $manifest = array();
        }
        $this->project = self::str($manifest, 'name') ?: 'Barteron';
        $this->scope = self::str($manifest, 'scope') ?: 'barteron.club';

        $this->defaults = array(
            'title' => $this->project,
            'site_name' => $this->project,
            'type' => 'website',
            'image' => $this->asset(self::str($manifest, 'icon') ?: 'b_icon.png'),
            'description' => self::str($manifest, 'description'),
        );
    }

    /** Tags for this request; the defaults if anything goes wrong. */
    public static function forRequest($proxypath, array $server)
    {
        $og = new OG($proxypath);
        try {
            $og->check(
                isset($server['REQUEST_URI']) ? $server['REQUEST_URI'] : '/',
                isset($server['HTTP_ACCEPT_LANGUAGE']) ? $server['HTTP_ACCEPT_LANGUAGE'] : ''
            );
        } catch (Throwable $e) {
            error_log('Barteron link preview: ' . $e->getMessage());
            $og->current = array();
        }
        return $og->tags();
    }

    public function check($uri, $acceptLanguage)
    {
        $parts = explode('?', (string) $uri, 2);
        $segments = explode('/', trim($parts[0], '/'));
        $query = array();
        if (isset($parts[1])) {
            parse_str($parts[1], $query);
        }

        $lang = self::lang(self::param($query, 'lang'), $acceptLanguage);
        $page = $segments[0];
        $id = isset($segments[1]) ? $segments[1] : '';

        if ($page === 'barter' && in_array($id, array('search', 'safedeal', 'moderation'), true)) {
            $page = $id;
        } elseif ($page === 'barter' && $id === 'exchange') {
            $id = isset($segments[2]) ? $segments[2] : '';
        }

        switch ($page) {
            case 'barter':
                $this->offerPage($id);
                break;
            case 'search':
                $this->exchangePage($query, $lang);
                break;
            case 'safedeal':
                $this->dealPage($query, $lang);
                break;
            case 'moderation':
                $this->moderationPage($query, $lang);
                break;
            case 'profile':
                $this->profilePage($id, $lang);
                break;
        }
    }

    /** `<meta property="og:…">` lines. */
    public function tags()
    {
        $lines = array();
        foreach (array_merge($this->defaults, $this->current) as $key => $value) {
            $lines[] = '<meta property="og:' . $key . '" content="' . self::html($value) . '">';
        }
        return implode("\n    ", $lines) . "\n";
    }

    private function offerPage($id)
    {
        $offer = $this->offer($id);
        if (!$offer) {
            return;
        }
        $this->set('title', self::caption($offer));
        $this->set('description', self::detail($offer, 's3'));
        $this->set('image', self::firstImage($offer));
    }

    /** /barter/search?source=…&target=…: an exchange of two offers, or what fits one. */
    private function exchangePage(array $query, $lang)
    {
        $sourceId = self::offerId(self::param($query, 'source'));
        $targetId = self::offerId(self::param($query, 'target'));
        $offers = $this->rpc->offers(array($sourceId, $targetId));
        $source = $sourceId && isset($offers[$sourceId]) ? $offers[$sourceId] : null;
        $target = $targetId && isset($offers[$targetId]) ? $offers[$targetId] : null;
        if (!$source) {
            return;
        }

        $sourceTitle = self::caption($source);
        $targetTitle = $target ? self::caption($target) : '';
        $this->set('image', self::firstImage($source));

        if ($targetTitle !== '') {
            $this->set('title', $lang === 'ru' ? 'Предложение обмена' : 'Exchange proposal');
            $this->set('description', $lang === 'ru'
                ? "Предлагаю обмен \"{$sourceTitle}\" на \"{$targetTitle}\""
                : "I propose to exchange \"{$sourceTitle}\" for \"{$targetTitle}\"");
        } elseif ($sourceTitle !== '') {
            $this->set('title', $lang === 'ru' ? 'Предложения обмена' : 'Exchange proposals');
            $this->set('description', $lang === 'ru'
                ? "Список предложений для \"{$sourceTitle}\""
                : "Exchange proposals for \"{$sourceTitle}\"");
        }
    }

    /** /barter/safedeal?id=…&offer=…&buyer=…&validator=…&fee=… */
    private function dealPage(array $query, $lang)
    {
        $this->set('title', $lang === 'ru' ? 'Безопасная сделка' : 'Safe deal');
        $this->set('description', $lang === 'ru'
            ? 'Откройте сделку, чтобы проверить её статус'
            : 'Open the deal to check the current status');
        $this->set('image', $this->asset('s_icon.png'));

        $offer = $this->offer(self::param($query, 'offer'));
        if (!$offer) {
            return;
        }
        $sellerAddress = isset($offer->s1) && is_string($offer->s1) ? $offer->s1 : '';
        $buyerAddress = self::param($query, 'buyer');
        $guarantorAddress = self::param($query, 'validator');
        // The three names in one call: the page waits for it.
        $profiles = $this->rpc->profiles(array_filter(
            array($sellerAddress, $buyerAddress, $guarantorAddress),
            function ($address) {
                return self::address($address);
            }
        ));
        $seller = self::nameIn($profiles, $sellerAddress);
        if ($seller === null) {
            return;
        }
        $buyer = (string) self::nameIn($profiles, $buyerAddress);
        $guarantor = (string) self::nameIn($profiles, $guarantorAddress);
        $fee = self::param($query, 'fee') !== '' ? self::param($query, 'fee') : '?';
        $subject = self::caption($offer);

        $this->set('description', $lang === 'ru'
            ? "Гарант: {$guarantor}, процент: {$fee}%; Продавец: {$seller}; Покупатель: {$buyer}; Предмет сделки: {$subject}"
            : "Guarantor: {$guarantor}, fee: {$fee}%; Seller: {$seller}; Buyer: {$buyer}; Subject of the deal: {$subject}");
    }

    /** /barter/moderation?offer=…&user=…&score=…&reason=… */
    private function moderationPage(array $query, $lang)
    {
        $this->set('title', $lang === 'ru' ? 'Заявка на модерацию оценки' : 'Rating Moderation Request');
        $this->set('description', $lang === 'ru' ? 'Только для модераторов' : 'For moderators only');
        $this->set('image', $this->asset('m_icon.png'));

        $offer = $this->offer(self::param($query, 'offer'));
        if (!$offer) {
            return;
        }
        $user = (string) $this->name(self::param($query, 'user'));
        $score = self::param($query, 'score') !== '' ? self::param($query, 'score') : '?';
        $subject = self::caption($offer);

        $this->set('description', $lang === 'ru'
            ? "Объявление: {$subject}; Пользователь: {$user}; Оценка: {$score}"
            : "Offer: {$subject}; User: {$user}; Rating: {$score}");
    }

    private function profilePage($address, $lang)
    {
        $profile = self::address($address) ? $this->rpc->profile($address) : null;
        if (!$profile) {
            return;
        }
        $name = self::text($profile, 'name');
        if ($name === '') {
            return;
        }
        $this->set('title', $name);
        $this->set('description', $lang === 'ru'
            ? "Профиль {$name} на {$this->project}"
            : "{$name}'s profile on {$this->project}");
        $this->set('image', self::url(self::text($profile, 'i')));
    }

    private function offer($id)
    {
        $id = self::offerId($id);
        return $id ? $this->rpc->offer($id) : null;
    }

    /** Profile name by address: '' when the profile has no name, null when there is no profile. */
    private function name($address)
    {
        if (!self::address($address)) {
            return null;
        }
        return self::nameIn($this->rpc->profiles(array($address)), $address);
    }

    private static function nameIn(array $profiles, $address)
    {
        return self::address($address) && isset($profiles[$address])
            ? self::text($profiles[$address], 'name')
            : null;
    }

    private function set($key, $value)
    {
        if (is_string($value) && $value !== '') {
            $this->current[$key] = $value;
        }
    }

    private function asset($file)
    {
        return "https://{$this->scope}/{$file}";
    }

    /** Language of the texts: ?lang= of the link, then the browser's, then English. */
    private static function lang($param, $acceptLanguage)
    {
        if ($param !== '') {
            return strtolower(substr($param, 0, 2)) === 'ru' ? 'ru' : 'en';
        }
        $best = 'en';
        $bestQ = -1.0;
        preg_match_all('/([a-z]{1,8})(?:-[a-z0-9]{1,8})*\s*(?:;\s*q=([0-9.]+))?/i', (string) $acceptLanguage, $matches, PREG_SET_ORDER);
        foreach ($matches as $m) {
            $code = strtolower($m[1]);
            $q = isset($m[2]) && $m[2] !== '' ? (float) $m[2] : 1.0;
            if (($code === 'ru' || $code === 'en') && $q > $bestQ) {
                $best = $code;
                $bestQ = $q;
            }
        }
        return $best;
    }

    /** A query value as a string; '' for a missing value or an array. */
    private static function param(array $query, $key)
    {
        return isset($query[$key]) && is_string($query[$key]) ? trim($query[$key]) : '';
    }

    /** Offer ids are txids: 64 hex digits. */
    private static function offerId($value)
    {
        return is_string($value) && preg_match('/^[0-9a-f]{64}$/i', $value) ? $value : '';
    }

    /** Base58, like Pocketnet addresses. */
    private static function address($value)
    {
        return is_string($value) && preg_match('/^[1-9A-HJ-NP-Za-km-z]{25,40}$/', $value);
    }

    /** A field of the offer's payload: `p.s2` caption, `p.s3` description, `p.s5` photos. */
    private static function detail($offer, $key)
    {
        return isset($offer->p) && is_object($offer->p) ? self::text($offer->p, $key) : '';
    }

    private static function caption($offer)
    {
        return self::detail($offer, 's2');
    }

    private static function firstImage($offer)
    {
        $images = json_decode(self::detail($offer, 's5'), true);
        return is_array($images) && isset($images[0]) && is_string($images[0]) ? self::url($images[0]) : '';
    }

    /**
     * A picture address from the network, only http(s): Bastyon's server
     * fetches it for the preview. Anything else — the default picture.
     */
    private static function url($value)
    {
        $value = trim((string) $value);
        return preg_match('~^https?://[^\s/?#]+~i', $value) ? $value : '';
    }

    private static function text($object, $key)
    {
        if (is_object($object) && isset($object->$key) && is_scalar($object->$key)) {
            return trim((string) $object->$key);
        }
        return '';
    }

    private static function str(array $array, $key)
    {
        return isset($array[$key]) && is_string($array[$key]) ? $array[$key] : '';
    }

    private static function html($value)
    {
        return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}
