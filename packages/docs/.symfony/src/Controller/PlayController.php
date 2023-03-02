<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Spatie\Browsershot\Browsershot;
use Symfony\Contracts\Cache\CacheInterface;
use Psr\Cache\CacheItemInterface;

final class PlayController extends AbstractController
{
    /**
     * @Route("/play/", methods={"GET"})
     */
    public function index(Request $request): Response
    {
        $file_path = __DIR__ . '/../../public/play-assets/index.html';
        $content = file_get_contents($file_path);

        $preview_uri = $request->getUriForPath('/play/__preview/');

        if ($qs = $request->getQueryString()) {
            $preview_uri .= '?' . $qs;
        }

        $content = str_replace('OPENGRAPH_URL_PLACEHOLDER', $request->getUri(), $content);
        $content = str_replace('OPENGRAPH_IMAGE_PLACEHOLDER', $preview_uri, $content);

        return new Response($content === FALSE ? 'Not found' : $content);
    }

    /**
     * @Route("/play/__preview", methods={"GET"})
     */
    public function preview(Request $request, CacheInterface $cache): Response
    {
        $original_uri = $request->getUriForPath('/play/');

        if ($qs = $request->getQueryString()) {
            $original_uri .= '?' . $qs;
        }

        $cache_key = md5($original_uri);

        $image = $cache->get($cache_key, function (CacheItemInterface $cache_item) use ($original_uri) {
            $cache_item->expiresAfter(31536000);
            return Browsershot::url($original_uri)
                ->noSandbox()
                ->waitUntilNetworkIdle()
                ->setDelay(5000)
                ->windowSize(1200, 640)
                ->setScreenshotType('jpeg', 80)
                ->screenshot();
        });

        $response = new Response();
        $response->headers->set('Content-Type', 'image/jpeg');
        $response->headers->set('Cache-Control', 'public, immutable, no-transform, s-maxage=31536000, max-age=31536000');
        $response->headers->set('ETag', $cache_key);
        $response->setContent($image);

        return $response;
    }
}
