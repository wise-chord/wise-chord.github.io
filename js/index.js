i18next.use(i18nextXHRBackend).init({
  lng: getBrowserLanguagePreference(),
  backend: { loadPath: '/locales/{{lng}}.json' }
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
var searchQuery = '';

async function loadPosts() {
  try {
    var res = await fetch('/posts.json');
    posts = await res.json();
    posts.sort(function(a, b) {
      return new Date(b.date) - new Date(a.date);
    });
    renderPostList();
  } catch (err) {
    console.error('Failed to load posts:', err);
  }
}

function langLabel(code) {
  return { en_GB: 'EN', zh_CN: '简体', zh_TW: '繁體', ja_JP: '日本語' }[code] || code;
}

function filterPosts(query) {
  if (!query) return posts.slice();
  var q = query.toLowerCase();
  return posts.filter(function(post) {
    var inTitle = post.title.toLowerCase().indexOf(q) !== -1;
    var inTags = post.tags.some(function(t) { return t.toLowerCase().indexOf(q) !== -1; });
    return inTitle || inTags;
  });
}

function renderPostList() {
  var container = document.getElementById('postList');
  if (!container) return;

  var filtered = filterPosts(searchQuery);

  if (filtered.length === 0) {
    container.innerHTML = '<p style="color:var(--md-sys-color-on-surface-variant);padding:2em 0;">' + i18next.t('noPosts') + '</p>';
    return;
  }

  var currentLang = i18next.language;
  var sorted = filtered.sort(function(a, b) {
    var aMatch = a.lang === currentLang ? 0 : 1;
    var bMatch = b.lang === currentLang ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    return new Date(b.date) - new Date(a.date);
  });

  container.innerHTML = sorted.map(function(post) {
    var trimmed = post.excerpt && post.excerpt.length > 120 ? post.excerpt.slice(0, 120) + '...' : (post.excerpt || '');
    var badge = post.lang !== currentLang ? '<span class="lang-badge">' + langLabel(post.lang) + '</span>' : '';
    var postUrl = '/posts/' + post.slug + '.html';

    return '<article class="post-card">' +
      '<a href="' + postUrl + '" style="text-decoration:none;color:inherit;display:block">' +
      '<div class="post-meta">' +
      '<span class="post-date">' + post.date + '</span>' +
      badge +
      '<div class="post-tags">' + post.tags.map(function(t) { return '<span class="chip">' + t + '</span>'; }).join('') + '</div>' +
      '</div>' +
      '<h3 class="post-title">' + post.title + '</h3>' +
      '<p class="post-excerpt">' + (trimmed || '...') + '</p>' +
      '<span class="text-btn">' + i18next.t('readMore') + '</span>' +
      '</a>' +
      '</article>';
  }).join('\n');
}

function generateTOC() {
  var postBody = document.querySelector('.post-body');
  if (!postBody) return;

  var headings = postBody.querySelectorAll('h2, h3, h4');
  if (headings.length < 2) return;

  // wrap post-body in post-layout
  var postLayout = document.createElement('div');
  postLayout.className = 'post-layout';
  postBody.parentNode.insertBefore(postLayout, postBody);
  postLayout.appendChild(postBody);

  // build TOC list
  var list = document.createElement('ul');
  list.className = 'toc-list';

  var sidebar, overlay;

  headings.forEach(function(h) {
    var level = parseInt(h.tagName.charAt(1), 10);
    var id = h.getAttribute('id');
    if (!id) {
      id = h.textContent.toLowerCase().replace(/[^a-z0-9\u00e0-\u00fc\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]+/g, '-').replace(/(^-|-$)/g, '');
      h.setAttribute('id', id);
    }

    var item = document.createElement('li');
    item.className = 'toc-item toc-level-' + level;

    var link = document.createElement('a');
    link.href = '#' + id;
    link.textContent = h.textContent;
    link.addEventListener('click', function(e) {
      e.preventDefault();
      var target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', '#' + id);
      }
      sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('show');
    });

    item.appendChild(link);
    list.appendChild(item);
  });

  // build sidebar
  sidebar = document.createElement('aside');
  sidebar.className = 'toc-sidebar';
  sidebar.setAttribute('aria-label', 'Table of contents');

  var toggle = document.createElement('button');
  toggle.className = 'toc-toggle';
  toggle.setAttribute('aria-label', 'Toggle table of contents');
  toggle.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>';

  var closeBtn = document.createElement('button');
  closeBtn.className = 'toc-close';
  closeBtn.setAttribute('aria-label', 'Close table of contents');
  closeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';

  var panel = document.createElement('div');
  panel.className = 'toc-panel';

  var title = document.createElement('div');
  title.className = 'toc-title';
  title.setAttribute('data-i18n', 'tableOfContents');
  title.textContent = 'Table of Contents';

  panel.appendChild(closeBtn);
  panel.appendChild(title);
  panel.appendChild(list);
  sidebar.appendChild(toggle);
  sidebar.appendChild(panel);
  postLayout.appendChild(sidebar);

  // overlay for mobile
  if (window.innerWidth < 1024) {
    overlay = document.createElement('div');
    overlay.className = 'toc-overlay';
    document.body.appendChild(overlay);
  }

  function toggleTOC() {
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('show');
  }

  toggle.addEventListener('click', function(e) {
    e.stopPropagation();
    toggleTOC();
  });

  closeBtn.addEventListener('click', function() {
    toggleTOC();
  });

  if (overlay) {
    overlay.addEventListener('click', function() {
      toggleTOC();
    });
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      toggleTOC();
    }
  });

  if (typeof updateLanguage === 'function') updateLanguage();
}

function setActiveNav(page) {
  document.querySelectorAll('.drawer-item').forEach(function(i) { i.classList.remove('active'); });
  document.querySelectorAll('.bottom-nav-item').forEach(function(i) { i.classList.remove('active'); });
  var drawerItem = document.querySelector('.drawer-item[data-page="' + page + '"]');
  if (drawerItem) drawerItem.classList.add('active');
  var navItem = document.querySelector('.bottom-nav-item[data-page="' + page + '"]');
  if (navItem) navItem.classList.add('active');
}

function showPage(page) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  var target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  setActiveNav(page);
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
  if (document.getElementById('postList')) {
    loadPosts();
  }

  document.getElementById('menuBtn').addEventListener('click', toggleDrawer);
  document.getElementById('overlay').addEventListener('click', closeDrawer);
  document.getElementById('themeBtn').addEventListener('click', toggleTheme);

  document.querySelectorAll('.drawer-item').forEach(function(item) {
    item.addEventListener('click', function(e) {
      var target = document.getElementById('page-' + this.dataset.page);
      if (target) {
        e.preventDefault();
        showPage(this.dataset.page);
      }
    });
  });

  document.querySelectorAll('.bottom-nav-item').forEach(function(item) {
    item.addEventListener('click', function(e) {
      var target = document.getElementById('page-' + this.dataset.page);
      if (target) {
        e.preventDefault();
        showPage(this.dataset.page);
      }
    });
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

  var searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      searchQuery = this.value;
      renderPostList();
    });
  }

  generateTOC();

  var initialPage = window.location.hash.slice(1) || '';
  if (!initialPage && window.location.pathname.indexOf('/posts/') === 0) {
    initialPage = 'blog';
  }
  if (!initialPage) initialPage = 'home';
  if (document.getElementById('page-' + initialPage)) {
    showPage(initialPage);
  } else {
    setActiveNav(initialPage);
  }
});
