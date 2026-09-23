import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isPlatformAdmin } from '@/lib/platformAdmin';

type CookieToSet = {
  name: string;
  value: string;
  options?: any;
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const protectedPath =
    pathname.startsWith('/operacao') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/master') ||
    pathname === '/alterar-senha';

  if (protectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role,active,must_change_password,organization_id')
      .eq('id', user.id)
      .maybeSingle();

    const { data: platformMembership } = await supabase
      .from('platform_users')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('active', true)
      .maybeSingle();
    const platformAdmin = isPlatformAdmin(user.id) || Boolean(platformMembership);

    if (pathname.startsWith('/master') && !platformAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = profile?.role === 'operator' ? '/operacao' : '/admin';
      return NextResponse.redirect(url);
    }

    if (profile?.must_change_password && pathname !== '/alterar-senha') {
      const url = request.nextUrl.clone();
      url.pathname = '/alterar-senha';
      return NextResponse.redirect(url);
    }

    if (protectedPath && (!profile || !profile.active)) {
      if ((pathname === '/admin/estacionamentos' || pathname.startsWith('/master')) && platformAdmin)
        return response;
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    if (profile && !platformAdmin && pathname !== '/alterar-senha') {
      const { data: license } = await supabase
        .from('organization_licenses')
        .select('status,expires_at')
        .eq('organization_id', profile.organization_id)
        .maybeSingle();
      const expired = !license?.expires_at || new Date(license.expires_at).getTime() <= Date.now();
      if (!license || license.status !== 'active' || expired) {
        const url = request.nextUrl.clone();
        url.pathname = '/licenca-bloqueada';
        return NextResponse.redirect(url);
      }
    }

    if (pathname.startsWith('/admin')) {
      const platformOnly = pathname.startsWith('/admin/estacionamentos');
      if (platformOnly && !isPlatformAdmin(user.id)) {
        const url = request.nextUrl.clone();
        url.pathname = profile?.role === 'operator' ? '/operacao' : '/admin';
        return NextResponse.redirect(url);
      }
      if (!platformOnly && profile?.role === 'operator') {
        const url = request.nextUrl.clone();
        url.pathname = '/operacao';
        return NextResponse.redirect(url);
      }
      if (!platformOnly && !profile && isPlatformAdmin(user.id)) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/estacionamentos';
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/operacao/:path*', '/admin/:path*', '/master/:path*', '/alterar-senha'],
};
