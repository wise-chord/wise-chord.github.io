i18next.use(i18nextXHRBackend).init({
  lng: getBrowserLanguagePreference(),
  backend: { loadPath: 'locales/{{lng}}.json' }
}, function() {
  updateLanguage();
});

i18next.on('languageChanged', function() {
  updateLanguage();
  renderPostList();
});

function getPreferredTheme() {
  var stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
  var icon = document.getElementById('themeIcon');
  if (theme === 'dark') {
    icon.innerHTML = '<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 000-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>';
  } else {
    icon.innerHTML = '<path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>';
  }
}

function toggleTheme() {
  var next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  applyTheme(next);
}

var posts = [];

async function loadPosts() {
  try {
    var res = await fetch('posts.json');
    var files = await res.json();
    var results = await Promise.all(
      files.map(function(f) { return fetch(f).then(function(r) { return r.text(); }).then(parsePost); })
    );
    posts = results.filter(function(p) { return p !== null; }).sort(function(a, b) {
      return new Date(b.date) - new Date(a.date);
    });
    renderPostList();
  } catch (err) {
    console.error('Failed to load posts:', err);
  }
}

function parsePost(text) {
  try {
    var lines = text.split('\n');
    if (lines.length < 3 || lines[0].trim() !== '---') return null;
    var i = 1;
    var meta = {};
    while (i < lines.length && lines[i].trim() !== '---') {
      var colon = lines[i].indexOf(':');
      if (colon > 0) {
        var key = lines[i].slice(0, colon).trim();
        var value = lines[i].slice(colon + 1).trim();
        if (key === 'tags') {
          try { value = JSON.parse(value.replace(/'/g, '"')); } catch (e) { value = []; }
        }
        meta[key] = value;
      }
      i++;
    }
    var content = lines.slice(i + 1).join('\n').trim();
    return { title: meta.title || 'Untitled', date: meta.date || '', tags: meta.tags || [], lang: meta.lang || 'en_GB', content: content };
  } catch (e) {
    return null;
  }
}

function langLabel(code) {
  return { en_GB: 'en_GB', zh_CN: 'zh_CN', zh_TW: 'zh_TW', ja_JP: 'ja_JP' }[code] || code;
}

function renderPostList() {
  var container = document.getElementById('postList');
  if (!container) return;

  if (posts.length === 0) {
    container.innerHTML = '<p style="color:var(--md-sys-color-on-surface-variant);padding:2em 0;">' + i18next.t('noPosts') + '</p>';
    return;
  }

  var currentLang = i18next.language;
  var sorted = posts.slice().sort(function(a, b) {
    var aMatch = a.lang === currentLang ? 0 : 1;
    var bMatch = b.lang === currentLang ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    return new Date(b.date) - new Date(a.date);
  });

  container.innerHTML = sorted.map(function(post) {
    var origIndex = posts.indexOf(post);
    var excerpt = post.content
      .replace(/^#+\s+/gm, '')
      .replace(/[*_`~]/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .split('\n')
      .find(function(l) { return l.trim().length > 0; }) || '';

    var trimmed = excerpt.length > 120 ? excerpt.slice(0, 120) + '...' : excerpt;
    var badge = post.lang !== currentLang ? '<span class="lang-badge">' + langLabel(post.lang) + '</span>' : '';

    return '<article class="post-card" onclick="openPost(' + origIndex + ')">' +
      '<div class="post-meta">' +
      '<span class="post-date">' + post.date + '</span>' +
      badge +
      '<div class="post-tags">' + post.tags.map(function(t) { return '<span class="chip">' + t + '</span>'; }).join('') + '</div>' +
      '</div>' +
      '<h3 class="post-title">' + post.title + '</h3>' +
      '<p class="post-excerpt">' + (trimmed || '...') + '</p>' +
      '<span class="text-btn">' + i18next.t('readMore') + '</span>' +
      '</article>';
  }).join('\n');
}

function openPost(index) {
  var post = posts[index];
  if (!post) return;

  var container = document.getElementById('postContent');
  container.innerHTML =
    '<h2>' + post.title + '</h2>' +
    '<div class="post-meta">' +
    '<span class="post-date">' + post.date + '</span>' +
    '<div class="post-tags">' + post.tags.map(function(t) { return '<span class="chip">' + t + '</span>'; }).join('') + '</div>' +
    '</div>' +
    '<div class="post-body">' + marked.parse(post.content) + '</div>';

  showPage('post');
}

function closePost() {
  showPage('blog');
}

function showPage(page) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  var target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');

  document.querySelectorAll('.drawer-item').forEach(function(i) { i.classList.remove('active'); });
  document.querySelectorAll('.bottom-nav-item').forEach(function(i) { i.classList.remove('active'); });

  var drawerItem = document.querySelector('.drawer-item[data-page="' + page + '"]');
  if (drawerItem) drawerItem.classList.add('active');

  var navItem = document.querySelector('.bottom-nav-item[data-page="' + page + '"]');
  if (navItem) navItem.classList.add('active');

  closeDrawer();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  window.location.hash = page;
}

window.addEventListener('hashchange', function() {
  var page = window.location.hash.slice(1) || 'home';
  if (document.getElementById('page-' + page)) {
    showPage(page);
  }
});

function openDrawer() {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('overlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
  document.body.style.overflow = '';
}

function toggleDrawer() {
  var drawer = document.getElementById('drawer');
  if (drawer.classList.contains('open')) {
    closeDrawer();
  } else {
    openDrawer();
  }
}

document.addEventListener('DOMContentLoaded', function() {
  applyTheme(getPreferredTheme());
  loadPosts();

  document.getElementById('menuBtn').addEventListener('click', toggleDrawer);
  document.getElementById('overlay').addEventListener('click', closeDrawer);
  document.getElementById('themeBtn').addEventListener('click', toggleTheme);

  document.querySelectorAll('.drawer-item').forEach(function(item) {
    item.addEventListener('click', function() { showPage(this.dataset.page); });
  });

  document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
    item.addEventListener('click', function() { showPage(this.dataset.page); });
  });

  var langSelect = document.getElementById('langSelect');
  if (langSelect) {
    var trigger = langSelect.querySelector('.lang-select__trigger');
    var text = trigger.querySelector('.lang-select__text');
    var options = langSelect.querySelectorAll('.lang-select__option');

    text.textContent = i18next.language;

    trigger.addEventListener('click', function(e) {
      e.stopPropagation();
      langSelect.classList.toggle('open');
    });

    options.forEach(function(opt) {
      opt.addEventListener('click', function() {
        var value = this.dataset.value;
        text.textContent = value;
        langSelect.classList.remove('open');
        setLanguage(value);
      });
    });

    document.addEventListener('click', function() {
      langSelect.classList.remove('open');
    });
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeDrawer();
  });

  var initialPage = window.location.hash.slice(1) || 'home';
  if (document.getElementById('page-' + initialPage)) {
    showPage(initialPage);
  }
});
