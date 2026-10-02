import { Request, Response, NextFunction } from 'express';

export interface CleanSteamItem {
  appId: number;
  title: string;
  price: number | null;
  currency: string;
  url: string;
  imageUrl: string;
}

// Mock games dataset for demo/test purposes or fallback
const MOCK_STEAM_WISHLIST: CleanSteamItem[] = [
  {
    appId: 1086940,
    title: "Baldur's Gate 3",
    price: 59.99,
    currency: "EUR",
    url: "https://store.steampowered.com/app/1086940",
    imageUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1086940/header.jpg",
  },
  {
    appId: 1091500,
    title: "Cyberpunk 2077",
    price: 29.99,
    currency: "EUR",
    url: "https://store.steampowered.com/app/1091500",
    imageUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg",
  },
  {
    appId: 1245620,
    title: "ELDEN RING",
    price: 59.99,
    currency: "EUR",
    url: "https://store.steampowered.com/app/1245620",
    imageUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg",
  },
  {
    appId: 367520,
    title: "Hollow Knight",
    price: 14.79,
    currency: "EUR",
    url: "https://store.steampowered.com/app/367520",
    imageUrl: "https://cdn.akamai.steamstatic.com/steam/apps/367520/header.jpg",
  },
  {
    appId: 1145360,
    title: "Hades II",
    price: 28.99,
    currency: "EUR",
    url: "https://store.steampowered.com/app/1145360",
    imageUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1145360/header.jpg",
  },
  {
    appId: 620,
    title: "Portal 2",
    price: 9.75,
    currency: "EUR",
    url: "https://store.steampowered.com/app/620",
    imageUrl: "https://cdn.akamai.steamstatic.com/steam/apps/620/header.jpg",
  },
  {
    appId: 1817070,
    title: "Marvel's Spider-Man Remastered",
    price: 59.99,
    currency: "EUR",
    url: "https://store.steampowered.com/app/1817070",
    imageUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1817070/header.jpg",
  },
  {
    appId: 413150,
    title: "Stardew Valley",
    price: 13.99,
    currency: "EUR",
    url: "https://store.steampowered.com/app/413150",
    imageUrl: "https://cdn.akamai.steamstatic.com/steam/apps/413150/header.jpg",
  },
];

/**
 * Decodifica entidades HTML básicas (ej. No Man&#x27;s Sky -> No Man's Sky)
 */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#([0-9]{1,7});/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
}

/**
 * Normaliza cualquier entrada de Steam (URL completa, vanity o SteamID64)
 * a su identificador principal y tipo.
 */
function normalizeSteamInput(input: string): { identifier: string; isSteamId64: boolean } {
  let cleaned = input.trim().replace(/\/+$/, '');

  // 1. URL de perfiles numéricos: https://steamcommunity.com/profiles/76561198...
  const profileMatch = cleaned.match(/\/profiles\/(\d{16,18})/);
  if (profileMatch) {
    return { identifier: profileMatch[1], isSteamId64: true };
  }

  // 2. Si ya es una secuencia de 16 a 18 dígitos
  if (/^\d{16,18}$/.test(cleaned)) {
    return { identifier: cleaned, isSteamId64: true };
  }

  // 3. URLs de vanity: https://steamcommunity.com/id/usuario o https://store.steampowered.com/wishlist/id/usuario
  const idMatch = cleaned.match(/\/(?:id|wishlist\/id)\/([a-zA-Z0-9_\-]+)/);
  if (idMatch) {
    return { identifier: idMatch[1], isSteamId64: false };
  }

  // 4. Si contiene barras, tomar el último segmento no vacío
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];
    return {
      identifier: lastPart,
      isSteamId64: /^\d{16,18}$/.test(lastPart),
    };
  }

  // 5. Nombre directo
  return { identifier: cleaned, isSteamId64: /^\d{16,18}$/.test(cleaned) };
}

/**
 * Resuelve un vanity name a SteamID64 mediante el endpoint XML público de Steam.
 */
async function resolveVanityToSteamId64(vanity: string): Promise<string | null> {
  try {
    const xmlUrl = `https://steamcommunity.com/id/${encodeURIComponent(vanity)}/?xml=1`;
    const response = await fetch(xmlUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) return null;

    const xmlText = await response.text();
    const id64Match = xmlText.match(/<steamID64>(\d+)<\/steamID64>/);
    return id64Match ? id64Match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Extrae los items de la lista de deseados analizando el HTML renderizado por Steam
 */
function parseWishlistHtml(html: string): CleanSteamItem[] {
  // Comprobar privacidad o error
  if (
    html.includes('This profile is private') ||
    html.includes('El perfil es privado') ||
    html.includes('<title>Wishlist - Error</title>')
  ) {
    throw new Error(
      'La lista de deseados de Steam es privada. Asegúrate de configurar los "Detalles de los juegos" como "Público" en la privacidad de tu perfil de Steam.'
    );
  }

  // Dividir por cada fila de juego en la lista SSR de Steam (<div data-index="N" ...)
  const chunks = html.split(/<div data-index="\d+"/);
  if (chunks.length <= 1) {
    return [];
  }

  const items: CleanSteamItem[] = [];

  for (let i = 1; i < chunks.length; i++) {
    // Tomamos los primeros 3000 caracteres de cada tarjeta para evitar el pie de página
    const cardChunk = chunks[i].slice(0, 3000);

    const appMatch = cardChunk.match(/store\.steampowered\.com\/app\/(\d+)/);
    if (!appMatch) continue;
    const appId = parseInt(appMatch[1], 10);

    // Extraer título
    const titleMatch = cardChunk.match(
      new RegExp(`store\\.steampowered\\.com\\/app\\/${appId}\\/[^"]*"[^>]*>([^<]+)<\\/a>`)
    );
    let title = titleMatch ? titleMatch[1].trim() : `App ${appId}`;
    title = decodeHtmlEntities(title);

    // Extraer imagen oficial del juego
    const imgMatch = cardChunk.match(
      new RegExp(`src="(https?:\\/\\/[^"]*apps\\/${appId}\\/[^"]+)"`)
    );
    const imageUrl = imgMatch
      ? imgMatch[1].split('?')[0]
      : `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`;

    // Extraer precio
    let price: number | null = null;
    let currency = 'EUR';

    // 1. Si hay descuento, el precio final está en el aria-label o en el contenedor de descuento
    const ariaDiscountMatch = cardChunk.match(/con el descuento es de\s*(\d+[\.,]\d{2})\s*€/i);
    const currentPriceClassMatch = cardChunk.match(/class="[^"]*-HQzBzl6lqI-[^"]*">(\d+[\.,]\d{2})\s*€<\/div>/);

    if (ariaDiscountMatch) {
      price = parseFloat(ariaDiscountMatch[1].replace(',', '.'));
    } else if (currentPriceClassMatch) {
      price = parseFloat(currentPriceClassMatch[1].replace(',', '.'));
    } else {
      // 2. Búsqueda genérica de precio en EUR
      const eurMatches = [...cardChunk.matchAll(/(\d+[\.,]\d{2})\s*€/g)];
      if (eurMatches.length > 0) {
        price = parseFloat(eurMatches[eurMatches.length - 1][1].replace(',', '.'));
      } else {
        // Soporte secundario para USD
        const usdMatches = [...cardChunk.matchAll(/\$\s*(\d+[\.,]\d{2})/g)];
        if (usdMatches.length > 0) {
          price = parseFloat(usdMatches[usdMatches.length - 1][1].replace(',', '.'));
          currency = 'USD';
        }
      }
    }

    items.push({
      appId,
      title,
      price,
      currency,
      url: `https://store.steampowered.com/app/${appId}`,
      imageUrl,
    });
  }

  return items;
}

/**
 * GET /api/steam/wishlist?steamIdentifier=<vanityUrl_o_steamId64>
 */
export const getSteamWishlist = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { steamIdentifier } = req.query;

    if (!steamIdentifier || typeof steamIdentifier !== 'string' || !steamIdentifier.trim()) {
      res.status(400).json({
        success: false,
        message: 'El parámetro steamIdentifier es requerido (nombre de usuario, URL o SteamID64)',
      });
      return;
    }

    const rawInput = steamIdentifier.trim();

    // Soporte especial para testeo rápido o demo
    if (
      rawInput.toLowerCase() === 'demo' ||
      rawInput.toLowerCase() === 'mock' ||
      rawInput.toLowerCase() === 'test'
    ) {
      res.status(200).json({
        success: true,
        count: MOCK_STEAM_WISHLIST.length,
        steamId64: '76561198000000000',
        items: MOCK_STEAM_WISHLIST,
      });
      return;
    }

    const { identifier, isSteamId64 } = normalizeSteamInput(rawInput);
    let steamId64 = isSteamId64 ? identifier : null;

    if (!steamId64) {
      steamId64 = await resolveVanityToSteamId64(identifier);
    }

    // URLs potenciales para consultar
    const candidateUrls: string[] = [];
    if (steamId64) {
      candidateUrls.push(`https://store.steampowered.com/wishlist/profiles/${steamId64}/`);
    }
    if (!isSteamId64) {
      candidateUrls.push(`https://store.steampowered.com/wishlist/id/${identifier}/`);
    }

    const requestHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
    };

    let items: CleanSteamItem[] = [];
    let lastError: string | null = null;
    let successfulFetch = false;

    for (const url of candidateUrls) {
      try {
        const steamRes = await fetch(url, { headers: requestHeaders });

        if (!steamRes.ok) {
          continue;
        }

        // Si Steam redirige a la página principal de la tienda, la lista no existe o es privada
        if (steamRes.url.replace(/\/+$/, '') === 'https://store.steampowered.com') {
          lastError =
            'La lista de deseados de Steam parece ser privada o no existe. Asegúrate de configurar los "Detalles de los juegos" como "Público" en la privacidad de tu perfil de Steam.';
          continue;
        }

        const html = await steamRes.text();
        const parsed = parseWishlistHtml(html);

        if (parsed.length > 0) {
          items = parsed;
          successfulFetch = true;
          break;
        } else {
          // Comprobar si fue lista vacía o perfil privado
          if (
            html.includes('This profile is private') ||
            html.includes('El perfil es privado') ||
            html.includes('<title>Wishlist - Error</title>')
          ) {
            lastError =
              'La lista de deseados de Steam es privada. Asegúrate de configurar los "Detalles de los juegos" como "Público" en la privacidad de tu perfil de Steam.';
          } else {
            // Lista pública pero vacía
            items = [];
            successfulFetch = true;
            break;
          }
        }
      } catch (err: any) {
        lastError = err.message;
      }
    }

    if (!successfulFetch) {
      res.status(400).json({
        success: false,
        message:
          lastError ||
          'No se pudieron obtener juegos de la lista de deseados de Steam. Asegúrate de que el perfil y la lista sean públicos.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      count: items.length,
      steamId64: steamId64 || identifier,
      items,
    });
  } catch (error) {
    next(error);
  }
};
