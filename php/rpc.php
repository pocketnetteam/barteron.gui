<?php

/**
 * Node RPC through the Pocketnet proxy, for link previews (og.php).
 *
 * Ported from the old app (barteron.gui/public/rpc.php): same endpoint
 * (`<proxy>/rpc/<method>`) and payload. What changed:
 * - one time budget for the whole page, not per call: index.php waits for
 *   these calls before it sends the page (also inside Bastyon, every time
 *   the app opens), so a slow node must not keep the app from opening;
 * - after the first failure the remaining calls of the request are skipped;
 * - an error from the node is "nothing found", not data.
 *
 * Works on PHP 7.0 and newer.
 */
class RPC
{
    /** All calls of one page together, milliseconds. */
    const BUDGET_MS = 3000;
    const CONNECT_MS = 2000;

    private $node;
    private $failed = false;
    private $deadline;

    public function __construct($node, $budgetMs = self::BUDGET_MS)
    {
        $this->node = rtrim($node, '/') . '/';
        $this->deadline = microtime(true) + $budgetMs / 1000;
    }

    /** `data` of the answer, or null. */
    public function send($method, array $params)
    {
        $left = (int) floor(($this->deadline - microtime(true)) * 1000);
        if ($this->failed || $left <= 0 || !function_exists('curl_init')) {
            return null;
        }

        $payload = array('method' => $method);
        if (!empty($params)) {
            $payload['parameters'] = $params;
        }

        $ch = curl_init($this->node . 'rpc/' . $method);
        curl_setopt_array($ch, array(
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => array('Content-Type: application/json', 'x-no-compression: 1'),
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            // Timeouts under a second need it with the default resolver.
            CURLOPT_NOSIGNAL => true,
            CURLOPT_CONNECTTIMEOUT_MS => min(self::CONNECT_MS, $left),
            CURLOPT_TIMEOUT_MS => $left,
        ));
        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if (!is_string($body) || $status >= 500 || $status === 0) {
            $this->failed = true;
            return null;
        }

        $json = json_decode($body);
        if (is_object($json) && !empty($json->result) && isset($json->data)) {
            return $json->data;
        }
        return null;
    }

    /** Offers by their ids (txid of the first version), in the order asked. */
    public function offers(array $hashes)
    {
        $hashes = array_values(array_unique(array_filter($hashes)));
        if (empty($hashes)) {
            return array();
        }

        $data = $this->send('getbarteronoffersbyroottxhashes', array($hashes));
        $found = array();
        foreach (is_array($data) ? $data : array() as $offer) {
            if (is_object($offer) && isset($offer->s2) && is_string($offer->s2)) {
                $found[$offer->s2] = $offer;
            }
        }

        $ordered = array();
        foreach ($hashes as $hash) {
            if (isset($found[$hash])) {
                $ordered[$hash] = $found[$hash];
            }
        }
        return $ordered;
    }

    public function offer($hash)
    {
        $offers = $this->offers(array($hash));
        return isset($offers[$hash]) ? $offers[$hash] : null;
    }

    /** Bastyon profiles by address, in one call. */
    public function profiles(array $addresses)
    {
        $addresses = array_values(array_unique(array_filter($addresses)));
        if (empty($addresses)) {
            return array();
        }

        $data = $this->send('getuserprofile', array($addresses));
        $found = array();
        foreach (is_array($data) ? $data : array() as $profile) {
            if (is_object($profile) && isset($profile->address) && is_string($profile->address)) {
                $found[$profile->address] = $profile;
            }
        }
        return $found;
    }

    public function profile($address)
    {
        $profiles = $this->profiles(array($address));
        return isset($profiles[$address]) ? $profiles[$address] : null;
    }
}
