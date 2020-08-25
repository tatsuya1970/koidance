
const minPartConfidence = 0.2;
const color1 = 'aqua';
const color2 = 'red';
const lineWidth = 3;

// const video = document.getElementById('cat');
const video1 = document.getElementById('video1');
const canvas1 = document.getElementById('canvas1');
const contentWidth1 = canvas1.width;
const contentHeight1 = canvas1.height;
const ctx1 = canvas1.getContext('2d');

const video2 = document.getElementById('video2');
const canvas2 = document.getElementById('canvas2');
const contentWidth2 = canvas2.width;
const contentHeight2 = canvas2.height;
const ctx2 = canvas2.getContext('2d');

//ウェブカメラ作動
navigator.getUserMedia(
  { video: {} },
  stream => video2.srcObject = stream,
  err => console.error(err)
)

//ボタンをクリックするとビデオが流れる
document.getElementById("text-button").onclick = function() {
  console.log("ビデオ流れる");
  video1.play();
};


//ビデオが流れてる間のループ
video1.addEventListener('play', () => {
  setInterval(async () => {
    //ビデオの骨格表示
    posenet.load().then(function(net){
      return net.estimateMultiplePoses(video1, {
        flipHorizontal: false,
        maxDetections: 2,
        scoreThreshold: 0.6,
        nmsRadius: 20
      })
    }).then(function(poses){
      console.log(poses);
      ctx1.clearRect(0, 0, contentWidth1,contentHeight1);
  
      poses.forEach(({ score, keypoints }) => {
        drawKeypoints(keypoints, minPartConfidence, ctx1, color1);
        drawSkeleton(keypoints, minPartConfidence, ctx1, color1);
      });
    })

    //ウェブカメラの骨格表示
    posenet.load().then(function(net){
      return net.estimateMultiplePoses(video2, {
        flipHorizontal: false,
        maxDetections: 2,
        scoreThreshold: 0.6,
        nmsRadius: 20
      })
    }).then(function(poses){
      console.log(poses);
      ctx2.clearRect(0, 0, contentWidth2,contentHeight2);
  
      poses.forEach(({ score, keypoints }) => {
        drawKeypoints(keypoints, minPartConfidence, ctx2, color2);
        drawSkeleton(keypoints, minPartConfidence, ctx2, color2);
      });
    })

  }, 300)
})



function toTuple({y, x}) {
  return [y, x];
}

function drawPoint(ctx, y, x, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawKeypoints(keypoints, minConfidence, ctx, color,scale = 1) {
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];

    if (keypoint.score < minConfidence) {
      continue;
    }

    const {y, x} = keypoint.position;
    drawPoint(ctx, y * scale, x * scale, 3, color);
  }
}

function drawSegment([ay, ax], [by, bx], color, scale, ctx) {
  ctx.beginPath();
  ctx.moveTo(ax * scale, ay * scale);
  ctx.lineTo(bx * scale, by * scale);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawSkeleton(keypoints, minConfidence, ctx, color,scale = 1) {
  const adjacentKeyPoints = posenet.getAdjacentKeyPoints(keypoints, minConfidence);

  adjacentKeyPoints.forEach((keypoints) => {
    drawSegment(
        toTuple(keypoints[0].position), toTuple(keypoints[1].position), color,
        scale, ctx);
  });
}