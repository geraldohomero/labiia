async function fetchText(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Falha ao carregar ${path}`);
  }
  return response.text();
}

const THEME_STORAGE_KEY = 'labiia-theme';
const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';

function getCurrentPageKey() {
  return String(document.body?.dataset?.page || '').trim();
}

function setActiveNavigation() {
  const currentPage = getCurrentPageKey();
  document.querySelectorAll('.main-nav a[data-page]').forEach((link) => {
    const isActive = link.dataset.page === currentPage;
    link.classList.toggle('active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

async function mountLayoutComponent(selector, path) {
  const mountPoint = document.querySelector(selector);
  if (!mountPoint) {
    return;
  }

  const html = await fetchText(path);
  mountPoint.outerHTML = html;
}

async function loadLayoutComponents() {
  await Promise.all([
    mountLayoutComponent('#site-header', 'components/header.html'),
    mountLayoutComponent('#site-footer', 'components/footer.html'),
  ]);

  setActiveNavigation();
}

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEME_DARK : THEME_LIGHT;
}

function getStoredTheme() {
  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return value === THEME_DARK || value === THEME_LIGHT ? value : '';
}

function updateThemeToggleUi(theme) {
  const isDark = theme === THEME_DARK;
  document.querySelectorAll('.theme-toggle').forEach((button) => {
    button.setAttribute('aria-pressed', String(isDark));
    const actionLabel = isDark ? 'Ativar modo claro' : 'Ativar modo escuro';
    button.setAttribute('aria-label', actionLabel);
    button.setAttribute('title', actionLabel);
  });
}

function applyTheme(theme) {
  const safeTheme = theme === THEME_DARK ? THEME_DARK : THEME_LIGHT;
  document.documentElement.setAttribute('data-theme', safeTheme);
  updateThemeToggleUi(safeTheme);
}

function wireThemeToggle() {
  const toggles = document.querySelectorAll('.theme-toggle');
  if (!toggles.length) {
    return;
  }

  const initialTheme = getStoredTheme() || getSystemTheme();
  applyTheme(initialTheme);

  toggles.forEach((button) => {
    button.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || THEME_LIGHT;
      const nextTheme = currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
      applyTheme(nextTheme);
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    });
  });

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', () => {
    if (!getStoredTheme()) {
      applyTheme(getSystemTheme());
    }
  });
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Falha ao carregar ${path}`);
  }
  return response.json();
}

let integrantesIndexPromise;

async function getIntegrantesIndex() {
  if (integrantesIndexPromise) {
    return integrantesIndexPromise;
  }

  integrantesIndexPromise = (async () => {
    try {
      const manifest = await fetchJson('integrantes/integrantes.json');
      const records = await Promise.all(
        manifest.integrantes.map(async (entry) => {
          const data = await fetchJson(`integrantes/${entry.file}`);
          const slug = String(entry.file || '').replace(/\.json$/i, '').toLocaleLowerCase('pt-BR');
          return [slug, data];
        })
      );

      return new Map(records);
    } catch (_error) {
      return new Map();
    }
  })();

  return integrantesIndexPromise;
}

function escapeHtml(value) {
  const safeValue = String(value ?? '');
  return safeValue
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildIntegranteProfileUrl(slug) {
  return `integrante.html?slug=${encodeURIComponent(slug)}`;
}

function buildImportantLinks(links) {
  if (!Array.isArray(links) || !links.length) {
    return '<p class="preview-meta">Sem links cadastrados.</p>';
  }

  const items = links
    .map((link) => {
      const title = escapeHtml(link.titulo || 'Link');
      const url = escapeHtml(link.url || '#');
      return `<a class="integrante-link" href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>`;
    })
    .join('');

  return `<div class="important-links-inline">${items}</div>`;
}

function buildIntegranteCard(person) {
  const nome = escapeHtml(person['Nome']);
  const cargo = escapeHtml(person['Cargo']);
  const formacao = escapeHtml(person['Formação']);
  const minibiografia = escapeHtml(person['Minibiografia']);
  const imagem = escapeHtml(person['Imagem'] || '');
  const links = buildImportantLinks(person['Links importantes']);
  const slug = String(person.__slug || '').trim();
  const profileUrl = slug ? buildIntegranteProfileUrl(slug) : '';
  const nameMarkup = profileUrl
    ? `<a class="integrante-name-link" href="${profileUrl}"><h2 class="integrante-nome">${nome}</h2></a>`
    : `<h2 class="integrante-nome">${nome}</h2>`;
  const imageMarkup = imagem
    ? `${profileUrl
      ? `<a class="integrante-avatar-link" href="${profileUrl}"><img class="integrante-avatar" src="${imagem}" alt="Foto de ${nome}" loading="lazy"></a>`
      : `<img class="integrante-avatar" src="${imagem}" alt="Foto de ${nome}" loading="lazy">`
    }`
    : '';

  return `
    <article class="post-card integrante-card">
      <div class="integrante-head">
        ${imageMarkup}
        <div class="integrante-head-text">
          ${nameMarkup}
          <p class="integrante-role">${cargo} • ${formacao}</p>
        </div>
      </div>
      <p class="integrante-bio">${minibiografia}</p>
      ${links}
    </article>
  `;
}

async function loadIntegrantesPage() {
  const grid = document.querySelector('#integrantes-grid');
  if (!grid) {
    return;
  }

  try {
    const manifest = await fetchJson('integrantes/integrantes.json');
    const integrantes = await Promise.all(
      manifest.integrantes.map(async (entry) => {
        const data = await fetchJson(`integrantes/${entry.file}`);
        return {
          ...data,
          __slug: String(entry.file || '').replace(/\.json$/i, '').toLocaleLowerCase('pt-BR'),
        };
      })
    );

    grid.innerHTML = integrantes.map(buildIntegranteCard).join('');
  } catch (error) {
    grid.innerHTML = `
      <article class="post-card">
        <p class="preview-meta">Erro</p>
        <h2>Não foi possível carregar os integrantes</h2>
        <p>Confira os arquivos da pasta integrantes/ e use servidor local para abrir o site.</p>
      </article>
    `;
    console.error(error);
  }
}

function parseFrontMatter(markdownText) {
  const defaultResult = {
    metadata: {},
    body: markdownText,
  };

  if (!markdownText.startsWith('---\n')) {
    return defaultResult;
  }

  const endMarkerIndex = markdownText.indexOf('\n---\n', 4);
  if (endMarkerIndex === -1) {
    return defaultResult;
  }

  const frontMatterBlock = markdownText.slice(4, endMarkerIndex).trim();
  const body = markdownText.slice(endMarkerIndex + 5);
  const metadata = {};

  frontMatterBlock.split('\n').forEach((line) => {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      return;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    if (
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
    ) {
      metadata[key] = rawValue.slice(1, -1);
      return;
    }

    metadata[key] = rawValue;
  });

  return { metadata, body };
}

function buildPostCard(post) {
  const categoryTokens = post.categories.join('|');
  const categoryLabelText = post.categoryLabels.join(' • ');
  const authorsText = post.authorLinks.length
    ? `Por: ${post.authorLinks
      .map((author) => (author.url ? `<a href="${author.url}">${escapeHtml(author.name)}</a>` : escapeHtml(author.name)))
      .join(', ')}`
    : '';

  return `
    <article class="post-card" data-categories="${escapeHtml(categoryTokens)}">
      <p class="preview-meta">${escapeHtml(post.date)} • ${escapeHtml(categoryLabelText)}</p>
      ${authorsText ? `<p class="preview-meta">${authorsText}</p>` : ''}
      <h2>${escapeHtml(post.title)}</h2>
      <p>${escapeHtml(post.excerpt)}</p>
      <a href="post.html?slug=${encodeURIComponent(post.slug)}">Ler artigo</a>
    </article>
  `;
}

function parseListValue(rawValue) {
  if (!rawValue) {
    return [];
  }

  return String(rawValue)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeCategoryValue(category) {
  return String(category || '')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

function formatCategoryLabel(category) {
  const text = String(category || '').trim();
  if (!text) {
    return 'Categoria';
  }

  return text.charAt(0).toLocaleUpperCase('pt-BR') + text.slice(1);
}

function slugifyHeading(text, usedSlugs) {
  const baseSlug = String(text || '')
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

  const fallback = baseSlug || 'secao';
  let slug = fallback;
  let suffix = 2;

  while (usedSlugs.has(slug)) {
    slug = `${fallback}-${suffix}`;
    suffix += 1;
  }

  usedSlugs.add(slug);
  return slug;
}

function buildPostTocAndHtml(markdownBody) {
  if (!window.marked || typeof window.marked.parse !== 'function') {
    return {
      html: `<pre>${escapeHtml(markdownBody)}</pre>`,
      toc: [],
    };
  }

  const rawHtml = window.marked.parse(markdownBody);
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');
  const usedSlugs = new Set();
  const toc = [];

  doc.querySelectorAll('h2, h3').forEach((heading) => {
    const headingText = heading.textContent ? heading.textContent.trim() : '';
    const slug = slugifyHeading(headingText, usedSlugs);
    heading.setAttribute('id', slug);

    toc.push({
      id: slug,
      label: headingText,
      level: heading.tagName.toLowerCase() === 'h3' ? 3 : 2,
    });
  });

  return {
    html: doc.body.innerHTML,
    toc,
  };
}

function buildTocListMarkup(tocItems) {
  if (!tocItems.length) {
    return '<p class="preview-meta">Sem seções neste artigo.</p>';
  }

  return `
    <ul class="post-toc-list">
      ${tocItems
        .map(
          (item) =>
            `<li class="toc-level-${item.level}"><a href="#${escapeHtml(item.id)}">${escapeHtml(item.label)}</a></li>`
        )
        .join('')}
    </ul>
  `;
}

function normalizeAuthorKey(value) {
  return String(value || '').trim().toLocaleLowerCase('pt-BR');
}

function resolveAuthorNames(authorValues, integrantesIndex) {
  return authorValues.map((authorValue) => {
    const key = normalizeAuthorKey(authorValue);
    const integrante = integrantesIndex.get(key);
    if (integrante && integrante.Nome) {
      return {
        slug: key,
        name: String(integrante.Nome),
      };
    }

    return {
      slug: '',
      name: String(authorValue).trim(),
    };
  });
}

function buildDynamicFilters(posts) {
  const filtersContainer = document.querySelector('#blog-filters');
  if (!filtersContainer) {
    return;
  }

  const categoryMap = new Map();
  posts.forEach((post) => {
    post.categories.forEach((category, index) => {
      if (!categoryMap.has(category)) {
        categoryMap.set(category, post.categoryLabels[index] || category);
      }
    });
  });

  const categoryButtons = [...categoryMap.entries()]
    .map(
      ([category, label]) =>
        `<button class="filter" data-filter="${escapeHtml(category)}">${escapeHtml(label)}</button>`
    )
    .join('');

  filtersContainer.innerHTML = `
    <button class="filter active" data-filter="all">Todos</button>
    ${categoryButtons}
  `;
}

function wireFilters() {
  const filters = document.querySelectorAll('.filter');
  const posts = document.querySelectorAll('.post-card');

  if (!filters.length || !posts.length) {
    return;
  }

  filters.forEach((button) => {
    button.addEventListener('click', () => {
      filters.forEach((item) => item.classList.remove('active'));
      button.classList.add('active');

      const selected = button.dataset.filter;
      posts.forEach((post) => {
        const categories = (post.dataset.categories || '').split('|').filter(Boolean);
        const match = selected === 'all' || categories.includes(selected);
        post.style.display = match ? 'block' : 'none';
      });
    });
  });
}

function wireMobileMenu() {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');

  if (!header || !toggle || !nav) {
    return;
  }

  toggle.addEventListener('click', () => {
    const isOpen = header.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      header.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

async function loadBlogList() {
  const grid = document.querySelector('#posts-grid');
  if (!grid) {
    return;
  }

  try {
    const manifest = await fetchJson('posts/posts.json');
    const integrantesIndex = await getIntegrantesIndex();
    const posts = await Promise.all(
      manifest.posts.map(async (post) => {
        const markdown = await fetchText(`posts/${post.file}`);
        const { metadata } = parseFrontMatter(markdown);

        const categoriesRaw = parseListValue(
          metadata.categories || metadata.category || post.categories || post.category || 'método'
        );
        const categories = categoriesRaw.map((item) => normalizeCategoryValue(item));
        const categoryLabels = categoriesRaw.map((item) => formatCategoryLabel(item));
        const authorsRaw = parseListValue(
          metadata.authors || metadata.author || post.authors || post.author || ''
        );
        const authorLinks = resolveAuthorNames(authorsRaw, integrantesIndex)
          .map((author) => ({
            ...author,
            url: author.slug ? buildIntegranteProfileUrl(author.slug) : '',
          }));

        return {
          slug: post.slug,
          categories,
          categoryLabels,
          authorLinks,
          date: metadata.dateLabel || metadata.displayDate || metadata.date || post.date || 'Sem data',
          title: metadata.title || post.title || 'Sem título',
          excerpt: metadata.excerpt || post.excerpt || 'Sem resumo.',
        };
      })
    );

    buildDynamicFilters(posts);
    grid.innerHTML = posts.map(buildPostCard).join('');
    wireFilters();
  } catch (error) {
    grid.innerHTML = `
      <article class="post-card">
        <p class="preview-meta">Erro</p>
        <h2>Não foi possível carregar os posts</h2>
        <p>Tente abrir o site com servidor local (ex.: Live Server) para habilitar o carregamento dos arquivos Markdown.</p>
      </article>
    `;
    console.error(error);
  }
}

async function loadPostPage() {
  const article = document.querySelector('#post-content');
  if (!article) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!slug) {
    article.innerHTML = '<h1>Post não encontrado</h1><p>Use o blog para acessar um artigo válido.</p>';
    return;
  }

  try {
    const manifest = await fetchJson('posts/posts.json');
    const integrantesIndex = await getIntegrantesIndex();
    const post = manifest.posts.find((item) => item.slug === slug);

    if (!post) {
      article.innerHTML = '<h1>Post não encontrado</h1><p>Esse slug não existe no arquivo posts/posts.json.</p>';
      return;
    }

    const markdown = await fetchText(`posts/${post.file}`);
    const { metadata, body } = parseFrontMatter(markdown);
    const title = metadata.title || post.title || 'Sem título';
    const categoriesRaw = parseListValue(
      metadata.categories || metadata.category || post.categories || post.category || 'método'
    );
    const categories = categoriesRaw.map((item) => normalizeCategoryValue(item));
    const categoryLabels = categoriesRaw.map((item) => formatCategoryLabel(item));
    const authorsRaw = parseListValue(
      metadata.authors || metadata.author || post.authors || post.author || ''
    );
    const authorLinks = resolveAuthorNames(authorsRaw, integrantesIndex)
      .map((author) => ({
        ...author,
        url: author.slug ? buildIntegranteProfileUrl(author.slug) : '',
      }));
    const date = metadata.dateLabel || metadata.displayDate || metadata.date || post.date || 'Sem data';
    const excerpt = metadata.excerpt || post.excerpt || '';

    const tocResult = buildPostTocAndHtml(body);
    const tocList = buildTocListMarkup(tocResult.toc);

    document.title = `${title} | Blog LABIIA`;
    article.innerHTML = `
      <div class="post-layout">
        <div class="post-main">
          <p class="preview-meta">${escapeHtml(date)} • ${escapeHtml(categoryLabels.join(' • '))}</p>
          ${authorLinks.length
            ? `<p class="preview-meta">Por: ${authorLinks
              .map((author) => (author.url ? `<a href="${author.url}">${escapeHtml(author.name)}</a>` : escapeHtml(author.name)))
              .join(', ')}</p>`
            : ''}
          <h1>${escapeHtml(title)}</h1>
          <p class="post-lead">${escapeHtml(excerpt)}</p>
          <details class="post-toc-mobile">
            <summary>Sumário do artigo</summary>
            ${tocList}
          </details>
          <div class="post-markdown">${tocResult.html}</div>
          <p><a href="blog.html">Voltar ao blog</a></p>
        </div>
        <aside class="post-toc" aria-label="Sumário do artigo">
          <h2>Sumário</h2>
          ${tocList}
        </aside>
      </div>
    `;
  } catch (error) {
    article.innerHTML = '<h1>Erro ao carregar o post</h1><p>Confira os arquivos em posts/ e tente novamente.</p>';
    console.error(error);
  }
}

async function loadIntegranteProfilePage() {
  const container = document.querySelector('#integrante-profile');
  if (!container) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const slug = normalizeAuthorKey(params.get('slug') || '');

  if (!slug) {
    container.innerHTML = '<h1>Integrante não encontrado</h1><p>Use a página Quem somos para selecionar um integrante.</p>';
    return;
  }

  const integrantesIndex = await getIntegrantesIndex();
  const integrante = integrantesIndex.get(slug);

  if (!integrante) {
    container.innerHTML = '<h1>Integrante não encontrado</h1><p>Não foi possível localizar esse perfil.</p>';
    return;
  }

  const nome = escapeHtml(integrante['Nome'] || 'Integrante');
  const cargo = escapeHtml(integrante['Cargo'] || '');
  const formacao = escapeHtml(integrante['Formação'] || '');
  const minibiografia = escapeHtml(integrante['Minibiografia'] || '');
  const imagem = escapeHtml(integrante['Imagem'] || '');
  const links = buildImportantLinks(integrante['Links importantes']);

  const postsManifest = await fetchJson('posts/posts.json');
  const authoredPosts = (await Promise.all(
    postsManifest.posts.map(async (post) => {
      const markdown = await fetchText(`posts/${post.file}`);
      const { metadata } = parseFrontMatter(markdown);
      const authorsRaw = parseListValue(
        metadata.authors || metadata.author || post.authors || post.author || ''
      );
      const authorSlugs = authorsRaw.map((item) => normalizeAuthorKey(item));

      if (!authorSlugs.includes(slug)) {
        return null;
      }

      const categoriesRaw = parseListValue(
        metadata.categories || metadata.category || post.categories || post.category || 'método'
      );
      const categoryLabels = categoriesRaw.map((item) => formatCategoryLabel(item));

      return {
        slug: post.slug,
        title: metadata.title || post.title || 'Sem título',
        date: metadata.date || post.date || 'Sem data',
        excerpt: metadata.excerpt || post.excerpt || 'Sem resumo.',
        categoryLabels,
      };
    })
  )).filter(Boolean);

  const postsMarkup = authoredPosts.length
    ? `
      <div class="author-posts-list">
        ${authoredPosts
          .map(
            (post) => `
              <article class="post-card">
                <p class="preview-meta">${escapeHtml(post.date)} • ${escapeHtml(post.categoryLabels.join(' • '))}</p>
                <h3>${escapeHtml(post.title)}</h3>
                <p>${escapeHtml(post.excerpt)}</p>
                <a href="post.html?slug=${encodeURIComponent(post.slug)}">Ler artigo</a>
              </article>
            `
          )
          .join('')}
      </div>
    `
    : '<p class="preview-meta">Este integrante ainda não possui posts publicados.</p>';

  document.title = `${nome} | LABIIA`;
  container.innerHTML = `
    <p class="preview-meta">Perfil de integrante</p>
    <div class="integrante-head">
      ${imagem ? `<img class="integrante-avatar" src="${imagem}" alt="Foto de ${nome}" loading="lazy">` : ''}
      <div class="integrante-head-text">
        <h1 class="integrante-nome">${nome}</h1>
        <p class="integrante-role">${cargo}${cargo && formacao ? ' • ' : ''}${formacao}</p>
      </div>
    </div>
    <p class="integrante-bio">${minibiografia}</p>
    ${links}
    <section class="integrante-profile-posts">
      <h2>Posts deste autor</h2>
      ${postsMarkup}
    </section>
    <p><a href="quemsomos.html">Voltar para Quem somos</a></p>
  `;
}

async function initPage() {
  try {
    await loadLayoutComponents();
  } catch (error) {
    console.error('Falha ao carregar componentes de layout.', error);
  }

  wireMobileMenu();
  wireThemeToggle();

  await Promise.all([
    loadBlogList(),
    loadPostPage(),
    loadIntegrantesPage(),
    loadIntegranteProfilePage(),
  ]);
}

initPage();