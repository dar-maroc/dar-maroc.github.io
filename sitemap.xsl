<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="fr">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>Plan du site - DarMaroc</title>
        <style>
          body { font-family: 'Raleway', Arial, sans-serif; background: #0f0f0f; color: #e8e0cf; margin: 0; padding: 40px 20px; }
          .wrap { max-width: 860px; margin: 0 auto; }
          h1 { font-family: 'Playfair Display', Georgia, serif; color: #c9a227; font-weight: 700; margin: 0 0 6px; }
          p.sub { color: #9a9178; margin: 0 0 24px; font-size: 0.9rem; }
          table { width: 100%; border-collapse: collapse; background: #171717; border: 1px solid #2a2a2a; border-radius: 12px; overflow: hidden; }
          th { text-align: left; background: #1d1d1d; color: #c9a227; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; padding: 12px 16px; border-bottom: 1px solid #2a2a2a; }
          td { padding: 10px 16px; border-bottom: 1px solid #222; font-size: 0.85rem; word-break: break-all; }
          tr:last-child td { border-bottom: none; }
          a { color: #d8c87a; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .muted { color: #9a9178; }
          .badge { display: inline-block; background: #2a2413; color: #c9a227; border: 1px solid #4a3f1a; padding: 2px 10px; border-radius: 20px; font-size: 0.75rem; }
          .foot { margin-top: 24px; font-size: 0.8rem; color: #9a9178; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <h1>Plan du site — DarMaroc</h1>
          <p class="sub">Sitemap XML de https://dar-maroc.github.io</p>
          <table>
            <tr>
              <th>URL</th>
              <th>Dernière mise à jour</th>
              <th>Priorité</th>
            </tr>
            <xsl:for-each select="s:urlset/s:url">
              <tr>
                <td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td>
                <td class="muted"><xsl:value-of select="s:lastmod"/></td>
                <td><span class="badge"><xsl:value-of select="s:priority"/></span></td>
              </tr>
            </xsl:for-each>
          </table>
          <p class="foot">DarMaroc — Tout pour votre maison, tout le savoir-faire marocain.</p>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
