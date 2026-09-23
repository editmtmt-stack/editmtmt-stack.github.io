  // 共通パーツを読み込む関数
async function loadInclude(elementId, filePath) {
  const element = document.getElementById(elementId);
  if (element) {
    try {
      const response = await fetch(filePath);
      if (response.ok) {
        const html = await response.text();
        element.innerHTML = html;
      } else {
        console.error(`Error loading ${filePath}:${response.status}`);
      }
    } catch (error) {
      console.error(`Fetch error for ${filePath}:`, error);
    }
  }
}

// ページ読み込み完了時の処理
document.addEventListener('DOMContentLoaded', async () => {
  // 1. 共通パーツの非同期読み込みを実行
  // ※ await を使って、読み込みが終わるのを待ってから他のスクリプトを実行させます。
  await loadInclude('common-header', '/includes/header.html');
  await loadInclude('common-sidebar', '/includes/sidebar.html');
  await loadInclude('common-footer', '/includes/footer.html');

  // ----------------------------------------------------
  // 以下、既存のスクリプト（ハンバーガーメニューや検索機能など）
  // ----------------------------------------------------

  /* --- 1. ハンバーガーメニュー開閉処理 --- */
  const hamburgerBtn = document.querySelector('.hamburger-btn');
  const mainNav = document.querySelector('.main-nav');

  if (hamburgerBtn && mainNav) {
    hamburgerBtn.addEventListener('click', () => {
      hamburgerBtn.classList.toggle('active');
      mainNav.classList.toggle('active');

      const icon = hamburgerBtn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
      }
    });

    const navLinks = mainNav.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburgerBtn.classList.remove('active');
        mainNav.classList.remove('active');
        const icon = hamburgerBtn.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars');
          icon.classList.remove('fa-xmark');
        }
      });
    });
  }

  /* --- 2. 記事カード Show more 表示制御 --- */
  const sections = document.querySelectorAll('.card-section');

  sections.forEach(section => {
    const grid = section.querySelector('.article-grid');
    const btnWrapper = section.querySelector('.btn-wrapper');
    const btn = section.querySelector('.btn-more');

    if (!grid || !btn) return;

    const cards = grid.querySelectorAll('.article-card');

    if (cards.length <= 4) {
      if (btnWrapper) btnWrapper.style.display = 'none';
      return;
    }

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      grid.classList.toggle('is-open');

      if (grid.classList.contains('is-open')) {
        btn.innerHTML = 'Close <i class="fa-solid fa-chevron-up"></i>';
      } else {
        btn.innerHTML = 'Show more <i class="fa-solid fa-chevron-right"></i>';
      }
    });
  });

  /* --- 3. 記事キーワード検索機能 --- */
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');

  if (searchInput) {
    const filterArticles = () => {
      const keyword = searchInput.value.toLowerCase().trim();
      const articleCards = document.querySelectorAll('.article-card');

      articleCards.forEach(card => {
        const titleElement = card.querySelector('h3');
        const title = titleElement ? titleElement.textContent.toLowerCase() : '';

        if (keyword === '' || title.includes(keyword)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    };

    if (searchBtn) {
      searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        filterArticles();
      });
    }

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        filterArticles();
      }
    });
  }

  /* --- 4. 関連記事の自動取得・表示機能 (詳細ページ用) --- */
  const postDetail = document.querySelector('.post-detail');
  const relatedGrid = document.querySelector('.main-content .article-grid');

  if (postDetail && relatedGrid) {
    // カテゴリ名を取得 (例: "movie")
    const categoryBadge = postDetail.querySelector('.category-badge');
    const currentCategory = categoryBadge ? categoryBadge.textContent.trim().toLowerCase() : '';
    // 現在表示中の記事タイトルを取得（重複表示を避けるため）
    const currentTitle = postDetail.querySelector('.post-title')?.textContent.trim();

    if (currentCategory) {
      // index.html から全記事データを読み込む
      fetch('/index.html')
        .then(response => response.text())
        .then(htmlString => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlString, 'text/html');

          // index.html の該当カテゴリセクション (#movie, #graphic, #others) からカードを取得
          const categorySection = doc.getElementById(currentCategory);
          if (!categorySection) return;

          const cards = Array.from(categorySection.querySelectorAll('.article-card'));

          // 今開いている記事以外の同カテゴリ記事をフィルタリング
          const relatedCards = cards.filter(card => {
            const cardTitle = card.querySelector('h3')?.textContent.trim();
            return cardTitle !== currentTitle;
          });

          // 【追加】配列をランダムに並び替える（シャッフル）
          relatedCards.sort(() => Math.random() - 0.5);

          // 2件分取得して関連記事エリアに挿入
          const selectedCards = relatedCards.slice(0, 2);

          if (selectedCards.length > 0) {
            relatedGrid.innerHTML = ''; // 静的に書いてあったHTML要素をクリア
            selectedCards.forEach(card => {
              relatedGrid.appendChild(card.cloneNode(true));
            });
          }
        })
        .catch(err => {
          console.error('関連記事の自動取得に失敗しました:', err);
        });
    }
  }

/* --- ヘッダー検索機能 --- */
  const headerSearchWrap = document.querySelector('.header-search-wrap');
  const headerSearchToggle = document.querySelector('.header-search-toggle');
  const headerSearchForm = document.querySelector('.header-search-form');
  const headerSearchInput = document.querySelector('.header-search-input');
  const headerSearchExec = document.querySelector('.header-search-exec');
  const sidebarSearchInput = document.getElementById('searchInput');

  if (headerSearchToggle && headerSearchForm) {
    // 1. 虫眼鏡アイコンをクリックで検索フォーム開閉
    headerSearchToggle.addEventListener('click', (e) => {
      e.stopPropagation(); // ドキュメント側へのクリックイベント伝播を防止
      headerSearchForm.classList.toggle('is-active');
      if (headerSearchForm.classList.contains('is-active')) {
        headerSearchInput.focus();
      }
    });

    // 2. 検索バー（.header-search-wrap）の外側をクリックした時に閉じる処理
    document.addEventListener('click', (e) => {
      // フォームが開いていて、かつクリックされた要素が検索バーエリア外の場合
      if (headerSearchWrap && !headerSearchWrap.contains(e.target)) {
        headerSearchForm.classList.remove('is-active');
      }
    });

    // 3. Escキーを押した時にも閉じる（キーボード操作の利便性向上）
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        headerSearchForm.classList.remove('is-active');
      }
    });

    // ヘッダー検索の実行関数（サイドバーの検索窓と値を同期して検索を実行）
    const execHeaderSearch = () => {
      const query = headerSearchInput.value;
      if (sidebarSearchInput) {
        sidebarSearchInput.value = query;
        sidebarSearchInput.dispatchEvent(new Event('keydown'));
      }
    };

    if (headerSearchExec) {
      headerSearchExec.addEventListener('click', execHeaderSearch);
    }

    if (headerSearchInput) {
      headerSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          execHeaderSearch();
        }
      });
    }
  }

});
