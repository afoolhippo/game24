const bgm = new Audio("bgm.mp3");
bgm.loop = true;
bgm.volume = 0.35;

const seGood = new Audio("se_good.mp3");
seGood.volume = 0.18;

const nodes = {

  1:{x:56,y:44},
  2:{x:171,y:44},
  3:{x:341,y:54},

  4:{x:51,y:129},
  5:{x:186,y:139},
  6:{x:331,y:139},

  7:{x:66,y:219},
  8:{x:201,y:204},
  9:{x:336,y:229},

  10:{x:71,y:309},
  11:{x:201,y:309},
  12:{x:211,y:384},

  base:{x:220,y:460}

};

const connections = [

  [1,2],
  [1,4],

  [2,5],

  [3,6],

  [4,7],

  [5,6],
  [5,8],

  [6,9],

  [7,8],

  [8,11],

  [9,11],

  [10,11],

  [11,12],

  [12,"base"]

];

const graph = {};

Object.keys(nodes).forEach(k=>{

  graph[k] = [];

});

connections.forEach(([a,b])=>{

  graph[a].push(String(b));
  graph[b].push(String(a));

});

const roadsDiv =
document.getElementById("roads");

function drawRoads(){

  roadsDiv.innerHTML = "";

  connections.forEach(([a,b])=>{

    const A = nodes[a];
    const B = nodes[b];

    const dx = B.x - A.x;
    const dy = B.y - A.y;

    const length =
    Math.sqrt(dx*dx + dy*dy);

    const angle =
    Math.atan2(dy,dx)
    * 180 / Math.PI;

    const road =
    document.createElement("div");

    road.className = "road";

    road.style.left =
    A.x + "px";

    road.style.top =
    A.y + "px";

    road.style.width =
    length + "px";

    road.style.transform =
    `rotate(${angle}deg)`;

    roadsDiv.appendChild(road);

  });

}

drawRoads();

const suspects = {};

for(let i=1;i<=12;i++){

  suspects[i] =
  document.getElementById(
    "suspect"+i
  );

  const p = nodes[i];

  suspects[i].style.left =
  p.x - 62 + "px";

  suspects[i].style.top =
  p.y - 64 + "px";

}

const boy =
document.getElementById("boy");

const map =
document.getElementById("map");

const mapWrap =
document.getElementById("mapWrap");

const timeText =
document.getElementById("time");

const scoreText =
document.getElementById("score");

const finalScore =
document.getElementById(
  "finalScore"
);

const rankTitle =
document.getElementById(
  "rankTitle"
);

const resultComment =
document.getElementById(
  "resultComment"
);

const resultImage =
document.getElementById(
  "resultImage"
);

let queue = [];
let active = [];

let score = 0;
let time = 30;

let current = "base";

let moving = false;

let timer = null;
let spawnTimer = null;

function fitMap(){

  const scaleX =
  mapWrap.clientWidth / 440;

  const scaleY =
  mapWrap.clientHeight / 540;

  const scale =
  Math.min(scaleX,scaleY,1);

  map.style.transform =
  `scale(${scale})`;

}

window.addEventListener(
  "resize",
  fitMap
);

window.addEventListener(
  "load",
  fitMap
);

function showScreen(id){

  document
  .getElementById("titleScreen")
  .classList.remove("active");

  document
  .getElementById("gameScreen")
  .classList.remove("active");

  document
  .getElementById("resultScreen")
  .classList.remove("active");

  document
  .getElementById(id)
  .classList.add("active");

}

function startGame(){

  showScreen("gameScreen");

  bgm.currentTime = 0;
  bgm.play();

  fitMap();

  clearInterval(timer);
  clearInterval(spawnTimer);

  queue = [];
  active = [];

  score = 0;
  time = 30;

  current = "base";
  moving = false;

  moveBoyInstant("base");

  Object.values(suspects)
  .forEach(s=>{

    s.classList.add("hidden");

    s.classList.remove("queued");
    s.classList.remove("fadeOut");

  });

  updateUI();

  timer = setInterval(()=>{

    time--;

    updateUI();

    if(time <= 0){
      endGame();
    }

  },1000);

  spawnLoop();

}

function spawnLoop(){

  spawnTimer =
  setInterval(()=>{

    if(time <= 0){

      clearInterval(
        spawnTimer
      );

      return;

    }

    if(active.length >= 5){
      return;
    }

    const house =
    Math.floor(
      Math.random()*12
    ) + 1;

    if(active.includes(house)){
      return;
    }

    active.push(house);

    suspects[house]
    .classList.remove(
      "hidden"
    );

  },1000);

}

Object.keys(suspects)
.forEach(key=>{

  suspects[key].onclick = ()=>{

    const num =
    Number(key);

    if(queue.includes(num)){
      return;
    }

    if(queue.length >= 3){

      navigator.vibrate?.(
        120
      );

      return;

    }

    queue.push(num);

    suspects[num]
    .classList.add(
      "queued"
    );

    if(!moving){
      moveNext();
    }

  };

});

async function moveNext(){

  if(queue.length <= 0){

    moving = false;

    return;

  }

  moving = true;

  const target =
  queue.shift();

  const path =
  findPath(
    String(current),
    String(target)
  );

  for(
    const point of path.slice(1)
  ){

    await moveBoy(point);

  }

  current =
  String(target);

  await clearSuspect(target);

  active =
  active.filter(
    v=>v!==target
  );

  score++;

  updateUI();

  setTimeout(()=>{

    moveNext();

  },120);

}

function clearSuspect(target){

  return new Promise(resolve=>{

    const s =
    suspects[target];

    seGood.currentTime = 0;
    seGood.play();

    s.classList.remove(
      "queued"
    );

    s.classList.add(
      "fadeOut"
    );

    setTimeout(()=>{

      s.classList.add(
        "hidden"
      );

      s.classList.remove(
        "fadeOut"
      );

      resolve();

    },350);

  });

}

function findPath(start,goal){

  const visited =
  new Set();

  const prev = {};

  const q = [start];

  visited.add(start);

  while(q.length){

    const cur = q.shift();

    if(cur === goal){
      break;
    }

    graph[cur]
    .forEach(next=>{

      if(
        !visited.has(next)
      ){

        visited.add(next);

        prev[next] = cur;

        q.push(next);

      }

    });

  }

  const path = [goal];

  let cur = goal;

  while(cur !== start){

    cur = prev[cur];

    if(!cur){

      return [
        start,
        goal
      ];

    }

    path.unshift(cur);

  }

  return path;

}

function moveBoy(point){

  return new Promise(resolve=>{

    const p =
    nodes[point];

    boy.style.left =
    p.x - 46 + "px";

    boy.style.top =
    p.y - 46 + "px";

    setTimeout(
      resolve,
      360
    );

  });

}

function moveBoyInstant(point){

  const p =
  nodes[point];

  boy.style.transition =
  "none";

  boy.style.left =
  p.x - 46 + "px";

  boy.style.top =
  p.y - 46 + "px";

  requestAnimationFrame(()=>{

    boy.style.transition =
      "left .36s linear, top .36s linear";

  });

}

function updateUI(){

  timeText.textContent =
  time;

  scoreText.textContent =
  score;

}

function getResult(){

  if(score >= 14){

    return {

      rank:"即駆けつけ",

      comment:
      "今日も被害を未然に防いだ。",

      image:"result_good.png"

    };

  }

  if(score >= 6){

    return {

      rank:"ほどよく巡回",

      comment:
      "今日も町を見守った。",

      image:"result_normal.png"

    };

  }

  return {

    rank:"見逃し多数",

    comment:
    "気づくのが遅かった。",

    image:"result_bad.png"

  };

}

function endGame(){

  clearInterval(timer);
  clearInterval(spawnTimer);

  bgm.pause();

  const result =
  getResult();

  rankTitle.textContent =
  result.rank;

  resultComment.textContent =
  result.comment;

  resultImage.src =
  result.image;

  finalScore.textContent =
  `${score}件対応`;

  showScreen("resultScreen");

}

function backToTitle(){

  clearInterval(timer);
  clearInterval(spawnTimer);

  bgm.pause();

  showScreen("titleScreen");

}

document
.getElementById("startBtn")
.onclick = startGame;

document
.getElementById("titleImage")
.onclick = startGame;

document
.getElementById("retryBtn")
.onclick = backToTitle;

document
.getElementById("titleBackBtn")
.onclick = backToTitle;

document
.getElementById("homeBtn")
.onclick = ()=>{

  window.location.href =
  "https://afoolhippo.github.io/home/";

};

document
.getElementById("shareBtn")
.onclick = ()=>{

  const text =
`今日も町を見守りました 🚨

対応数 ${score}件

無料ブラウザゲーム
「セコムボーイ」

https://afoolhippo.github.io/game24/

#セコムボーイ
#カバゲーセン`;

  window.open(
    "https://twitter.com/intent/tweet?text="
    + encodeURIComponent(text),
    "_blank"
  );

};