(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const elLevel = document.getElementById("level");
  const elLives = document.getElementById("lives");
  const elScore = document.getElementById("score");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayText = document.getElementById("overlayText");
  const btnRestart = document.getElementById("btnRestart");
  const btnContinue = document.getElementById("btnContinue");
  const btnOpen = document.getElementById("btnOpen");
  const btnQCM = document.getElementById("btnQCM");

  // Mise en forme bouton QCM comme les autres
  btnQCM.style.display = "none";

  const GAME = {
    level: 1,
    maxLevel: 5,
    lives: 3,
    score: 0,
    running: true,
    launched: false,
    paused: false,
    levelCompleted: false
  };

  // --- Event listeners des boutons ---
  btnRestart.addEventListener("click", () => {
    GAME.running = true;
    GAME.paused = false;
    GAME.lives = 3;
    GAME.score = 0;
    btnOpen.style.display = "none";
    startLevel(1);
  });

  btnContinue.addEventListener("click", () => {
    if (GAME.levelCompleted) {
      GAME.levelCompleted = false;
      btnOpen.style.display = "none";
      startLevel(GAME.level + 1);
    } else {
      GAME.paused = false;
      hideOverlay();
    }
  });

  btnOpen.addEventListener("click", () => {
    window.open("Cadeau_Papa.pdf", "_blank");
  });

  btnQCM.addEventListener("click", () => {
    startQCM();
  });

  const paddle = { w: 130, h: 14, x: canvas.width/2-65, y: canvas.height-28, speed: 9, vx: 0 };
  const ball = { r: 8, x: canvas.width/2, y: canvas.height-38, vx: 4.2, vy: -4.2 };

  const LEVELS = [
    null,
    { rows: 4, cols: 9, ballSpeed: 7.0, gap: 10, pattern: 'simple' },
    { rows: 5, cols: 10, ballSpeed: 4.0, gap: 9, pattern: 'double' },
    { rows: 6, cols: 11, ballSpeed: 4.5, gap: 8, pattern: 'double+grey' },
    { rows: 6, cols: 12, ballSpeed: 4.5, gap: 7, pattern: 'hard' },
    { rows: 7, cols: 12, ballSpeed: 5.0, gap: 6, pattern: 'hard+grey' },
  ];

  let bricks = [];
  let keys = { left:false, right:false };

  // --- HUD ---
  function updateHUD() {
    elLevel.textContent = `Niveau: ${GAME.level}/${GAME.maxLevel}`;
    elLives.textContent = `Vies: ${GAME.lives}`;
    elScore.textContent = `Score: ${GAME.score}`;
  }

  // --- Ball / Paddle ---
  function resetBallOnPaddle() {
    GAME.launched = false;
    ball.x = paddle.x + paddle.w/2;
    ball.y = paddle.y - ball.r - 2;
    ball.vx = 4.2;
    ball.vy = -4.2;
  }

  function normalizeBallSpeed(targetSpeed) {
    const speed = Math.hypot(ball.vx, ball.vy) || 1;
    const k = targetSpeed / speed;
    ball.vx *= k; ball.vy *= k;
  }

  // --- Niveaux ---
  function buildBricksForLevel(level) {
    const L = LEVELS[level];
    bricks = [];
    const marginX = 40;
    const marginTop = 60;
    const brickW = (canvas.width - marginX*2 - (L.cols-1)*L.gap)/L.cols;
    const brickH = 22;

    const pDouble = Math.min(0.2 + 0.15*(level-1), 0.6); // vert foncé
    const pGrey   = Math.min(0.02 + 0.02*(level-1), 0.25); // indestructible
    const pHole   = 0.05;

    for(let r=0;r<L.rows;r++){
      for(let c=0;c<L.cols;c++){
        let rand = Math.random();
        if(rand < pHole) continue;
        rand = Math.random();
        let hp = 1;
        if(rand < pGrey) hp = Infinity;
        else if(rand < pGrey + pDouble) hp = 2;

        bricks.push({
          x: marginX + c*(brickW+L.gap),
          y: marginTop + r*(brickH+L.gap),
          w: brickW, h: brickH,
          hp: hp,
          alive: true
        });
      }
    }
  }

  function startLevel(level) {
    GAME.running = true;
    GAME.level = level;
    paddle.x = canvas.width/2 - paddle.w/2;
    paddle.vx = 0;
    resetBallOnPaddle();
    buildBricksForLevel(level);
    normalizeBallSpeed(LEVELS[level].ballSpeed);
    GAME.paused = false;
    hideOverlay();
    updateHUD();
  }

  // --- Overlay ---
function showOverlay(title, text, type = "pause") {
  overlayTitle.textContent = title;
  overlayText.textContent = text;

  btnContinue.style.display = "none";
  btnRestart.style.display = "none";
  btnOpen.style.display = "none";

  if (type === "pause") {
    btnContinue.style.display = "inline-block";
  } 
  else if (type === "restart") {
    btnRestart.style.display = "inline-block";
    btnQCM.style.display = "inline-block";
  } 
  else if (type === "end") {
    btnOpen.style.display = "inline-block";
  }

  overlay.classList.remove("hidden");
}

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  // --- Collisions ---
  function circleRectCollision(cx,cy,r,rx,ry,rw,rh){
    const closestX = Math.max(rx, Math.min(cx, rx+rw));
    const closestY = Math.max(ry, Math.min(cy, ry+rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx*dx + dy*dy) <= r*r;
  }

  function reflectBallOnPaddle() {
    const hit = (ball.x - (paddle.x+paddle.w/2))/(paddle.w/2);
    const angle = hit * (Math.PI/3);
    const speed = Math.hypot(ball.vx, ball.vy);
    ball.vx = speed * Math.sin(angle);
    ball.vy = -Math.abs(speed * Math.cos(angle));
  }

  // --- Entrées clavier ---
  document.addEventListener("keydown", e => {
    if(e.code==="ArrowLeft") keys.left = true;
    if(e.code==="ArrowRight") keys.right = true;

if (e.code === "Space") {
  if (!GAME.running) return;

  if (GAME.levelCompleted) {
    if (GAME.level < GAME.maxLevel) {
      // Niveaux intermédiaires
      GAME.levelCompleted = false;
      btnOpen.style.display = "none";
      startLevel(GAME.level + 1);
    } else {
      // Dernier niveau : ne fait rien, laisse le bouton Ouvrir
      return;
    }
    return;
  }

  if (GAME.paused) {
    GAME.paused = false;
    hideOverlay();
  } else if (!GAME.launched) {
    GAME.launched = true;
  } else {
    GAME.paused = true;
    showOverlay("Pause", "Appuie sur Espace pour reprendre", "pause");
  }
}

if(e.code === "KeyH"){
    if(GAME.level < GAME.maxLevel){
        startLevel(GAME.level + 1);
    } else {
btnRestart.style.display = "none";
    btnContinue.style.display = "none";
    btnOpen.style.display = "inline-block";


        showOverlay(
            "Fin",
            "Bravo mon gros, tu es arrivé à la fin. Tu as enfin le droit à ton cadeau !",
            "end"
        );

        // Ne pas mettre GAME.levelCompleted = true ici
        // GAME.levelCompleted = true;
    }
}

  });

  document.addEventListener("keyup", e => {
    if(e.code==="ArrowLeft") keys.left = false;
    if(e.code==="ArrowRight") keys.right = false;
  });

  canvas.addEventListener("mousemove", e => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mx = (e.clientX - rect.left) * scaleX;
    paddle.x = Math.max(0, Math.min(canvas.width-paddle.w, mx-paddle.w/2));
    if(!GAME.launched) resetBallOnPaddle();
  });

  // --- Logique ---
  function step() {
    paddle.vx = keys.left?-paddle.speed: keys.right?paddle.speed:0;
    paddle.x += paddle.vx;
    paddle.x = Math.max(0, Math.min(canvas.width-paddle.w, paddle.x));

    if(!GAME.launched){ resetBallOnPaddle(); return; }

    ball.x += ball.vx;
    ball.y += ball.vy;

    if(ball.x-ball.r<0){ ball.x=ball.r; ball.vx*=-1; }
    if(ball.x+ball.r>canvas.width){ ball.x=canvas.width-ball.r; ball.vx*=-1; }
    if(ball.y-ball.r<0){ ball.y=ball.r; ball.vy*=-1; }

    if(circleRectCollision(ball.x,ball.y,ball.r,paddle.x,paddle.y,paddle.w,paddle.h) && ball.vy>0){
      ball.y = paddle.y-ball.r-1;
      reflectBallOnPaddle();
      normalizeBallSpeed(LEVELS[GAME.level].ballSpeed);
    }

    for(const b of bricks){
      if(!b.alive) continue;

      if(circleRectCollision(ball.x, ball.y, ball.r, b.x, b.y, b.w, b.h)){
        const overlapLeft = ball.x + ball.r - b.x;
        const overlapRight = b.x + b.w - (ball.x - ball.r);
        const overlapTop = ball.y + ball.r - b.y;
        const overlapBottom = b.y + b.h - (ball.y - ball.r);

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if(minOverlap === overlapLeft) ball.vx = -Math.abs(ball.vx);
        else if(minOverlap === overlapRight) ball.vx = Math.abs(ball.vx);
        else if(minOverlap === overlapTop) ball.vy = -Math.abs(ball.vy);
        else if(minOverlap === overlapBottom) ball.vy = Math.abs(ball.vy);

        b.hp--;
        if (b.hp !== Infinity) {
  if (b.hp <= 0) {
    b.alive = false;
    GAME.score += 5 * GAME.level;
  } else {
    GAME.score += 10 * GAME.level;
  }
}
        normalizeBallSpeed(LEVELS[GAME.level].ballSpeed);
        updateHUD();
      }
    }

    if(ball.y-ball.r>canvas.height){
      GAME.lives--; updateHUD();
      if(GAME.lives<=0){
        GAME.running=false; 
        GAME.paused=true;
        showOverlay("Perdu","Tu n'as plus de vies. Clique sur Recommencer", "restart");
        return;
      }
      resetBallOnPaddle();
      GAME.paused=true;
      showOverlay("Tu es tombé...","Tu as perdu une vie. Appuie sur Espace pour reprendre.", "pause");
      return;
    }

const remaining = bricks.filter(b => b.alive && b.hp !== Infinity).length;

if (remaining === 0) {
  GAME.running = false;
  GAME.paused = true;
  GAME.levelCompleted = true; // <- Important pour que btnOpen fonctionne

  if (GAME.level < GAME.maxLevel) {
    btnRestart.style.display = "none";
    btnContinue.style.display = "inline-block";
    btnOpen.style.display = "none";
    showOverlay(
      "Niveau terminé",
      `Bravo ! Appuie sur Espace ou Continuer pour passer au niveau ${GAME.level + 1}`,
      "pause"
    );
  } else {
    btnRestart.style.display = "none";
    btnContinue.style.display = "none";
    btnOpen.style.display = "inline-block";
    showOverlay(
      "Fin",
      "Bravo ! Tu as terminé le jeu ! Clique sur Ouvrir pour ton cadeau.",
"end"
    );
  }
}



  }

  // --- QCM ---
  const QUESTIONS = [
    {q:"Quel est mon plat préféré ?", a:["Pâtes","Pizza","Burger","Kebab"], correct:1},
    {q:"Quel est ma boisson favorite ?", a:["Coca","Bière","Eau","Café"], correct:2},
    {q:"Quelle est mon type préféré ?", a:["Marvel/Action","Comédie","Horreur/Thriller","Dessin animé/Animation"], correct:0},
    {q:"Quel est mon animal préféré ?", a:["Pingouin","Chien","Loutre","Hamster"], correct:2},
    {q:"Quel est mon super-héros préféré ?", a:["Iron Man","Spider Man","Black Widow","Doctor Strange"], correct:3},
  ];

  function startQCM() {
    GAME.paused = true;
    hideOverlay();
    let index = 0;
    let correctCount = 0;

    const qcmOverlay = document.createElement("div");
    qcmOverlay.style.position="fixed";
    qcmOverlay.style.top="0";
    qcmOverlay.style.left="0";
    qcmOverlay.style.width="100%";
    qcmOverlay.style.height="100%";
    qcmOverlay.style.background="rgba(0,0,0,0.9)";
    qcmOverlay.style.color="#fff";
    qcmOverlay.style.display="flex";
    qcmOverlay.style.flexDirection="column";
    qcmOverlay.style.justifyContent="center";
    qcmOverlay.style.alignItems="center";
    qcmOverlay.style.fontSize="20px";
    qcmOverlay.style.zIndex="9999";
    document.body.appendChild(qcmOverlay);

    function showQuestion() {
      qcmOverlay.innerHTML = "";
      if (index >= Math.min(5, QUESTIONS.length)) {
  GAME.lives += correctCount;
  updateHUD();
  document.body.removeChild(qcmOverlay);

  if (GAME.lives > 0) {
    // Reprise du jeu
    GAME.running = true;
    GAME.paused = true;
    resetBallOnPaddle();
    btnQCM.style.display = "none";
    showOverlay(
      "Bonne nouvelle",
      `Tu gagnes ${correctCount} vie(s). Appuie sur Espace pour reprendre.`,
      "pause"
    );
  } else {
    // Échec définitif
    btnQCM.style.display = "none";
    showOverlay(
      "Perdu",
      "Le QCM n'a pas suffi. Clique sur Recommencer.",
      "restart"
    );
  }

  return;
}
      const q = QUESTIONS[index];
      const qEl = document.createElement("div");
      qEl.textContent = q.q;
      qEl.style.marginBottom="20px";
      qcmOverlay.appendChild(qEl);

      q.a.forEach((ans,i)=>{
        const btn = document.createElement("button");
        btn.textContent = ans;
        btn.style.margin="5px";
        btn.style.padding="10px 20px";
        btn.style.fontSize = "16px";
        btn.addEventListener("click", ()=>{
          if(i===q.correct) correctCount++;
          index++;
          showQuestion();
        });
        qcmOverlay.appendChild(btn);
      });
    }

    showQuestion();
  }

  // --- Rendu ---
  const snowflakes = Array.from({length:50},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*2+1,vy:Math.random()*0.5+0.2}));

  function drawSnow(){
    ctx.fillStyle="rgba(255,255,255,0.8)";
    for(const s of snowflakes){
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
      s.y += s.vy;
      if(s.y>canvas.height){ s.y=0; s.x=Math.random()*canvas.width; }
    }
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawSnow();

    ctx.beginPath(); ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2); ctx.fillStyle="#ff4444"; ctx.fill();
    ctx.fillStyle="#555555"; ctx.fillRect(paddle.x,paddle.y,paddle.w,paddle.h);

    for(const b of bricks){
      if(!b.alive) continue;
      if(b.hp === Infinity) ctx.fillStyle = "#555555";
      else if(b.hp === 2) ctx.fillStyle = "#196619";
      else ctx.fillStyle = "#ff6666";
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }

    if(!GAME.launched && GAME.running){
      ctx.fillStyle="rgba(255,255,255,0.85)";
      ctx.font="18px system-ui";
      ctx.fillText("Espace pour lancer",18,canvas.height-18);
    }
  }

  function loop(){ if(GAME.running && !GAME.paused) step(); draw(); requestAnimationFrame(loop); }

  updateHUD();
  startLevel(1);
  loop();
})();
