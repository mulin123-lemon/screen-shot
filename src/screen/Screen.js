import React, { useState } from 'react';
import { cursorName } from './screenUtils';
import '../screen/Screen.css';

export default function Screen(props) {
  const [cutImgSrc, setcutImgSrc] = useState(null);
  const [pos, setpos] = useState({ x: 0, y: 0 });
  const [btn, setbtn] = useState(true);
  const dpr = 2;
  const cut = () => {
    const wrap = document.getElementById('clip-img-w');

    const width = wrap.clientWidth * dpr;
    const height = wrap.clientHeight * dpr;

    const clipcanvas = document.getElementById('clipcanvas');
    const drawcanvas = document.getElementById('drawcanvas');
    clipcanvas.width = width;
    clipcanvas.height = height;
    drawcanvas.width = width;
    drawcanvas.height = height;

    const drawCtx = drawcanvas.getContext('2d');
    const drawImg = document.createElement('img');
    drawImg.classList.add('img_anonymous');
    drawImg.crossOrigin = 'anonymous';
    drawImg.src = props.imgSrc;
    drawImg.onload = function () {
      ctx.scale(dpr, dpr);
      drawCtx.drawImage(this, 0, 0, width, height);
      if (props.vrImg) {
        drawVrImg(props.vrImg);
      }
    };
    const ctx = clipcanvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.strokeStyle = 'rgba(255,255,255,1)';
    //遮罩层
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillRect(0, 0, width, height);
    let start = null;
    let clipArea = null; //裁剪范围
    let inBoxCoord = null; //box内光标坐标
    let inBorderCoord = null; //order光标坐标
    let initCoord = null; //初始化坐標
    const insideBorder = 4;
    let clickBorderDown = false;

    clipcanvas.onmousedown = function (e) {
      // 如果已经裁剪，不能再裁剪
      if (!clipArea) {
        start = {
          x: e.offsetX,
          y: e.offsetY,
        };
        clipcanvas.style.cursor = 'Crosshair';
      } else {
        // 光标落在框内
        if (getinBox(e)) {
          inBoxCoord = {
            x: e.offsetX,
            y: e.offsetY,
          };
        }
        // 光标在边框上
        const isInBorder = getBorderBox(e);
        if (isInBorder) {
          inBorderCoord = {
            position: isInBorder,
            x: e.offsetX,
            y: e.offsetY,
          };
          clickBorderDown = true;
        }
      }
    };
    clipcanvas.onmousemove = function (e) {
      // 初始化画框
      if (start) {
        let offsetX = e.offsetX > wrap.clientWidth ? wrap.clientWidth : e.offsetX < 0 ? 0 : e.offsetX;
        let offsetY = e.offsetY > wrap.clientHeight ? wrap.clientHeight : e.offsetY < 0 ? 0 : e.offsetY;
        fillBox(start.x, start.y, offsetX - start.x, offsetY - start.y)
      }
      if (clipArea && !start) {
        // 光标落在边框上
        const isInBorder = getBorderBox(e);
        if (isInBorder || clickBorderDown) {
          clipcanvas.style.cursor = 'Crosshair';
        } else if (getinBox(e)) {
          // 光标落在边框内
          clipcanvas.style.cursor = 'move';
        } else {
          //光标落在边框外
          clipcanvas.style.cursor = 'default';
        }
      }
      //判断光标是否在box内
      if (inBoxCoord) {
        let x = initCoord.x + (e.offsetX - inBoxCoord.x);
        let y = initCoord.y + (e.offsetY - inBoxCoord.y);
        if (clipArea.w > 0) {
          if (x < 0) {
            x = 0;
          } else if (x + clipArea.w > wrap.clientWidth) {
            x = wrap.clientWidth - clipArea.w
          }
        } else {
          if (x + clipArea.w < 0) {
            x = 0 - clipArea.w;
          } else if (x > wrap.clientWidth) {
            x = wrap.clientWidth
          }
        }

        if (clipArea.h > 0) {
          if (y < 0) {
            y = 0;
          } else if (y + clipArea.h > wrap.clientHeight) {
            y = wrap.clientHeight - clipArea.h
          }
        } else {
          if (y + clipArea.h < 0) {
            y = 0 - clipArea.h;
          } else if (y > wrap.clientHeight) {
            y = wrap.clientHeight
          }
        }
        fill(x, y, clipArea.w, clipArea.h);
      }
      //判断边框是否在border上
      if (inBorderCoord) {
        boxResize(e);
      }
    };
    document.addEventListener('mouseup', function () {
      initCoord = clipArea;
      inBoxCoord = null;
      inBorderCoord = null;
      clickBorderDown = false;
      clipcanvas.style.cursor = 'default';
      if (clipArea) {
        const url = startClip(clipArea);
        //生成base64格式的图
        setcutImgSrc(url);
      }
      // 生成base64截图
      if (start) {
        start = null;
      }
    });
    function drawVrImg(vrScr) {
      const vrImage = document.createElement('img');
      vrImage.classList.add('img_vr');
      vrImage.crossOrigin = 'anonymous';
      vrImage.src = vrScr;
      vrImage.onload = function () {
        var mql = window.matchMedia('(orientation: portrait)');
        if (mql.matches) {
          drawCtx.drawImage(this, 0, height / 2, width, height / 2);
        } else {
          drawCtx.drawImage(this, width / 2, 0, width / 2, height);
        }
      };
    }
    function fillBox(x, y, offsetwidth, offsetheight) {
      const long = Math.min(Math.abs(offsetwidth), Math.abs(offsetheight))
      fill(x, y, offsetwidth > 0 ? long : -long, offsetheight > 0 ? long : -long)
    }
    function fill(x, y, widthX, heightY) {
      // const { w, h } = square(widthX, heightY);
      const w = widthX, h = heightY;
      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      //遮罩层
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillRect(0, 0, width, height);
      //画框
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillRect(x, y, w, h);
      //描边
      ctx.globalCompositeOperation = 'source-over';
      ctx.setLineDash([5]);
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.closePath();
      clipArea = {
        x,
        y,
        w,
        h,
      };
      bthPos(clipArea)
    }
    // 裁剪
    function startClip(area) {
      if (!area) {
        return null;
      }
      const canvas = document.createElement('canvas');
      canvas.classList.add('clip_canvas');
      canvas.width = Math.abs(area.w) * dpr;
      canvas.height = Math.abs(area.h) * dpr;
      const data = drawCtx.getImageData(area.x * dpr, area.y * dpr, area.w * dpr, area.h * dpr);
      const context = canvas.getContext('2d');
      context.putImageData(data, 0, 0);
      return canvas.toDataURL('image/png', 1);
    }
    // 光标在box内
    const getinBox = (e) => {
      const maxX = Math.max(clipArea.x + insideBorder, clipArea.x + clipArea.w - insideBorder);
      const minX = Math.min(clipArea.x + insideBorder, clipArea.x + clipArea.w - insideBorder);
      const inBoxX = e.offsetX > minX && e.offsetX < maxX;
      const maxY = Math.max(clipArea.y + insideBorder, clipArea.y + clipArea.h - insideBorder);
      const minY = Math.min(clipArea.y + insideBorder, clipArea.y + clipArea.h - insideBorder);
      const inBoxY = e.offsetY > minY && e.offsetY < maxY;
      return inBoxX && inBoxY;
    };
    // 光标在边框上
    const getBorderBox = (e) => {
      const { lt, rt, lb, rb } = getAngle();
      // 左上角
      if (getIsTrue(e, lt)) {
        return cursorName['lt'];
      } else if (getIsTrue(e, rt)) {
        return cursorName['rt'];
      } else if (getIsTrue(e, rb)) {
        return cursorName['rb'];
      } else if (getIsTrue(e, lb)) {
        return cursorName['lb'];
      } else {
        return null;
      }
    };
    // 光标是否在边框上
    const getIsTrue = (event, position) => {
      const { offsetX, offsetY } = event;
      return (
        offsetX < position[0] + insideBorder &&
        offsetX > position[0] - insideBorder &&
        offsetY < position[1] + insideBorder &&
        offsetY > position[1] - insideBorder
      );
    };
    // 调整box尺寸
    const boxResize = (e) => {
      const { position, x, y } = inBorderCoord;
      const width = Math.abs(initCoord.w);
      const height = Math.abs(initCoord.h);
      const { lt, rt, lb, rb } = getAngle();
      const newBox = {};
      const updatex = e.offsetX - x;
      const updatey = e.offsetY - y;
      switch (position) {
        case cursorName['lt']:
          newBox.newx = rb[0];
          newBox.newy = rb[1];
          newBox.neww = -width + updatex;
          newBox.newh = -height + updatey;
          break;
        case cursorName['rt']:
          newBox.newx = lb[0];
          newBox.newy = lb[1];
          newBox.neww = width + updatex;
          newBox.newh = -height + updatey;
          break;
        case cursorName['rb']:
          newBox.newx = lt[0];
          newBox.newy = lt[1];
          newBox.neww = width + updatex;
          newBox.newh = height + updatey;
          break;
        case cursorName['lb']:
          newBox.newx = rt[0];
          newBox.newy = rt[1];
          newBox.neww = -width + updatex;
          newBox.newh = height + updatey;
          break;
        default:
          break;
      }
      newBox.newx && fillBox(newBox.newx, newBox.newy, newBox.neww, newBox.newh);
    };
    // 获取四角坐标
    function getAngle() {
      const { x, y, w, h } = initCoord
      let lt, rt, lb, rb;
      if (w > 0 && h > 0) {
        lt = [x, y];
        rt = [x + w, y];
        lb = [x, y + h];
        rb = [x + w, y + h];
      } else if (w < 0 && h < 0) {
        lt = [x + w, y + h];
        rt = [x, y + h];
        lb = [x + w, y];
        rb = [x, y];
      } else if (w < 0 && h > 0) {
        lt = [x + w, y];
        rt = [x, y];
        lb = [x + w, y + h];
        rb = [x, y + h];
      } else if (w > 0 && h < 0) {
        lt = [x, y + h];
        rt = [x + w, y + h];
        lb = [x, y];
        rb = [x + w, y];
      } else {
        lt = [x, y];
        rt = [x, y];
        lb = [x, y];
        rb = [x, y];
      }
      return { lt, rt, lb, rb };
    }
    // 按钮位置
    const bthPos = (cArea) => {
      const btnBox = document.getElementById('btn_box_pos');
      let posx = cArea.w > 0 ? cArea.x + cArea.w : cArea.x;
      let posy = cArea.h > 0 ? cArea.y + cArea.h : cArea.y;
      if (btnBox) {
        if (posx < btnBox.clientWidth) {
          posx = btnBox.clientWidth
        }
        if (posy > (wrap.clientHeight - btnBox.clientHeight)) {
          posy = posy - 50
        }
      }
      setpos({ x: posx, y: posy + 10 });
    }
  };

  /**
   * 取消截图
   */
  const cancelCut = () => {
    //清除入参
    props.reset();
  };

  /**
   * 添加值图文报告
   */
  const saveScreen = () => {
    if (cutImgSrc) {
      setbtn(false);
      props.reset(cutImgSrc);
    }
  };

  /**
   * 打开弹窗的时候初始化
   */
  const init = () => {
    // canvas清空画布
    const wrap = document.getElementById('clip-img-w');
    const width = wrap.clientWidth * dpr;
    const height = wrap.clientHeight * dpr;
    const clipcanvas = document.getElementById('clipcanvas');
    const drawcanvas = document.getElementById('drawcanvas');
    clipcanvas.width = width;
    clipcanvas.height = height;
    drawcanvas.width = width;
    drawcanvas.height = height;
    const drawCtx = drawcanvas.getContext('2d');
    const ctx = clipcanvas.getContext('2d');
    drawCtx.clearRect(0, 0, width, height);
    ctx.clearRect(0, 0, width, height);
    //移除光标事件
    clipcanvas.onmousedown = null;
    clipcanvas.onmousemove = null;
    document.removeEventListener('mouseup', () => { }, false);
    // 移除创建的img节点,避免重复创建
    const imgDom = document.getElementsByClassName('img_anonymous');
    if (imgDom.length > 0) {
      imgDom[0].parentNode.removeChild(imgDom[0]);
    }
    const imgVrDom = document.getElementsByClassName('img_vr');
    if (imgVrDom.length > 0) {
      imgVrDom[0].parentNode.removeChild(imgVrDom[0]);
    }
    const clipCanvasDom = document.getElementsByClassName('clip_canvas');
    if (clipCanvasDom.length > 0) {
      clipCanvasDom[0].parentNode.removeChild(clipCanvasDom[0]);
    }
    //清除button坐标
    setpos({ x: 0, y: 0 });
    //清除截图
    setcutImgSrc('');
    //避免同一张图没有更新
    setcutImgSrc(props.imgSrc);
  };

  const onKeyDown = (e) => {
    if (e.keyCode === 27) {
      props.reset();
    } else {
      e.returnValue = false;
    }
  };

  React.useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    init();
    cut();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      init();
    };
  }, []);

  return (
    <>
      <div id="clip-img-w" className="img_box">
        <canvas id="drawcanvas"></canvas>
        <canvas id="clipcanvas"></canvas>
      </div>
      {pos.x !== 0 && pos.y !== 0 && (
        <div
          id='btn_box_pos'
          className="btn_box"
          style={{
            left: pos.x,
            top: pos.y,
          }}
        >
          <div className="btn_cancel" onClick={cancelCut}>
            删除
          </div>
          <div className="br"></div>
          <div className="btn_sure" onClick={saveScreen} style={{ pointerEvents: btn ? 'auto' : 'none', opacity: btn ? 1 : 0.6 }}>
            添加
          </div>
        </div>
      )}
    </>
  );
}
