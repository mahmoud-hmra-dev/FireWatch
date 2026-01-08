<?php

namespace App\Http\Middleware;

use Closure;
use App\Http\Resources\MessageResource;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ($roles && ! in_array($user->role, $roles, true))) {
            return (new MessageResource(['message' => 'Forbidden']))
                ->response()
                ->setStatusCode(403);
        }

        return $next($request);
    }
}
