(function(){
  const btn = document.getElementById('manekiCat');
  const countEl = document.getElementById('manekiCount');
  const msgEl = document.getElementById('manekiMessage');
  if (!btn || !countEl || !msgEl) return;

  const STORAGE_KEY = 'manekiClicks';
  let count = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);

  const milestones = [
    { min: 0, text: 'クリックして運気を呼び込もう' },
    { min: 1, text: 'ちょっとだけ運が向いてきた…?' },
    { min: 10, text: '小吉' },
    { min: 50, text: '中吉' },
    { min: 100, text: '大吉！' },
    { min: 500, text: '商売繁盛の予感' },
    { min: 1000, text: '招き猫アルゴリズム、覚醒！' },
    { min: 2000, text: 'アナタは、そこにいますか？' },
    { min: 3000, text: 'どんな希望の行動をしたいですか？' },
    { min: 4000, text: '君には重要な行動についてほしい' },
    { min: 5000, text: 'くぁｗせｄｒｆｔｇｙふじこｌ' }
  ];

  function messageFor(n){
    let text = milestones[0].text;
    for (const m of milestones){
      if (n >= m.min) text = m.text;
    }
    return text;
  }

  function render(){
    countEl.textContent = count.toLocaleString();
    msgEl.textContent = messageFor(count);
  }

  function spawnCoin(x, y){
    const coin = document.createElement('span');
    coin.className = 'coin-particle';
    coin.textContent = '徳';
    coin.style.left = x + 'px';
    coin.style.top = y + 'px';
    coin.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
    document.body.appendChild(coin);
    coin.addEventListener('animationend', () => coin.remove());
  }

  btn.addEventListener('click', (e) => {
    count += 1;
    localStorage.setItem(STORAGE_KEY, String(count));
    render();

    btn.classList.remove('bounce');
    void btn.offsetWidth;
    btn.classList.add('bounce');

    const rect = btn.getBoundingClientRect();
    const x = e.clientX || (rect.left + rect.width / 2);
    const y = e.clientY || (rect.top + rect.height / 2);
    spawnCoin(x, y);
  });

  const appealToggle = document.getElementById('manekiAppealToggle');
  const appealChoices = document.getElementById('manekiAppealChoices');
  const appealResult = document.getElementById('manekiAppealResult');

  if (appealToggle && appealChoices && appealResult){
    appealToggle.addEventListener('click', () => {
      appealResult.textContent = '';
      appealChoices.hidden = !appealChoices.hidden;
    });

    appealChoices.querySelectorAll('.appeal-btn').forEach((b) => {
      b.addEventListener('click', () => {
        const action = b.dataset.action;
        appealChoices.hidden = true;

        if (action === 'clear'){
          count = 0;
          localStorage.setItem(STORAGE_KEY, '0');
          render();
          appealResult.textContent = '';
        } else if (action === 'set5000'){
          appealResult.textContent = 'この申請は却下されました';
          setTimeout(() => { appealResult.textContent = ''; }, 2200);
        }
      });
    });
  }

  render();
})();
