
const minPartConfidence = 0.2;
const color1 = 'aqua';
const color2 = 'red';
const lineWidth = 3;
const maxAllowError = 50; //許される最小誤差

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

let correct_pose ;
let user_pose;
let error;
let score;

//ウェブカメラ作動
navigator.getUserMedia(
  { video: {} },
  stream => video2.srcObject = stream,
  err => console.error(err)
)

//ボタンをクリックするとスタート（ビデオが流れる）
document.getElementById("text-button").onclick = function() {
score = 0;
target_score = document.getElementById("score");
target_score.innerHTML = "SCORE: "+String(score);
target = document.getElementById("good");
target.innerHTML = "　";
  video1.play();
};

//ビデオが流れてる間のループ
video1.addEventListener('play', () => {
  setInterval(async () => {
    //ビデオの骨格表示（Multiple複数)
    posenet.load().then(function(net){
      return net.estimateMultiplePoses(video1, {
        flipHorizontal: false,
        maxDetections: 2,
        scoreThreshold: 0.6,
        nmsRadius: 20
      })
    }).then(function(poses){
      console.log("左側",poses);
      ctx1.clearRect(0, 0, contentWidth1,contentHeight1);
      poses.forEach(({ keypoints }) => {
        drawKeypoints(keypoints, minPartConfidence, ctx1, color1);
        drawSkeleton(keypoints, minPartConfidence, ctx1, color1);
      });

      correct_pose = poses[0];
    })

    //ウェブカメラの骨格表示（Single 1人)
    posenet.load().then(function(net) {
      const pose = net.estimateSinglePose(video2, {
        flipHorizontal: true
      });
      return pose;
    }).then(function(pose){
      // console.log("右側",pose);
      ctx2.clearRect(0, 0, contentWidth2,contentHeight2);
      drawKeypoints(pose.keypoints, minPartConfidence, ctx2, color2);
      drawSkeleton(pose.keypoints, minPartConfidence, ctx2, color2);  
      user_pose = pose;
    })
     
    error = calcAngleError(correct_pose, user_pose);
    target = document.getElementById("good");
    
    if(error <= maxAllowError){ 
      target.innerHTML = "GOOD!";
      score = score + 1;
      target_score = document.getElementById("score");
      target_score.innerHTML = "SCORE: "+String(score);

    }else{target.innerHTML = "　";}

  }, 500)
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

//以下こちらをコピペ　https://qiita.com/daiking1756/items/ba833e51b30421e760b5
function calcAngleError(correct_pose, user_pose){
  let error = 0;

  // Shoulder - Elbow
  error += calcKeypointAngleError(correct_pose, user_pose, 5, 7);
  error += calcKeypointAngleError(correct_pose, user_pose, 6, 8);

  // Elbow - Wrist
  error += calcKeypointAngleError(correct_pose, user_pose, 7, 9);
  error += calcKeypointAngleError(correct_pose, user_pose, 8, 10);

  // // Hip - Knee
  error += calcKeypointAngleError(correct_pose, user_pose, 11, 13);
  error += calcKeypointAngleError(correct_pose, user_pose, 12, 14);

  // // Knee - Ankle
  error += calcKeypointAngleError(correct_pose, user_pose, 13, 15);
  error += calcKeypointAngleError(correct_pose, user_pose, 14, 16);

  error /= 8;

  return error
}

// 正解ポーズとユーザポーズの、ある2つのkeypoint間の角度の誤差を計算
function calcKeypointAngleError(correct_pose, user_pose, num1, num2){
  let error = Math.abs(calcKeypointsAngle(correct_pose.keypoints, num1, num2) - calcKeypointsAngle(user_pose.keypoints, num1, num2))
  if(error <= 180) {
      return error
  } else {
      return 360 - error
  }
}

// keypoint[num1]とkeypoint[num2]の角度を計算
function calcKeypointsAngle(keypoints, num1, num2){
  return calcPositionAngle(keypoints[num1].position, keypoints[num2].position);
}

// position1とposition2を結ぶ線分の角度を計算
function calcPositionAngle(position1, position2){
  return calcAngleDegrees(position1.x, position1.y, position2.x, position2.y);
}

// 2点間の角度を計算
function calcAngleDegrees(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
}