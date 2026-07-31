(function () {
  var header = document.getElementById('header');
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');

  // на внутренних страницах шапка непрозрачная всегда: под ней нет первого экрана
  var alwaysSolid = header.classList.contains('header--static');
  function onScroll() {
    if (alwaysSolid) return;
    header.classList.toggle('header--solid', window.scrollY > 40 || menu.dataset.open === 'true');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    menu.dataset.open = String(open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню разделов' : 'Открыть меню разделов');
    document.body.style.overflow = open ? 'hidden' : '';
    onScroll();
  }

  burger.addEventListener('click', function () {
    setMenu(menu.dataset.open !== 'true');
  });

  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.dataset.open === 'true') {
      setMenu(false);
      burger.focus();
    }
  });

  // Полоса и оверлей взаимоисключающие: при уходе на десктоп оверлей закрывается
  var mq = window.matchMedia('(min-width: 960px)');
  (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(function () {
    if (mq.matches) setMenu(false);
  });
})();

/* Цифры считаются от 0 — как счётчики на сайте (модуль NLM016) */
(function () {
  var values = [].slice.call(document.querySelectorAll('.about__value[data-count]'));
  if (!values.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function run(el) {
    var to = parseInt(el.dataset.count, 10);
    var t0 = performance.now(), dur = 2000;
    (function step(now) {
      var k = Math.min(1, (now - t0) / dur);
      var v = Math.round(to * (1 - Math.pow(1 - k, 3)));           // плавное торможение
      el.textContent = v.toLocaleString('ru-RU');
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
    });
  }, { threshold: .6 });
  // на ноль не обнуляем заранее: если наблюдатель почему-то не сработает,
  // в блоке останутся настоящие цифры, а не нули
  values.forEach(function (el) { io.observe(el); });
})();

/* ============================================================
   Преимущества: пункты выезжают снизу, когда попадают в кадр.
   ============================================================ */
(function () {
  var items = [].slice.call(document.querySelectorAll('.adv__item'));
  if (!items.length) return;

  function show(el) { el.classList.add('is-in'); }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(show);
    return;
  }

  // проверяем на скролле, а не наблюдателем: наблюдатель в фоновой вкладке
  // не срабатывает, и текст оставался прозрачным
  function sweep() {
    for (var i = items.length - 1; i >= 0; i--) {
      var r = items[i].getBoundingClientRect();
      if (r.top < innerHeight * 0.92 && r.bottom > 0) { show(items[i]); items.splice(i, 1); }
    }
    if (!items.length) removeEventListener('scroll', sweep);
  }
  addEventListener('scroll', sweep, { passive: true });
  addEventListener('resize', sweep, { passive: true });
  sweep();

  // красный маркер едет по вертикальной линии — как в оригинале
  var list = document.querySelector('.advs__list');
  var runner = list && list.querySelector('.adv__runner');
  if (!runner) return;
  var ticking = false;
  function frame() {
    ticking = false;
    var r = list.getBoundingClientRect(), vh = innerHeight;
    var p = (vh * 0.65 - r.top) / (r.height + vh * 0.15);
    p = Math.max(0, Math.min(1, p));
    runner.style.transform = 'translateY(' + (p * Math.max(0, r.height - 13)).toFixed(1) + 'px)';
  }
  function tick() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', tick, { passive: true });
  addEventListener('resize', tick, { passive: true });
  document.addEventListener('visibilitychange', tick);
  frame();
})();

/* ============================================================
   Линейки: переключение серий и конфигуратор карточки.
   Данные сняты с живого сайта. Полный набор опций и цена есть
   только по Bordo — её карточку прислали отрендеренной.
   Для остальных серий опции и цену нужно выгрузить из каталога.
   ============================================================ */
(function () {
  var host = document.getElementById('product');
  if (!host) return;

  var CDN = 'https://static.tildacdn.com/';
  var SERIES = {
    bordo: {
      name: 'Радиатор Bordo', sku: 'Bordo-500-2c',
      price: '14 444 ₽', priceNote: '500 мм · 2 секции · вертикальный',
      power: 'Мощность 143 Вт · отопит до 1,4 м²',
      full: true,
      photos: ['tild6439-6163-4130-a235-373638316430/29222781.jpeg',
               'tild3336-3630-4534-b232-366665333337/86050539.jpeg',
               'tild6532-3532-4531-b863-393135366535/96501236.jpeg'],
      desc: 'Bordo — завораживает удлинёнными формами и простотой линий, которые вдохновлены готическими замками Европы. Расположенный вертикально визуально увеличивает высоту потолков, горизонтально — расширяет пространство. Одно из главных достоинств — высокая теплоотдача при равных габаритах. Самая теплоэффективная серия.',
      profile: '60 мм x 30 мм (стенка профиля 2,5 мм)',
      notes: []
    },
    aria: {
      name: 'Радиатор Aria', sku: 'Aria-700-2c',
      price: 'Рассчитаем по конфигурации', priceNote: '',
      power: '', full: false,
      photos: ['tild3031-6361-4335-a437-643434613232/Aria__1.jpg',
               'tild6437-6531-4934-b834-386137656531/Aria__1.jpg',
               'tild6534-3336-4838-b534-303838393165/Aria__1.jpg'],
      desc: 'Aria — кто-то видит плашки деревянного заборчика, кто-то — солнечную панель. Общее у этих ассоциаций одно: тепло. Инженеры CALDO разработали кронштейны, позволяющие закрепить радиатор максимально близко к стене — за это серию полюбили родители, которые заказывают радиаторы в детские, где важен каждый сантиметр.',
      profile: '60 мм x 30 мм (стенка профиля 2,5 мм)',
      notes: ['От стены всего 58 мм.']
    },
    ronda: {
      name: 'Радиатор Ronda', sku: 'Ronda-500-2c',
      price: 'Рассчитаем по конфигурации', priceNote: '',
      power: '', full: false,
      photos: ['tild3437-3931-4565-b664-353535623236/90569782.jpeg',
               'tild6635-6532-4564-b831-623435396331/60023674.jpeg',
               'tild3063-6563-4132-b830-303334333562/59130284.jpeg'],
      desc: 'Ronda — добавляет в пространство мягкость благодаря скруглённым формам. На эту серию нас вдохновили изысканные интерьеры в стиле ампир, которые притягивают внимание и расслабляют.',
      profile: '42 мм (стенка профиля 2 мм)',
      notes: ['Для этой серии при вертикальной ориентации не рекомендовано боковое подключение. Это обусловлено потерей эстетики.', 'Из-за радиусности профиля теряется техническая возможность выполнить скрытое подключение.']
    },
    cube: {
      name: 'Радиатор Cube', sku: 'Cube-500-2c',
      price: 'Рассчитаем по конфигурации', priceNote: '',
      power: '', full: false,
      photos: ['tild3636-3939-4962-a336-336539653063/10975569.png',
               'tild6334-6532-4232-a437-393032306333/48538265.png',
               'tild6133-3664-4334-a661-326432313434/85027043.png'],
      desc: 'Cube — отражает динамичность современного мира лаконичными формами, которые вписываются в минималистичный интерьер.',
      profile: '40 мм x 40 мм (стенка профиля 2,5 мм)',
      notes: []
    },
    parts: {
      name: 'Комплектующие', sku: '',
      price: 'Рассчитаем по заявке', priceNote: '',
      power: '', full: false, noOpts: true,
      photos: ['tild6530-6335-4465-a562-636465383538/photo.png'],
      desc: 'Собрали в ассортименте все необходимые детали, чтобы не пришлось искать '
            + 'их в других магазинах: краны, кронштейны, терморегуляторы и полотенцедержатели.',
      profile: '', notes: []
    }
  };

  // Опции сняты с карточки Bordo
  var LEN = [500, 600, 700, 800, 900, 1000, 1250, 1500, 1750, 2000, 2250, 2500];
  var MOUNT = ['Вертикальный (U)', 'Горизонтальный (X)',
               'X на приварных опорах (+1 500 ₽)', 'X на съёмных опорах (+2 500 ₽)'];
  var CONN = ['Нижнее центральное', 'Нижнее правое', 'Нижнее левое', 'Нижнее разнесённое',
              'Боковое', 'Диагональное', 'По чертежу', 'Нужна консультация'];
  var RAL = ['1001','1013','1019','1023','2004','3001','3005','5013','5023','6002','6004',
             '7006','7012','7016','7021','7024','7030','7040','7047','8016','8019','8028',
             '9007','9005','9005 муар','9010','9016'];
  function sections() {
    var out = [];
    for (var n = 2; n <= 14; n++) out.push(n + ' (' + (80 + (n - 2) * 50) + ' мм)');
    return out;
  }

  var photo = document.getElementById('prod-photo');
  var thumbs = document.getElementById('prod-thumbs');
  var opts = document.getElementById('prod-opts');
  var warn = document.getElementById('prod-warn');

  function select(label, values) {
    var w = document.createElement('label');
    w.className = 'opt';
    var s = document.createElement('span');
    s.textContent = label;
    var sel = document.createElement('select');
    values.forEach(function (v) {
      var o = document.createElement('option');
      o.value = o.textContent = v;
      sel.appendChild(o);
    });
    w.appendChild(s); w.appendChild(sel);
    return w;
  }

  function setPhoto(src, i) {
    photo.style.backgroundImage = 'url(' + CDN + src + ')';
    [].forEach.call(thumbs.children, function (t, n) { t.classList.toggle('is-on', n === i); });
  }

  function render(key) {
    var d = SERIES[key];

    document.getElementById('prod-name').textContent = d.name;
    var sku = document.getElementById('prod-sku');
    sku.textContent = d.sku ? 'Артикул: ' + d.sku : '';
    sku.style.display = d.sku ? '' : 'none';

    document.getElementById('prod-price').textContent = d.price;
    var pn = document.getElementById('prod-pricenote');
    pn.textContent = d.priceNote; pn.style.display = d.priceNote ? '' : 'none';

    var pw = document.getElementById('prod-power');
    pw.textContent = d.power; pw.style.display = d.power ? '' : 'none';

    thumbs.innerHTML = '';
    d.photos.forEach(function (src, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'product__thumb';
      b.setAttribute('aria-label', 'Фото ' + (i + 1));
      b.style.backgroundImage = 'url(' + CDN + src + ')';
      b.addEventListener('click', function () { setPhoto(src, i); });
      thumbs.appendChild(b);
    });
    thumbs.style.display = d.photos.length > 1 ? '' : 'none';
    setPhoto(d.photos[0], 0);

    opts.innerHTML = '';
    if (!d.noOpts) {
      opts.appendChild(select('Длина, мм', LEN));
      opts.appendChild(select('Количество секций (ширина)', sections()));
      opts.appendChild(select('Тип расположения', MOUNT));
      opts.appendChild(select('Тип подключения', CONN));
      opts.appendChild(select('Цвет RAL', RAL));   // на сайте в заголовке ещё и «+0 ₽»
    }

    document.getElementById('prod-desc').textContent = d.desc;

    // три строки параметров с полужирными подписями — как в оригинале
    var params = document.getElementById('prod-params');
    params.innerHTML = '';
    if (d.profile) {
      [['Производится из профиля', d.profile],
       ['Минимальная длина профиля', '— 500 мм, максимальная — 2 500 мм'],
       ['Минимальное количество секций', '— 2']].forEach(function (row) {
        var p = document.createElement('p');
        var b = document.createElement('b');
        b.textContent = row[0];
        p.appendChild(b);
        p.appendChild(document.createTextNode(' ' + row[1]));
        params.appendChild(p);
      });
    }

    var notes = document.getElementById('prod-notes');
    notes.innerHTML = '';
    (d.notes || []).forEach(function (t) {
      var p = document.createElement('p');
      p.textContent = t;
      notes.appendChild(p);
    });

    warn.textContent = d.full
      ? ''
      : 'Цена и значения опций сняты только с карточки Bordo — её прислали отрендеренной. ' +
        'Для этой серии их нужно выгрузить из каталога.';
  }

  [].forEach.call(document.querySelectorAll('.tab'), function (tab) {
    tab.addEventListener('click', function () {
      [].forEach.call(document.querySelectorAll('.tab'), function (t) {
        t.setAttribute('aria-selected', String(t === tab));
      });
      render(tab.dataset.series);
    });
  });

  render('bordo');
})();


/* ============================================================
   Слайдер фотогалереи: кадры меняются сами, стрелки листают руками.
   ============================================================ */
(function () {
  [].slice.call(document.querySelectorAll('.slider')).forEach(function (box) {
    var slides = [].slice.call(box.querySelectorAll('.slider__slide'));
    if (slides.length < 2) { if (slides[0]) slides[0].classList.add('is-on'); return; }

    var i = 0, timer = null;
    // data-autoplay="off" — листается только руками: отзывы читают, а не смотрят
    var delay = box.dataset.autoplay === 'off' ? 0 : (+box.dataset.autoplay || 3000);
    var pause = !delay || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
    }
    function start() {
      if (pause) return;
      stop();
      timer = setInterval(function () { show(i + 1); }, delay);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    box.querySelector('.slider__arrow--prev').addEventListener('click', function () { show(i - 1); start(); });
    box.querySelector('.slider__arrow--next').addEventListener('click', function () { show(i + 1); start(); });
    box.addEventListener('mouseenter', stop);
    box.addEventListener('mouseleave', start);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });

    var first = slides.findIndex(function (s) { return s.classList.contains('is-on'); });
    show(first > 0 ? first : 0);
    start();
  });
})();
